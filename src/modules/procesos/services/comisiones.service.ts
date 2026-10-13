import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  EntityTarget,
  FindOptionsWhere,
  In,
  ObjectLiteral,
  QueryFailedError,
  Repository,
} from 'typeorm';

import { ErrorCode } from 'src/common/exceptions/error-codes';
import { PG_UNIQUE_VIOLATION } from 'src/common/exceptions/postgres-error-codes';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { ViaticosRole } from '../../auth/enums/viaticos-role.enum';

import { Actividad } from '../../catalogos/entities/actividad.entity';
import { Municipio } from '../../catalogos/entities/municipio.entity';
import { NivelAplicacion } from '../../catalogos/entities/nivel-aplicacion.entity';
import { Plantel } from '../../catalogos/entities/plantel.entity';
import { TarifaViaticos } from '../../catalogos/entities/tarifa-viaticos.entity';
import { Trabajador } from '../../catalogos/entities/trabajador.entity';
import { Vehiculo } from '../../catalogos/entities/vehiculo.entity';
import { TipoUnidad } from '../../catalogos/enums/tipo-unidad.enum';
import { VehiculoTipo } from '../../catalogos/enums/vehiculo-tipo.enum';

import { PUESTO_POR_DIRECCION } from '../constants/puesto-direccion.constant';
import { SIGLAS_POR_DIRECCION } from '../constants/siglas-direccion.constant';
import { Comision } from '../entities/comision.entity';
import { ComisionDestino } from '../entities/comision-destino.entity';
import { ComisionRevision } from '../entities/comision-revision.entity';
import { ComisionEstado } from '../enums/comision-estado.enum';
import {
  CreateComisionDestinoDto,
  CreateComisionDto,
  VehiculoParticularDto,
} from '../dto/comision/create-comision.dto';
import { UpdateComisionDto } from '../dto/comision/update-comision.dto';
import { FindComisionesQueryDto } from '../dto/comision/find-comisiones-query.dto';
import { CalcularDestinoQueryDto } from '../dto/comision/calcular-destino-query.dto';
import { AccionRevision, RevisarComisionDto } from '../dto/comision/revisar-comision.dto';
import {
  ComisionDestinoResponseDto,
  ComisionResponseDto,
} from '../dto/comision/comision-response.dto';
import {
  ResponsableActividadResponseDto,
  CalculoDestinoResponseDto,
} from '../dto/comision/consultas-response.dto';

const MS_POR_DIA = 86_400_000;

// "Rechazar" no tiene un estado propio en la lista; por ahora la comisión queda Cancelada.
const ESTADO_POR_ACCION: Record<AccionRevision, ComisionEstado> = {
  autorizar: ComisionEstado.AUTORIZADA,
  correccion: ComisionEstado.CORRECCION,
  rechazar: ComisionEstado.CANCELADA,
};

interface Responsable {
  direccion: Plantel | null;
  autoriza: string | null;
  puestoAutoriza: string | null;
}

