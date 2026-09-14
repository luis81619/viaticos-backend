import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Vehiculo } from '../entities/vehiculo.entity';

import { CreateVehiculoDto } from '../dto/vehiculo/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../dto/vehiculo/update-vehiculo.dto';
import { FindVehiculosQueryDto } from '../dto/vehiculo/find-vehiculos-query.dto';
import { VehiculoResponseDto } from '../dto/vehiculo/vehiculo-response.dto';

import { ErrorCode } from 'src/common/exceptions/error-codes';


const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepository: Repository<Vehiculo>,
  ) {}

  async findAll(query: FindVehiculosQueryDto) {
    const {
      page = 1,
      limit = 25,
      submarca,
      marca,
      placa,
      tipo,
      clase,
      modelo,
      status,
      sortBy = 'marca',
      sortOrder = 'ASC',
    } = query;

    const qb = this.vehiculoRepository.createQueryBuilder('vehiculo');

    if (submarca) {
      qb.andWhere('LOWER(vehiculo.submarca) LIKE LOWER(:submarca)', {
        submarca: `%${submarca.trim()}%`,
      });
    }

    if (marca) {
      qb.andWhere('LOWER(vehiculo.marca) LIKE LOWER(:marca)', {
        marca: `%${marca.trim()}%`,
      });
    }

    if (placa) {
      qb.andWhere('LOWER(vehiculo.placa) LIKE LOWER(:placa)', {
        placa: `%${placa.trim()}%`,
      });
    }


    if (tipo !== undefined) qb.andWhere('vehiculo.tipo = :tipo', { tipo });
    if (clase !== undefined) qb.andWhere('vehiculo.clase = :clase', { clase });
    if (modelo !== undefined) qb.andWhere('vehiculo.modelo = :modelo', { modelo });
    if (status !== undefined) qb.andWhere('vehiculo.status = :status', { status });

    qb.orderBy(`vehiculo.${sortBy}`, sortOrder)
      .addOrderBy('vehiculo.submarca', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [vehiculos, totalRecords] = await qb.getManyAndCount();

    return {
      data: vehiculos.map((v) => this.toResponseDto(v)),
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  async findOne(id: string): Promise<VehiculoResponseDto> {
    return this.toResponseDto(await this.findVehiculoOrFail(id));
  }

  async create(
    dto: CreateVehiculoDto,
    userId: string,
  ): Promise<VehiculoResponseDto> {
    const vehiculo = this.vehiculoRepository.create({
      ...dto,
      createdBy: userId,
    });

    const saved = await this.saveOrThrow(vehiculo);
    return this.toResponseDto(saved);
  }

  async update(
    id: string,
    dto: UpdateVehiculoDto,
    userId: string,
  ): Promise<VehiculoResponseDto> {
    const vehiculo = await this.findVehiculoOrFail(id);

    Object.assign(vehiculo, dto, { updatedBy: userId });

    const saved = await this.saveOrThrow(vehiculo);
    return this.toResponseDto(saved);
  }

  async toggleStatus(id: string, userId: string): Promise<VehiculoResponseDto> {
    const vehiculo = await this.findVehiculoOrFail(id);

    vehiculo.status = !vehiculo.status;
    vehiculo.updatedBy = userId;

    const saved = await this.vehiculoRepository.save(vehiculo);
    return this.toResponseDto(saved);
  }


  private async saveOrThrow(vehiculo: Vehiculo): Promise<Vehiculo> {
    try {
      return await this.vehiculoRepository.save(vehiculo);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === PG_UNIQUE_VIOLATION
      ) {
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

  private async findVehiculoOrFail(id: string): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoRepository.findOne({ where: { id } });

    if (!vehiculo) {
      throw new NotFoundException({
        error: {
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'Vehículo no encontrado.',
          details: [],
        },
      });
    }

    return vehiculo;
  }

  private toResponseDto(v: Vehiculo): VehiculoResponseDto {
    return {
      id: v.id,
      tipo: v.tipo,
      clase: v.clase,
      submarca: v.submarca,
      marca: v.marca,
      modelo: v.modelo,
      color: v.color,
      placa: v.placa,
      status: v.status,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    };
  }
}
