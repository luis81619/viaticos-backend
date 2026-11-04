import {
  BadRequestException,
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
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import { ErrorCode } from 'src/common/exceptions/error-codes';
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
import { ACCION_POR_ESTADO_ANTERIOR, ComisionAccion } from '../enums/comision-accion.enum';
import { ComisionEstado } from '../enums/comision-estado.enum';
import {
  CreateComisionDestinoDto,
  CreateComisionDto,
} from '../dto/comision/create-comision.dto';
import { BorradorComisionDto } from '../dto/comision/borrador-comision.dto';
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
  ConteoEstadoResponseDto,
} from '../dto/comision/consultas-response.dto';

const MS_POR_DIA = 86_400_000;

// Quien la envió puede editarla mientras es borrador o cuando el director la devuelve a corrección.
const ESTADOS_EDITABLES = [ComisionEstado.BORRADOR, ComisionEstado.CORRECCION];

// "Rechazar" no tiene un estado propio en la lista; por ahora la comisión queda Cancelada.
const ESTADO_POR_ACCION: Record<AccionRevision, ComisionEstado> = {
  [ComisionAccion.AUTORIZAR]: ComisionEstado.AUTORIZADA,
  [ComisionAccion.CORRECCION]: ComisionEstado.CORRECCION,
  [ComisionAccion.RECHAZAR]: ComisionEstado.CANCELADA,
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

  async findAll(query: FindComisionesQueryDto, user: AuthenticatedUser) {
    const {
      page = 1,
      limit = 25,
      folio,
      estado,
      direccionId,
      trabajador,
      destino,
      sortOrder = 'DESC',
    } = query;

    const qb = this.baseQuery()
      .leftJoinAndSelect('comision.destinos', 'destino')
      .leftJoinAndSelect('destino.municipio', 'destinoMunicipio')
      .andWhere('comision.deletedAt IS NULL');

    this.aplicarAlcance(qb, user);

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

    // Con EXISTS la comisión sigue trayendo todos sus destinos, no sólo el que coincide.
    if (destino) {
      const conDestino = qb
        .subQuery()
        .select('1')
        .from(ComisionDestino, 'filtroDestino')
        .innerJoin('filtroDestino.municipio', 'filtroMunicipio')
        .where('filtroDestino.comisionId = comision.id')
        .andWhere('filtroDestino.deletedAt IS NULL')
        .andWhere('UPPER(filtroMunicipio.nombre) LIKE :destino')
        .getQuery();

      qb.andWhere(`EXISTS ${conDestino}`, { destino: `%${destino.trim().toUpperCase()}%` });
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
      data: comisiones.map((c) => this.toResponseDto(c, user)),
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  findOne(id: string, user: AuthenticatedUser): Promise<ComisionResponseDto> {
    return this.detalle(id, user);
  }

  async conteoPorEstado(user: AuthenticatedUser): Promise<ConteoEstadoResponseDto[]> {
    const qb = this.comisionRepository
      .createQueryBuilder('comision')
      .withDeleted()
      .leftJoin('comision.trabajador', 'trabajador')
      .select('comision.estado', 'estado')
      .addSelect('COUNT(comision.id)', 'total')
      .where('comision.deletedAt IS NULL')
      .groupBy('comision.estado');

    this.aplicarAlcance(qb, user);

    const filas = await qb.getRawMany<{ estado: number; total: string }>();
    return filas.map((f) => ({ estado: Number(f.estado), total: Number(f.total) }));
  }

  // Con usuario, sólo devuelve la comisión si ese usuario puede verla.
  // Sin usuario es para uso interno (la respuesta después de crear, editar o revisar).
  private async detalle(id: string, alcance?: AuthenticatedUser): Promise<ComisionResponseDto> {
    const qb = this.baseQuery()
      .leftJoinAndSelect('comision.municipioOrigen', 'municipioOrigen')
      .leftJoinAndSelect('municipioOrigen.estado', 'estadoOrigen')
      .leftJoinAndSelect('comision.vehiculo', 'vehiculo')
      .leftJoinAndSelect('comision.destinos', 'destino')
      .leftJoinAndSelect('destino.municipio', 'destinoMunicipio')
      .leftJoinAndSelect('destinoMunicipio.estado', 'destinoEstado')
      .leftJoinAndSelect('destino.nivelAplicacion', 'destinoNivel')
      .leftJoinAndSelect('comision.revisiones', 'revision')
      .where('comision.id = :id', { id })
      .andWhere('comision.deletedAt IS NULL')
      .orderBy('destino.fechaDesde', 'ASC')
      .addOrderBy('revision.createdAt', 'ASC');

    if (alcance) {
      this.aplicarAlcance(qb, alcance);
    }

    const comision = await qb.getOne();

    if (!comision) {
      throw this.notFound('Comisión no encontrada.');
    }

    return this.toResponseDto(comision, alcance);
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

  // Envío directo desde el wizard (sin pasar por borrador): se exige la comisión completa.
  async create(
    dto: CreateComisionDto,
    user: AuthenticatedUser,
  ): Promise<ComisionResponseDto> {
    const id = await this.dataSource.transaction(async (manager) => {
      const comision = manager.create(Comision, {
        estado: ComisionEstado.POR_AUTORIZAR,
        createdBy: user.id,
      });

      await this.asignarDatos(manager, comision, dto, user);
      this.validarCompleta(comision);

      const saved = await manager.save(comision);

      await manager.save(
        this.crearRevision(manager, saved.id, ComisionEstado.POR_AUTORIZAR, ComisionAccion.ENVIAR, null, user),
      );

      return saved.id;
    });

    return this.detalle(id);
  }

  async crearBorrador(
    dto: BorradorComisionDto,
    user: AuthenticatedUser,
  ): Promise<ComisionResponseDto> {
    const id = await this.dataSource.transaction(async (manager) => {
      const comision = manager.create(Comision, {
        estado: ComisionEstado.BORRADOR,
        createdBy: user.id,
      });

      await this.asignarDatos(manager, comision, dto, user);
      const saved = await manager.save(comision);

      await manager.save(
        this.crearRevision(manager, saved.id, ComisionEstado.BORRADOR, ComisionAccion.BORRADOR, null, user),
      );

      return saved.id;
    });

    return this.detalle(id);
  }

  // Reemplaza todo lo capturado (destinos incluidos) de un borrador o de una comisión en corrección,
  // sin cambiar su estado.
  async guardarBorrador(
    id: string,
    dto: BorradorComisionDto,
    user: AuthenticatedUser,
  ): Promise<ComisionResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const comision = await this.comisionEditable(manager, id, user);

      await manager.delete(ComisionDestino, { comisionId: id });
      await this.asignarDatos(manager, comision, dto, user);

      comision.updatedBy = user.id;
      await manager.save(comision);
    });

    return this.detalle(id);
  }

  // Borrador: se envía por primera vez. Corrección: se reenvía al director ya corregida.
  async enviarBorrador(id: string, user: AuthenticatedUser): Promise<ComisionResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const comision = await this.comisionEditable(manager, id, user);
      comision.destinos = await manager.find(ComisionDestino, { where: { comisionId: id } });

      this.validarCompleta(comision);

      const esPrimerEnvio = comision.estado === ComisionEstado.BORRADOR;

      // La fecha de elaboración es la del primer envío, no la de cuando se empezó a capturar.
      if (esPrimerEnvio) {
        comision.fechaElaboracion = this.fechaHoy();
      }

      comision.estado = ComisionEstado.POR_AUTORIZAR;
      comision.updatedBy = user.id;
      await manager.save(comision);

      await manager.save(
        this.crearRevision(
          manager,
          id,
          comision.estado,
          esPrimerEnvio ? ComisionAccion.ENVIAR : ComisionAccion.REENVIAR,
          null,
          user,
        ),
      );
    });

    return this.detalle(id);
  }

  async eliminarBorrador(id: string, user: AuthenticatedUser): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const comision = await this.comisionEditable(manager, id, user);

      // Una comisión en corrección ya fue enviada: se corrige, no se elimina.
      if (comision.estado !== ComisionEstado.BORRADOR) {
        throw this.badRequest('Solo se pueden eliminar borradores.');
      }

      comision.deletedBy = user.id;
      await manager.save(comision);
      await manager.softDelete(Comision, { id });
    });
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

      if (comision.direccionId !== user.plantelId) {
        throw this.forbidden('Solo puedes revisar comisiones de tu dirección.');
      }

      if (comision.estado !== ComisionEstado.POR_AUTORIZAR) {
        throw this.badRequest('Solo se pueden revisar comisiones en estado Por autorizar.');
      }

      if (dto.accion === 'autorizar') {
        // Una comisión Por autorizar siempre está completa (se validó al enviarla).
        const direccion = await this.findOrFail(manager, Plantel, comision.direccionId!, 'Dirección no encontrada.');
        comision.folio = await this.generarFolio(manager, this.siglasDeDireccion(direccion));
        comision.fechaAutorizacion = this.fechaHoy();
      }

      comision.estado = ESTADO_POR_ACCION[dto.accion];
      comision.updatedBy = user.id;
      await manager.save(comision);

      await manager.save(
        this.crearRevision(manager, id, comision.estado, dto.accion, observaciones, user),
      );
    });

    return this.detalle(id);
  }

  // Quien la envió la retira antes de que la revisen: queda Cancelada, sin folio.
  async cancelar(id: string, user: AuthenticatedUser): Promise<ComisionResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const comision = await this.comisionDelSolicitante(
        manager, id, user, 'Solo quien envió la comisión puede cancelarla.',
      );

      if (comision.estado !== ComisionEstado.POR_AUTORIZAR) {
        throw this.badRequest('Solo se pueden cancelar comisiones que siguen Por autorizar.');
      }

      comision.estado = ComisionEstado.CANCELADA;
      comision.updatedBy = user.id;
      await manager.save(comision);

      await manager.save(
        this.crearRevision(manager, id, comision.estado, ComisionAccion.CANCELAR, null, user),
      );
    });

    return this.detalle(id);
  }

  // Bloquea la fila (no puede cambiar mientras el director la revisa) y verifica que sea de quien la pide.
  // Sin joins en la consulta con candado: Postgres no permite FOR UPDATE sobre un LEFT JOIN.
  private async comisionDelSolicitante(
    manager: EntityManager,
    id: string,
    user: AuthenticatedUser,
    mensajeSinPermiso: string,
  ): Promise<Comision> {
    const comision = await manager.findOne(Comision, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!comision) {
      throw this.notFound('Comisión no encontrada.');
    }

    comision.trabajador = (await manager.findOne(Trabajador, {
      where: { id: comision.trabajadorId },
      withDeleted: true,
    }))!;

    if (!this.esSolicitante(comision, user)) {
      throw this.forbidden(mensajeSinPermiso);
    }

    return comision;
  }

  // Sólo se edita un borrador o una comisión que el director devolvió a corrección.
  private async comisionEditable(
    manager: EntityManager,
    id: string,
    user: AuthenticatedUser,
  ): Promise<Comision> {
    const comision = await this.comisionDelSolicitante(
      manager, id, user, 'Solo quien envió la comisión puede modificarla.',
    );

    if (!ESTADOS_EDITABLES.includes(comision.estado)) {
      throw this.badRequest('Solo se pueden editar borradores o comisiones devueltas a corrección.');
    }

    return comision;
  }

  // Pasa lo capturado a la comisión. Lo que no venga queda vacío (un borrador puede estar incompleto);
  // lo que sí venga se valida igual que en una comisión completa.
  private async asignarDatos(
    manager: EntityManager,
    comision: Comision,
    dto: BorradorComisionDto,
    user: AuthenticatedUser,
  ): Promise<void> {
    const trabajador = await this.findOrFail(manager, Trabajador, dto.trabajadorId, 'Trabajador no encontrado.');

    if (!this.puedeGestionarOtros(user) && !this.esElMismoTrabajador(trabajador, user)) {
      throw this.forbidden('Solo puedes crear comisiones para ti mismo.');
    }

    comision.trabajadorId = trabajador.id;
    comision.trabajador = trabajador;

    const direccion = dto.direccionId
      ? await this.findOrFail(manager, Plantel, dto.direccionId, 'Dirección no encontrada.')
      : null;
    if (direccion) this.validarEsDireccion(direccion);

    const actividad = dto.actividadId
      ? await this.findOrFail(manager, Actividad, dto.actividadId, 'Actividad no encontrada.')
      : null;
    if (actividad && direccion) this.validarActividadDeDireccion(actividad, direccion);

    comision.direccionId = direccion?.id ?? null;
    comision.actividadId = actividad?.id ?? null;

    const responsable = actividad ? await this.responsableDe(manager, actividad) : null;
    comision.autoriza = dto.autoriza?.trim() || responsable?.autoriza || null;
    comision.puestoAutoriza = dto.puestoAutoriza?.trim() || responsable?.puestoAutoriza || null;

    const nivelAplicacionId = dto.nivelAplicacionId ?? dto.destinos?.[0]?.nivelAplicacionId ?? null;
    if (nivelAplicacionId) {
      await this.findOrFail(manager, NivelAplicacion, nivelAplicacionId, 'Nivel de aplicación no encontrado.');
    }
    comision.nivelAplicacionId = nivelAplicacionId;

    if (dto.municipioOrigenId) {
      await this.findOrFail(manager, Municipio, dto.municipioOrigenId, 'Municipio de origen no encontrado.');
    }
    comision.municipioOrigenId = dto.municipioOrigenId ?? null;

    comision.tipoTransporte = dto.tipoTransporte ?? null;
    comision.vehiculoId =
      dto.tipoTransporte != null && this.vehiculoCapturado(dto)
        ? await this.resolverVehiculo(manager, dto.tipoTransporte, dto.vehiculoId)
        : null;

    comision.objetivo = dto.objetivo?.trim() || null;
    comision.conceptoOtros = dto.conceptoOtros?.trim() || null;
    comision.conViaticos = dto.conViaticos ?? true;
    comision.destinos = await this.crearDestinos(
      manager, dto.destinos ?? [], user.id, comision.conViaticos,
    );
  }

  // Oficial y particular necesitan su vehículo; autobús u otro no llevan.
  private vehiculoCapturado(dto: BorradorComisionDto): boolean {
    if (dto.tipoTransporte === VehiculoTipo.OFICIAL) return !!dto.vehiculoId;
    if (dto.tipoTransporte === VehiculoTipo.PARTICULAR) return !!dto.vehiculoId;
    return true;
  }

  // Lo que le falta a una comisión para poder enviarse a autorización (se muestra en el borrador).
  private faltantesParaEnviar(c: Comision): string[] {
    const faltantes: string[] = [];

    if (!c.direccionId) faltantes.push('la dirección');
    if (!c.actividadId) faltantes.push('la actividad del POA');
    if (!c.objetivo) faltantes.push('el objetivo');
    if (!c.municipioOrigenId) faltantes.push('el origen');
    if (!c.destinos?.length) faltantes.push('al menos un destino');

    if (c.tipoTransporte == null) {
      faltantes.push('el tipo de transporte');
    } else if (
      (c.tipoTransporte === VehiculoTipo.OFICIAL || c.tipoTransporte === VehiculoTipo.PARTICULAR) &&
      !c.vehiculoId
    ) {
      faltantes.push('el vehículo');
    }

    if (!c.autoriza || !c.puestoAutoriza) faltantes.push('quién autoriza');

    return faltantes;
  }

  private validarCompleta(comision: Comision): void {
    const faltantes = this.faltantesParaEnviar(comision);

    if (faltantes.length > 0) {
      throw this.badRequest(`Falta capturar: ${faltantes.join(', ')}.`);
    }
  }

  private crearRevision(
    manager: EntityManager,
    comisionId: string,
    estado: ComisionEstado,
    accion: ComisionAccion,
    observaciones: string | null,
    user: AuthenticatedUser,
  ): ComisionRevision {
    return manager.create(ComisionRevision, {
      comisionId,
      estado,
      accion,
      observaciones,
      usuarioNombre: user.fullName,
      createdBy: user.id,
    });
  }

  // Quién ve qué comisiones:
  // - Director: sus propios borradores y, ya enviadas, sólo las de su dirección (aunque las haya capturado él);
  //   su dirección es el plantel de su usuario en Global, que tiene el mismo id que en `planteles`.
  // - Admin: sus borradores y todas las enviadas.
  // - Trabajador: sólo las propias (las que capturó o en las que es el comisionado).
  // Los borradores ajenos no los ve nadie: hasta que se envían sólo existen para quien los captura.
  private aplicarAlcance(qb: SelectQueryBuilder<Comision>, user: AuthenticatedUser): void {
    const roles = user.rolesViaticos ?? [];
    const propia = '(comision.createdBy = :usuarioId OR trabajador.numeroTrabajador = :numeroUsuario)';
    const enviada = 'comision.estado <> :borrador';

    qb.setParameters({
      usuarioId: user.id,
      numeroUsuario: Number(user.numeroTrabajador) || -1,
      borrador: ComisionEstado.BORRADOR,
      direccionUsuario: user.plantelId ?? null,
    });

    if (roles.includes(ViaticosRole.DIRECTOR)) {
      qb.andWhere(
        `((NOT ${enviada} AND comision.createdBy = :usuarioId) OR (${enviada} AND comision.direccionId = :direccionUsuario))`,
      );
      return;
    }

    if (roles.includes(ViaticosRole.ADMIN)) {
      qb.andWhere(`(${propia} OR ${enviada})`);
      return;
    }

    qb.andWhere(propia);
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

  // Oficial y particular: un vehículo activo del catálogo de ese tipo (los particulares se registran
  // y editan en el catálogo desde el wizard). Autobús / Otro: sólo se guarda el tipo de transporte.
  private async resolverVehiculo(
    manager: EntityManager,
    tipo: VehiculoTipo,
    vehiculoId: string | undefined,
  ): Promise<string | null> {
    if (tipo !== VehiculoTipo.OFICIAL && tipo !== VehiculoTipo.PARTICULAR) {
      return null;
    }

    const nombreTipo = tipo === VehiculoTipo.OFICIAL ? 'oficial' : 'particular';

    if (!vehiculoId) {
      throw this.badRequest(`Selecciona el vehículo ${nombreTipo}.`);
    }

    const vehiculo = await this.findOrFail(manager, Vehiculo, vehiculoId, 'Vehículo no encontrado.');
    if (vehiculo.tipo !== tipo || !vehiculo.status) {
      throw this.badRequest(`El vehículo seleccionado no es un vehículo ${nombreTipo} activo.`);
    }

    return vehiculo.id;
  }
  private puedeGestionarOtros(user: AuthenticatedUser): boolean {
    return (user.rolesViaticos ?? []).includes(ViaticosRole.DIRECTOR);
  }

  // Quien capturó la comisión o el propio comisionado.
  private esSolicitante(comision: Comision, user: AuthenticatedUser): boolean {
    return (
      comision.createdBy === user.id ||
      (!!comision.trabajador && this.esElMismoTrabajador(comision.trabajador, user))
    );
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

  // Sin viáticos los destinos se registran igual (ruta, fechas, días), pero con montos en 0.
  private async crearDestinos(
    manager: EntityManager,
    destinos: CreateComisionDestinoDto[],
    userId: string,
    conViaticos: boolean,
  ): Promise<ComisionDestino[]> {
    // Un borrador puede no tener destinos todavía.
    if (destinos.length === 0) return [];

    await this.validarNiveles(manager, destinos.map((d) => d.nivelAplicacionId));

    const municipios = await this.cargarMunicipios(manager, destinos.map((d) => d.municipioId));
    const tarifas = new Map<string, TarifaViaticos | null>();
    const resultado: ComisionDestino[] = [];

    for (const d of destinos) {
      const diasComision = this.calcularDias(d.fechaDesde, d.fechaHasta);
      const tarifa = conViaticos
        ? await this.tarifaDe(manager, d.nivelAplicacionId, municipios.get(d.municipioId)!, tarifas)
        : null;
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
          otros: conViaticos ? (d.otros ?? 0) : 0,
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

  // Sin usuario (respuestas internas) no se ofrecen acciones.
  private toResponseDto(c: Comision, user?: AuthenticatedUser): ComisionResponseDto {
    const t = c.trabajador;

    return {
      id: c.id,
      folio: c.folio,
      estado: c.estado,
      conViaticos: c.conViaticos,
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
            clase: c.vehiculo.clase,
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
      totalViaticos: this.totalViaticos(c.destinos ?? []),
      puedeCancelar:
        !!user && c.estado === ComisionEstado.POR_AUTORIZAR && this.esSolicitante(c, user),
      puedeEditar: !!user && ESTADOS_EDITABLES.includes(c.estado) && this.esSolicitante(c, user),
      faltantes: ESTADOS_EDITABLES.includes(c.estado) ? this.faltantesParaEnviar(c) : [],
      revisiones: (c.revisiones ?? []).map((r) => ({
        id: r.id,
        estado: r.estado,
        accion: r.accion ?? ACCION_POR_ESTADO_ANTERIOR[r.estado] ?? null,
        observaciones: r.observaciones,
        usuario: r.usuarioNombre,
        fecha: r.createdAt,
      })),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  // Con varios destinos sólo se paga el último (el de fecha más reciente); los anteriores son parte
  // de la ruta y se guardan con sus montos sólo como referencia.
  private totalViaticos(destinos: ComisionDestino[]): number {
    const pagado = [...destinos]
      .sort(
        (a, b) =>
          String(a.fechaDesde).localeCompare(String(b.fechaDesde)) ||
          String(a.fechaHasta).localeCompare(String(b.fechaHasta)),
      )
      .at(-1);

    if (!pagado) return 0;

    return this.redondear(
      Number(pagado.hospedaje) + Number(pagado.alimentos) + Number(pagado.peaje) + Number(pagado.otros),
    );
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