@Injectable()
export class ComisionesService {
  constructor(
    @InjectRepository(Comision)
    private readonly comisionRepository: Repository<Comision>,

    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: FindComisionesQueryDto) {
    const {
      page = 1,
      limit = 25,
      folio,
      estado,
      direccionId,
      trabajador,
      sortOrder = 'DESC',
    } = query;

    const qb = this.baseQuery()
      .leftJoinAndSelect('comision.destinos', 'destino')
      .leftJoinAndSelect('destino.municipio', 'destinoMunicipio')
      .andWhere('comision.deletedAt IS NULL');

    // Por número de trabajador o por nombre / apellidos.
    if (trabajador) {
      qb.andWhere(
        `(
          CAST(trabajador.numero_trabajador AS TEXT) LIKE :trabajador
          OR UPPER(CONCAT_WS(' ', trabajador.nombre, trabajador.apellido_paterno, trabajador.apellido_materno)) LIKE :trabajador
          OR UPPER(CONCAT_WS(' ', trabajador.apellido_paterno, trabajador.apellido_materno, trabajador.nombre)) LIKE :trabajador
        )`,
        { trabajador: `%${trabajador.trim().toUpperCase()}%` },
      );
    }

    if (folio) {
      qb.andWhere('UPPER(comision.folio) LIKE :folio', {
        folio: `%${folio.trim().toUpperCase()}%`,
      });
    }

    if (estado !== undefined) {
      qb.andWhere('comision.estado = :estado', { estado });
    }

    if (direccionId) {
      qb.andWhere('comision.direccionId = :direccionId', { direccionId });
    }

    qb.orderBy('comision.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [comisiones, totalRecords] = await qb.getManyAndCount();

    return {
      data: comisiones.map((c) => this.toResponseDto(c)),
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  async findOne(id: string): Promise<ComisionResponseDto> {
    const comision = await this.baseQuery()
      .leftJoinAndSelect('comision.municipioOrigen', 'municipioOrigen')
      .leftJoinAndSelect('municipioOrigen.estado', 'estadoOrigen')
      .leftJoinAndSelect('comision.vehiculo', 'vehiculo')
      .leftJoinAndSelect('comision.destinos', 'destino')
      .leftJoinAndSelect('destino.municipio', 'destinoMunicipio')
      .leftJoinAndSelect('destinoMunicipio.estado', 'destinoEstado')
      .leftJoinAndSelect('destino.nivelAplicacion', 'destinoNivel')
      .where('comision.id = :id', { id })
      .andWhere('comision.deletedAt IS NULL')
      .leftJoinAndSelect('comision.revisiones', 'revision')
      .orderBy('destino.fechaDesde', 'ASC')
      .addOrderBy('revision.createdAt', 'ASC')
      .getOne();

    if (!comision) {
      throw this.notFound('Comisión no encontrada.');
    }

    return this.toResponseDto(comision);
  }

  async obtenerResponsable(actividadId: string): Promise<ResponsableActividadResponseDto> {
    const manager = this.dataSource.manager;
    const actividad = await this.findOrFail(manager, Actividad, actividadId, 'Actividad no encontrada.');
    const responsable = await this.responsableDe(manager, actividad);

    return {
      direccion: responsable.direccion
        ? { id: responsable.direccion.id, nombre: responsable.direccion.nombre }
        : null,
      autoriza: responsable.autoriza,
      puestoAutoriza: responsable.puestoAutoriza,
    };
  }

  // Vista previa de un destino: usa el mismo cálculo que se aplica al guardar la comisión.
  async calcularDestino(query: CalcularDestinoQueryDto): Promise<CalculoDestinoResponseDto> {
    const manager = this.dataSource.manager;

    await this.findOrFail(manager, NivelAplicacion, query.nivelAplicacionId, 'Nivel de aplicación no encontrado.');

    const municipios = await this.cargarMunicipios(manager, [query.municipioId]);
    const municipio = municipios.get(query.municipioId)!;
    const diasComision = this.calcularDias(query.fechaDesde, query.fechaHasta);
    const tarifa = await this.tarifaDe(manager, query.nivelAplicacionId, municipio, new Map());

    return {
      zona: this.zonaDe(municipio),
      diasComision,
      ...this.montosDe(tarifa, diasComision),
      conRecurso: tarifa !== null,
    };
  }

  async create(
    dto: CreateComisionDto,
    user: AuthenticatedUser,
  ): Promise<ComisionResponseDto> {
    const id = await this.dataSource.transaction(async (manager) => {
      const trabajador = await this.findOrFail(manager, Trabajador, dto.trabajadorId, 'Trabajador no encontrado.');

      if (!this.puedeGestionarOtros(user) && !this.esElMismoTrabajador(trabajador, user)) {
        throw this.forbidden('Solo puedes crear comisiones para ti mismo.');
      }

      const direccion = await this.findOrFail(manager, Plantel, dto.direccionId, 'Dirección no encontrada.');
      this.validarEsDireccion(direccion);

      const actividad = await this.findOrFail(manager, Actividad, dto.actividadId, 'Actividad no encontrada.');
      this.validarActividadDeDireccion(actividad, direccion);
      const responsable = await this.responsableDe(manager, actividad);

      const nivelAplicacionId = dto.nivelAplicacionId ?? dto.destinos[0].nivelAplicacionId;
      await this.findOrFail(manager, NivelAplicacion, nivelAplicacionId, 'Nivel de aplicación no encontrado.');
      await this.findOrFail(manager, Municipio, dto.municipioOrigenId, 'Municipio de origen no encontrado.');

      const vehiculoId = await this.resolverVehiculo(manager, dto.tipoTransporte, dto, user.id);

      const destinos = await this.crearDestinos(manager, dto.destinos, user.id);

      const comision = manager.create(Comision, {
        trabajadorId: dto.trabajadorId,
        direccionId: dto.direccionId,
        actividadId: dto.actividadId,
        nivelAplicacionId,
        municipioOrigenId: dto.municipioOrigenId,
        tipoTransporte: dto.tipoTransporte,
        vehiculoId,
        objetivo: dto.objetivo.trim(),
        conceptoOtros: dto.conceptoOtros?.trim() || null,
        autoriza: dto.autoriza?.trim() || responsable.autoriza,
        puestoAutoriza: dto.puestoAutoriza?.trim() || responsable.puestoAutoriza,
        createdBy: user.id,
        destinos,
      });

      const saved = await manager.save(comision);

      await manager.save(
        this.crearRevision(manager, saved.id, ComisionEstado.ENVIADA, null, user),
      );

      return saved.id;
    });

    return this.findOne(id);
  }

  async update(
    id: string,
    dto: UpdateComisionDto,
    user: AuthenticatedUser,
  ): Promise<ComisionResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const comision = await manager.findOne(Comision, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!comision) {
        throw this.notFound('Comisión no encontrada.');
      }

      const trabajador = await manager.findOne(Trabajador, {
        where: { id: comision.trabajadorId },
        withDeleted: true,
      });

      if (!trabajador || !this.esElMismoTrabajador(trabajador, user)) {
        throw this.forbidden('Solo puedes editar tus propias comisiones.');
      }

      if (comision.estado !== ComisionEstado.ENVIADA) {
        throw this.badRequest('Solo se pueden editar comisiones que aún no han sido aprobadas.');
      }

      if (dto.direccionId !== undefined || dto.actividadId !== undefined) {
        const direccion = await this.findOrFail(
          manager, Plantel, dto.direccionId ?? comision.direccionId, 'Dirección no encontrada.',
        );
        this.validarEsDireccion(direccion);

        const actividad = await this.findOrFail(
          manager, Actividad, dto.actividadId ?? comision.actividadId, 'Actividad no encontrada.',
        );
        this.validarActividadDeDireccion(actividad, direccion);

        if (dto.actividadId !== undefined) {
          const responsable = await this.responsableDe(manager, actividad);
          comision.autoriza = responsable.autoriza;
          comision.puestoAutoriza = responsable.puestoAutoriza;
        }

        comision.direccionId = direccion.id;
        comision.actividadId = actividad.id;
      }

      if (dto.nivelAplicacionId !== undefined) {
        await this.findOrFail(manager, NivelAplicacion, dto.nivelAplicacionId, 'Nivel de aplicación no encontrado.');
        comision.nivelAplicacionId = dto.nivelAplicacionId;
      }

      if (dto.municipioOrigenId !== undefined) {
        await this.findOrFail(manager, Municipio, dto.municipioOrigenId, 'Municipio de origen no encontrado.');
        comision.municipioOrigenId = dto.municipioOrigenId;
      }

      if (
        dto.tipoTransporte !== undefined ||
        dto.vehiculoId !== undefined ||
        dto.vehiculoParticular !== undefined
      ) {
        const tipo = dto.tipoTransporte ?? comision.tipoTransporte;
        if (tipo == null) {
          throw this.badRequest('Selecciona el tipo de transporte.');
        }

        comision.vehiculoId = await this.resolverVehiculo(manager, tipo, dto, user.id);
        comision.tipoTransporte = tipo;
      }

      if (dto.objetivo !== undefined) comision.objetivo = dto.objetivo.trim();
      if (dto.conceptoOtros !== undefined) comision.conceptoOtros = dto.conceptoOtros.trim() || null;
      if (dto.autoriza !== undefined) comision.autoriza = dto.autoriza.trim() || null;
      if (dto.puestoAutoriza !== undefined) comision.puestoAutoriza = dto.puestoAutoriza.trim() || null;

      comision.updatedBy = user.id;
      await manager.save(comision);

      if (dto.destinos !== undefined) {
        const nuevos = await this.crearDestinos(manager, dto.destinos, user.id);
        await manager.delete(ComisionDestino, { comisionId: id });
        nuevos.forEach((d) => (d.comisionId = id));
        await manager.save(nuevos);
      }
    });

    return this.findOne(id);
  }

