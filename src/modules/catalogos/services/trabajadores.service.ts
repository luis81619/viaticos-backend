import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';

import { Trabajador } from '../entities/trabajador.entity';
import {
  RhTrabajador,
  RhTrabajadoresResponse,
} from '../interfaces/rh-trabajador.interface';
import { FindTrabajadoresQueryDto } from '../dto/trabajador/find-trabajadores-query.dto';
import { TrabajadorResponseDto } from '../dto/trabajador/trabajador-response.dto';

@Injectable()
export class TrabajadoresService {
  constructor(
    @InjectRepository(Trabajador)
    private readonly trabajadorRepository: Repository<Trabajador>,

    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}


  async findAll(query: FindTrabajadoresQueryDto) {
    const {
      page = 1,
      limit = 25,
      search,
      sortBy = 'apellidoPaterno',
      sortOrder = 'ASC',
    } = query;

    const qb = this.trabajadorRepository.createQueryBuilder('trabajador');

    if (search) {
      const term = `%${search.trim().toUpperCase()}%`;
      qb.andWhere(
        `(
          UPPER(trabajador.nombre) LIKE :term
          OR UPPER(trabajador.apellido_paterno) LIKE :term
          OR UPPER(trabajador.apellido_materno) LIKE :term
          OR UPPER(trabajador.rfc) LIKE :term
          OR CAST(trabajador.numero_trabajador AS TEXT) LIKE :term
        )`,
        { term },
      );
    }

    qb.orderBy(`trabajador.${sortBy}`, sortOrder)
      .addOrderBy('trabajador.nombre', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [trabajadores, totalRecords] = await qb.getManyAndCount();

    return {
      data: trabajadores.map((t) => this.toResponseDto(t)),
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }


  async sync(): Promise<{
    received: number;
    inserted: number;
    updated: number;
    reactivated: number;
    deactivated: number;
    done: boolean;
  }> {
    const rhApiUrl = this.configService.getOrThrow<string>('RH_API_URL');
    const rhApiKey = this.configService.getOrThrow<string>('RH_API_KEY');

    let response: RhTrabajadoresResponse;

    try {
      const httpResponse = await firstValueFrom(
        this.httpService.get<RhTrabajadoresResponse>(
          `${rhApiUrl}/integraciones/viaticos/trabajadores`,
          {
            headers: { 'x-api-key': rhApiKey },
            timeout: 60000,
          },
        ),
      );

      response = httpResponse.data;
    } catch {
      throw new ServiceUnavailableException(
        'RH service is temporarily unavailable.',
      );
    }

    this.validateResponse(response);

    const receivedTrabajadores = response.trabajadores;

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.find(Trabajador, { withDeleted: true });

      const existingById = new Map(existing.map((t) => [t.id, t]));

      const receivedIds = new Set(receivedTrabajadores.map((t) => t.id));

      const toInsert: Trabajador[] = [];
      const toUpdate: Trabajador[] = [];
      let reactivated = 0;

      for (const rh of receivedTrabajadores) {
        const local = existingById.get(rh.id);

        if (local) {
          this.applyFields(local, rh);

          if (local.deletedAt) {
            local.deletedAt = null;
            reactivated++;
          }

          toUpdate.push(local);
          continue;
        }

        const nuevo = manager.create(Trabajador, {
          id: rh.id,
          nombre: rh.nombre,
          apellidoPaterno: rh.apellidoPaterno,
          apellidoMaterno: rh.apellidoMaterno,
          emailPersonal: rh.emailPersonal,
          emailInstitucional: rh.emailInstitucional,
          numeroCuentaNomina: rh.numeroCuentaNomina,
          numeroSeguridadSocial: rh.numeroSeguridadSocial,
          numeroInfonavit: rh.numeroInfonavit,
          numeroTrabajador: rh.numeroTrabajador,
          rfc: rh.rfc,
          celular: rh.celular,
          telefono: rh.telefono,
          otroTelefono: rh.otroTelefono,
          bancoId: rh.bancoId,
          fotoId: rh.fotoId,
          firmaId: rh.firmaId,
          plantelId: rh.plantelId,
        });

        toInsert.push(nuevo);
      }

      const idsToDeactivate = existing
        .filter((t) => !t.deletedAt && !receivedIds.has(t.id))
        .map((t) => t.id);

      if (toUpdate.length > 0) {
        await manager.save(Trabajador, toUpdate, { chunk: 200 });
      }

      if (toInsert.length > 0) {
        await manager.save(Trabajador, toInsert, { chunk: 200 });
      }

      if (idsToDeactivate.length > 0) {
        await manager.update(
          Trabajador,
          { id: In(idsToDeactivate) },
          { deletedAt: new Date() },
        );
      }

      return {
        received: receivedTrabajadores.length,
        inserted: toInsert.length,
        updated: toUpdate.length,
        reactivated,
        deactivated: idsToDeactivate.length,
        done: true,
      };
    });
  }

  private applyFields(local: Trabajador, rh: RhTrabajador): void {
    local.nombre = rh.nombre;
    local.apellidoPaterno = rh.apellidoPaterno;
    local.apellidoMaterno = rh.apellidoMaterno;
    local.emailPersonal = rh.emailPersonal;
    local.emailInstitucional = rh.emailInstitucional;
    local.numeroCuentaNomina = rh.numeroCuentaNomina;
    local.numeroSeguridadSocial = rh.numeroSeguridadSocial;
    local.numeroInfonavit = rh.numeroInfonavit;
    local.numeroTrabajador = rh.numeroTrabajador;
    local.rfc = rh.rfc;
    local.celular = rh.celular;
    local.telefono = rh.telefono;
    local.otroTelefono = rh.otroTelefono;
    local.bancoId = rh.bancoId;
    local.fotoId = rh.fotoId;
    local.firmaId = rh.firmaId;
    local.plantelId = rh.plantelId;
  }

  private validateResponse(response: RhTrabajadoresResponse): void {
    if (!response?.success || !Array.isArray(response.trabajadores)) {
      throw new BadGatewayException('RH returned an invalid trabajadores response.');
    }

    if (!response.isComplete) {
      throw new BadGatewayException('RH returned an incomplete trabajadores snapshot.');
    }

    const seen = new Set<string>();
    for (const t of response.trabajadores) {
      if (!t.id) {
        throw new BadGatewayException('RH returned a trabajador without id.');
      }
      if (seen.has(t.id)) {
        throw new BadGatewayException(`RH returned duplicated trabajador id: ${t.id}.`);
      }
      seen.add(t.id);
    }
  }

  private toResponseDto(t: Trabajador): TrabajadorResponseDto {
    return {
      id: t.id,
      nombre: t.nombre,
      apellidoPaterno: t.apellidoPaterno,
      apellidoMaterno: t.apellidoMaterno,
      emailPersonal: t.emailPersonal,
      emailInstitucional: t.emailInstitucional,
      numeroCuentaNomina: t.numeroCuentaNomina,
      numeroSeguridadSocial: t.numeroSeguridadSocial,
      numeroInfonavit: t.numeroInfonavit,
      numeroTrabajador: t.numeroTrabajador,
      rfc: t.rfc,
      celular: t.celular,
      telefono: t.telefono,
      otroTelefono: t.otroTelefono,
      bancoId: t.bancoId,
      fotoId: t.fotoId,
      firmaId: t.firmaId,
      plantelId: t.plantelId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }
}
