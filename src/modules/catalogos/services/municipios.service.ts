import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Municipio } from '../entities/municipio.entity';
import { Estado } from '../entities/estado.entity';
import { Zona } from '../entities/zona.entity';

import { CreateMunicipioDto } from '../dto/municipio/create-municipio.dto';
import { UpdateMunicipioDto } from '../dto/municipio/update-municipio.dto';
import { FindMunicipiosQueryDto } from '../dto/municipio/find-municipios-query.dto';
import { MunicipioResponseDto } from '../dto/municipio/municipio-response.dto';

import { ErrorCode } from 'src/common/exceptions/error-codes';

@Injectable()
export class MunicipiosService {
  constructor(
    @InjectRepository(Municipio)
    private readonly municipioRepository: Repository<Municipio>,

    @InjectRepository(Estado)
    private readonly estadoRepository: Repository<Estado>,

    @InjectRepository(Zona)
    private readonly zonaRepository: Repository<Zona>,
  ) {}

  // Listado con paginación, filtros y ordenamiento.
  async findAll(query: FindMunicipiosQueryDto) {
    const {
      page = 1,
      limit = 25,
      nombre,
      estadoId,
      zonaId,
      region,
      sortBy = 'nombre',
      sortOrder = 'ASC',
    } = query;

    const qb = this.municipioRepository
      .createQueryBuilder('municipio')
      .leftJoinAndSelect('municipio.estado', 'estado')
      .leftJoinAndSelect('municipio.zona', 'zona');

    if (nombre) {
      qb.andWhere('LOWER(municipio.nombre) LIKE LOWER(:nombre)', {
        nombre: `%${nombre.trim()}%`,
      });
    }

    if (estadoId) {
      qb.andWhere('estado.id = :estadoId', { estadoId });
    }

    if (zonaId) {
      qb.andWhere('zona.id = :zonaId', { zonaId });
    }

    if (region) {
      qb.andWhere('LOWER(municipio.region) LIKE LOWER(:region)', {
        region: `%${region.trim()}%`,
      });
    }

    qb.orderBy(`municipio.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [municipios, totalRecords] = await qb.getManyAndCount();

    const data = municipios.map((municipio) => this.toResponseDto(municipio));

    return {
      data,
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  // Obtiene un municipio por ID
  async findOne(id: string): Promise<MunicipioResponseDto> {
    const municipio = await this.findMunicipioOrFail(id);
    return this.toResponseDto(municipio);
  }

  // Crea un municipio nuevo
  async create(
    createMunicipioDto: CreateMunicipioDto,
    userId: string,
  ): Promise<MunicipioResponseDto> {
    const { estadoId, zonaId, ...rest } = createMunicipioDto;

    const estado = await this.findEstadoOrFail(estadoId);

    const zona = zonaId ? await this.findZonaOrFail(zonaId) : null;

    const municipio = this.municipioRepository.create({
      ...rest,
      estado,
      zona,
      createdBy: userId,
    });

    const saved = await this.municipioRepository.save(municipio);

    return this.toResponseDto(saved);
  }

  // Actualiza un municipio
  async update(
    id: string,
    updateMunicipioDto: UpdateMunicipioDto,
    userId: string,
    mode?: 'assign' | 'edit',
  ): Promise<MunicipioResponseDto> {
    const municipio = await this.findMunicipioOrFail(id);

    const { estadoId, zonaId, ...rest } = updateMunicipioDto;

    // Validación para el flujo "asignar por primera vez": rechaza si el municipio
    // ya tiene zona (y por ende región) asignada.
    if (mode === 'assign' && municipio.zona) {
      throw new ConflictException({
        error: {
          code: ErrorCode.DUPLICATE_RESOURCE,
          message: 'Ya existe el municipio asignado al estado seleccionado.',
          details: [],
        },
      });
    }

    if (estadoId) {
      municipio.estado = await this.findEstadoOrFail(estadoId);
    }

    if (zonaId !== undefined) {
      municipio.zona = zonaId
        ? await this.findZonaOrFail(zonaId)
        : (null as any);
    }

    Object.assign(municipio, rest, { updatedBy: userId });

    const updated = await this.municipioRepository.save(municipio);

    return this.toResponseDto(updated);
  }

  private async findMunicipioOrFail(id: string): Promise<Municipio> {
    const municipio = await this.municipioRepository.findOne({
      where: { id },
      relations: { estado: true, zona: true },
    });

    if (!municipio) {
      throw new NotFoundException({
        error: {
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'Municipio no encontrado',
          details: [],
        },
      });
    }

    return municipio;
  }

  private async findEstadoOrFail(id: string): Promise<Estado> {
    const estado = await this.estadoRepository.findOne({ where: { id } });

    if (!estado) {
      throw new NotFoundException({
        error: {
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'Estado not found.',
          details: [],
        },
      });
    }

    return estado;
  }

  private async findZonaOrFail(id: string): Promise<Zona> {
    const zona = await this.zonaRepository.findOne({ where: { id } });

    if (!zona) {
      throw new NotFoundException({
        error: {
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'Zona no encontrada',
          details: [],
        },
      });
    }

    return zona;
  }

  private toResponseDto(municipio: Municipio): MunicipioResponseDto {
    return {
      id: municipio.id,
      nombre: municipio.nombre,
      region: municipio.region,
      estado: municipio.estado
        ? {
            id: municipio.estado.id,
            nombre: municipio.estado.nombre,
            clave: municipio.estado.clave,
          }
        : null,
      zona: municipio.zona
        ? {
            id: municipio.zona.id,
            nombre: municipio.zona.nombre,
            zona: municipio.zona.zona,
          }
        : null,
      createdAt: municipio.createdAt,
      updatedAt: municipio.updatedAt,
    };
  }
}