  async revisar(
    id: string,
    dto: RevisarComisionDto,
    user: AuthenticatedUser,
  ): Promise<ComisionResponseDto> {
    const observaciones = dto.observaciones?.trim() || null;

    if (dto.accion !== 'autorizar' && !observaciones) {
      throw this.badRequest('Escribe en las observaciones el motivo de la corrección o del rechazo.');
    }

    await this.dataSource.transaction(async (manager) => {
      // Bloquea la fila: dos revisiones simultáneas de la misma comisión no generan dos folios.
      const comision = await manager.findOne(Comision, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!comision) {
        throw this.notFound('Comisión no encontrada.');
      }

      if (comision.estado !== ComisionEstado.ENVIADA) {
        throw this.badRequest('Solo se pueden revisar comisiones en estado Enviada.');
      }

      if (dto.accion === 'autorizar') {
        const direccion = await this.findOrFail(manager, Plantel, comision.direccionId, 'Dirección no encontrada.');
        comision.folio = await this.generarFolio(manager, this.siglasDeDireccion(direccion));
        comision.fechaAutorizacion = this.fechaHoy();
      }

      comision.estado = ESTADO_POR_ACCION[dto.accion];
      comision.updatedBy = user.id;
      await manager.save(comision);

      await manager.save(this.crearRevision(manager, id, comision.estado, observaciones, user));
    });

    return this.findOne(id);
  }

  private crearRevision(
    manager: EntityManager,
    comisionId: string,
    estado: ComisionEstado,
    observaciones: string | null,
    user: AuthenticatedUser,
  ): ComisionRevision {
    return manager.create(ComisionRevision, {
      comisionId,
      estado,
      observaciones,
      usuarioNombre: user.fullName,
      createdBy: user.id,
    });
  }

  private baseQuery() {
    return this.comisionRepository
      .createQueryBuilder('comision')
      .withDeleted()
      .leftJoinAndSelect('comision.trabajador', 'trabajador')
      .leftJoinAndSelect('comision.direccion', 'direccion')
      .leftJoinAndSelect('comision.actividad', 'actividad')
      .leftJoinAndSelect('comision.nivelAplicacion', 'nivelAplicacion');
  }

  // Oficial: vehículo del catálogo. Particular: se registra o actualiza en el catálogo.
  // Autobús / Otro: sólo se guarda el tipo de transporte, sin vehículo.
  private async resolverVehiculo(
    manager: EntityManager,
    tipo: VehiculoTipo,
    datos: { vehiculoId?: string; vehiculoParticular?: VehiculoParticularDto },
    userId: string,
  ): Promise<string | null> {
    if (tipo === VehiculoTipo.OFICIAL) {
      if (!datos.vehiculoId) {
        throw this.badRequest('Selecciona el vehículo oficial.');
      }

      const vehiculo = await this.findOrFail(manager, Vehiculo, datos.vehiculoId, 'Vehículo no encontrado.');
      if (vehiculo.tipo !== VehiculoTipo.OFICIAL || !vehiculo.status) {
        throw this.badRequest('El vehículo seleccionado no es un vehículo oficial activo.');
      }

      return vehiculo.id;
    }

    if (tipo === VehiculoTipo.PARTICULAR) {
      if (!datos.vehiculoParticular) {
        throw this.badRequest('Captura los datos del vehículo particular.');
      }

      return this.guardarVehiculoParticular(manager, datos.vehiculoParticular, userId);
    }

    return null;
  }

  private async guardarVehiculoParticular(
    manager: EntityManager,
    datos: VehiculoParticularDto,
    userId: string,
  ): Promise<string> {
    const { id, ...campos } = datos;

    let vehiculo: Vehiculo;
    if (id) {
      vehiculo = await this.findOrFail(manager, Vehiculo, id, 'Vehículo no encontrado.');
      if (vehiculo.tipo !== VehiculoTipo.PARTICULAR) {
        throw this.badRequest('El vehículo seleccionado no es un vehículo particular.');
      }
      Object.assign(vehiculo, campos, { updatedBy: userId });
    } else {
      vehiculo = manager.create(Vehiculo, {
        ...campos,
        tipo: VehiculoTipo.PARTICULAR,
        createdBy: userId,
      });
    }

    try {
      return (await manager.save(vehiculo)).id;
    } catch (error) {
      if (error instanceof QueryFailedError && (error as any).code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException({
          error: {
            code: ErrorCode.DUPLICATE_RESOURCE,
            message: `Ya existe un vehículo con la placa "${vehiculo.placa}".`,
            details: [],
          },
        });
      }
      throw error;
    }
  }

  private puedeGestionarOtros(user: AuthenticatedUser): boolean {
    return (user.rolesViaticos ?? []).includes(ViaticosRole.DIRECTOR);
  }

  private esElMismoTrabajador(trabajador: Trabajador, user: AuthenticatedUser): boolean {
    const numeroUsuario = Number(user.numeroTrabajador);
    return (
      Number.isInteger(numeroUsuario) &&
      trabajador.numeroTrabajador === numeroUsuario
    );
  }

  // El director de la actividad es el `director` registrado en la dirección dueña de la actividad.
  private async responsableDe(manager: EntityManager, actividad: Actividad): Promise<Responsable> {
    if (actividad.tipo > TipoUnidad.DIRECCION_CEMSAD) {
      return { direccion: null, autoriza: null, puestoAutoriza: null };
    }

    const direccion = await manager.findOne(Plantel, {
      where: { tipo: actividad.tipo },
    });

    return {
      direccion,
      autoriza: direccion?.director ?? null,
      puestoAutoriza: PUESTO_POR_DIRECCION[actividad.tipo] ?? null,
    };
  }

  private async crearDestinos(
    manager: EntityManager,
    destinos: CreateComisionDestinoDto[],
    userId: string,
  ): Promise<ComisionDestino[]> {
    await this.validarNiveles(manager, destinos.map((d) => d.nivelAplicacionId));

    const municipios = await this.cargarMunicipios(manager, destinos.map((d) => d.municipioId));
    const tarifas = new Map<string, TarifaViaticos | null>();
    const resultado: ComisionDestino[] = [];

    for (const d of destinos) {
      const diasComision = this.calcularDias(d.fechaDesde, d.fechaHasta);
      const tarifa = await this.tarifaDe(
        manager, d.nivelAplicacionId, municipios.get(d.municipioId)!, tarifas,
      );
      const montos = this.montosDe(tarifa, diasComision);

      resultado.push(
        manager.create(ComisionDestino, {
          municipioId: d.municipioId,
          nivelAplicacionId: d.nivelAplicacionId,
          descripcion: d.descripcion?.trim() || null,
          fechaDesde: d.fechaDesde,
          fechaHasta: d.fechaHasta,
          diasComision,
          ...montos,
          otros: d.otros ?? 0,
          createdBy: userId,
        }),
      );
    }

    return resultado;
  }

  // Sin recurso = el municipio no tiene zona o el tabulador no tiene tarifa vigente para ese nivel y zona.
  private async tarifaDe(
    manager: EntityManager,
    nivelAplicacionId: string,
    municipio: Municipio,
    tarifas: Map<string, TarifaViaticos | null>,
  ): Promise<TarifaViaticos | null> {
    const zona = this.zonaDe(municipio);
    if (!zona) return null;

    const clave = `${nivelAplicacionId}|${zona}`;
    if (!tarifas.has(clave)) {
      tarifas.set(clave, await this.tarifaVigente(manager, nivelAplicacionId, zona));
    }

    return tarifas.get(clave) ?? null;
  }

  // Alimentos se pagan por día y hospedaje por noche (una comisión de un solo día no lleva hospedaje).
  // El peaje es una sola vez por destino. Sin recurso, los montos quedan en 0.
  private montosDe(
    tarifa: TarifaViaticos | null,
    dias: number,
  ): { hospedaje: number; alimentos: number; peaje: number } {
    if (!tarifa) {
      return { hospedaje: 0, alimentos: 0, peaje: 0 };
    }

    return {
      hospedaje: this.redondear(Number(tarifa.tarifaHospedaje) * (dias - 1)),
      alimentos: this.redondear(Number(tarifa.tarifaAlimentos) * dias),
      peaje: this.redondear(Number(tarifa.tarifaPeaje ?? 0)),
    };
  }

  private async validarNiveles(manager: EntityManager, nivelIds: string[]): Promise<void> {
    const unicos = [...new Set(nivelIds)];
    const encontrados = await manager.count(NivelAplicacion, { where: { id: In(unicos) } });

    if (encontrados !== unicos.length) {
      throw this.notFound('Uno o más niveles de aplicación no existen.');
    }
  }

  private async tarifaVigente(
    manager: EntityManager,
    nivelAplicacionId: string,
    zona: string,
  ): Promise<TarifaViaticos | null> {
    return manager
      .getRepository(TarifaViaticos)
      .createQueryBuilder('tarifa')
      .leftJoin('tarifa.nivelAplicacion', 'nivel')
      .where('nivel.id = :nivelId', { nivelId: nivelAplicacionId })
      .andWhere('tarifa.zona = :zona', { zona })
      .andWhere('tarifa.vigenciaDesde <= CURRENT_DATE')
      .andWhere('(tarifa.vigenciaHasta IS NULL OR tarifa.vigenciaHasta >= CURRENT_DATE)')
      .orderBy('tarifa.vigenciaDesde', 'DESC')
      .getOne();
  }

  private async cargarMunicipios(
    manager: EntityManager,
    municipioIds: string[],
  ): Promise<Map<string, Municipio>> {
    const unicos = [...new Set(municipioIds)];
    const municipios = await manager.find(Municipio, {
      where: { id: In(unicos) },
      relations: { zona: true },
    });

    if (municipios.length !== unicos.length) {
      throw this.notFound('Uno o más municipios de destino no existen.');
    }

    return new Map(municipios.map((m) => [m.id, m]));
  }

  private zonaDe(municipio: Municipio): string | null {
    return municipio.zona?.zona ?? null;
  }

  private redondear(valor: number): number {
    return Math.round(valor * 100) / 100;
  }

  private validarActividadDeDireccion(actividad: Actividad, direccion: Plantel): void {
    if (actividad.tipo !== direccion.tipo) {
      throw this.badRequest('La actividad seleccionada no pertenece a la dirección elegida.');
    }
  }

  private validarEsDireccion(direccion: Plantel): void {
    if (direccion.tipo > TipoUnidad.DIRECCION_CEMSAD) {
      throw this.badRequest('La unidad seleccionada no es una dirección.');
    }
  }

  private siglasDeDireccion(direccion: Plantel): string {
    this.validarEsDireccion(direccion);

    const siglas = SIGLAS_POR_DIRECCION[direccion.tipo];
    if (!siglas) {
      throw this.badRequest(
        `La dirección "${direccion.nombre}" no tiene siglas configuradas para generar el folio.`,
      );
    }

    return siglas;
  }

  // El candado por siglas+año hace que dos aprobaciones simultáneas no tomen el mismo número;
  // se libera solo al terminar la transacción.
  private async generarFolio(manager: EntityManager, siglas: string): Promise<string> {
    const anio = new Date().getFullYear();

    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `comision_folio:${siglas}:${anio}`,
    ]);

    const [{ ultimo }] = await manager.query(
      `SELECT COALESCE(MAX(split_part(folio, '/', 2)::int), 0) AS ultimo
       FROM comision
       WHERE split_part(folio, '/', 1) = $1
         AND split_part(folio, '/', 3) = $2`,
      [siglas, String(anio)],
    );

    return `${siglas}/${Number(ultimo) + 1}/${anio}`;
  }

  private fechaHoy(): string {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${hoy.getFullYear()}-${mes}-${dia}`;
  }

  private calcularDias(fechaDesde: string, fechaHasta: string): number {
    const diferencia = Date.parse(fechaHasta) - Date.parse(fechaDesde);

    if (diferencia < 0) {
      throw this.badRequest('La fecha final de un destino no puede ser menor a la inicial.');
    }

    return Math.round(diferencia / MS_POR_DIA) + 1;
  }

  private async findOrFail<T extends ObjectLiteral>(
    manager: EntityManager,
    entity: EntityTarget<T>,
    id: string,
    message: string,
  ): Promise<T> {
    const found = await manager.findOne(entity, {
      where: { id } as unknown as FindOptionsWhere<T>,
    });

    if (!found) {
      throw this.notFound(message);
    }

    return found;
  }

  private notFound(message: string): NotFoundException {
    return new NotFoundException({
      error: { code: ErrorCode.RESOURCE_NOT_FOUND, message, details: [] },
    });
  }

  private badRequest(message: string): BadRequestException {
    return new BadRequestException({
      error: { code: ErrorCode.VALIDATION_FAILED, message, details: [] },
    });
  }

  private forbidden(message: string): ForbiddenException {
    return new ForbiddenException({
      error: { code: ErrorCode.FORBIDDEN, message, details: [] },
    });
  }

  private toResponseDto(c: Comision): ComisionResponseDto {
    const t = c.trabajador;

    return {
      id: c.id,
      folio: c.folio,
      estado: c.estado,
      trabajador: t
        ? {
            id: t.id,
            numeroTrabajador: t.numeroTrabajador,
            nombreCompleto: [t.apellidoPaterno, t.apellidoMaterno, t.nombre]
              .filter(Boolean)
              .join(' '),
            rfc: t.rfc,
          }
        : null,
      direccion: c.direccion
        ? {
            id: c.direccion.id,
            nombre: c.direccion.nombre,
            siglas: SIGLAS_POR_DIRECCION[c.direccion.tipo] ?? null,
          }
        : null,
      actividad: c.actividad
        ? {
            id: c.actividad.id,
            folio: c.actividad.folio,
            descripcion: c.actividad.descripcion,
          }
        : null,
      nivelAplicacion: c.nivelAplicacion
        ? { id: c.nivelAplicacion.id, nombre: c.nivelAplicacion.nombre }
        : null,
      municipioOrigen: c.municipioOrigen
        ? {
            id: c.municipioOrigen.id,
            nombre: c.municipioOrigen.nombre,
            estado: c.municipioOrigen.estado?.nombre ?? null,
          }
        : null,
      tipoTransporte: c.tipoTransporte,
      vehiculo: c.vehiculo
        ? {
            id: c.vehiculo.id,
            marca: c.vehiculo.marca,
            submarca: c.vehiculo.submarca,
            modelo: c.vehiculo.modelo,
            color: c.vehiculo.color,
            placa: c.vehiculo.placa,
          }
        : null,
      objetivo: c.objetivo,
      conceptoOtros: c.conceptoOtros,
      autoriza: c.autoriza,
      puestoAutoriza: c.puestoAutoriza,
      fechaElaboracion: c.fechaElaboracion,
      fechaAutorizacion: c.fechaAutorizacion,
      destinos: (c.destinos ?? []).map((d) => this.toDestinoResponseDto(d)),
      totalViaticos: this.redondear(
        (c.destinos ?? []).reduce(
          (total, d) =>
            total + Number(d.hospedaje) + Number(d.alimentos) + Number(d.peaje) + Number(d.otros),
          0,
        ),
      ),
      revisiones: (c.revisiones ?? []).map((r) => ({
        id: r.id,
        estado: r.estado,
        observaciones: r.observaciones,
        usuario: r.usuarioNombre,
        fecha: r.createdAt,
      })),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  private toDestinoResponseDto(d: ComisionDestino): ComisionDestinoResponseDto {
    return {
      id: d.id,
      municipio: d.municipio
        ? {
            id: d.municipio.id,
            nombre: d.municipio.nombre,
            estado: d.municipio.estado?.nombre ?? null,
          }
        : null,
      nivelAplicacion: d.nivelAplicacion
        ? { id: d.nivelAplicacion.id, nombre: d.nivelAplicacion.nombre }
        : null,
      descripcion: d.descripcion,
      fechaDesde: d.fechaDesde,
      fechaHasta: d.fechaHasta,
      diasComision: d.diasComision,
      hospedaje: Number(d.hospedaje),
      alimentos: Number(d.alimentos),
      peaje: Number(d.peaje),
      otros: Number(d.otros),
    };
  }
}
