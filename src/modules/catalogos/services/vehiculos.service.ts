import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Vehiculo } from '../entities/vehiculo.entity';

import { CreateVehiculoDto } from '../dto/vehiculo/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../dto/vehiculo/update-vehiculo.dto';
import { FindVehiculosQueryDto } from '../dto/vehiculo/find-vehiculos-query.dto';
import { VehiculoResponseDto } from '../dto/vehiculo/vehiculo-response.dto';

import { ErrorCode } from 'src/common/exceptions/error-codes';

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
      sortBy = 'submarca',
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

    if (tipo !== undefined) {
      qb.andWhere('vehiculo.tipo = :tipo', { tipo });
    }

    if (clase !== undefined) {
      qb.andWhere('vehiculo.clase = :clase', { clase });
    }

    if (modelo !== undefined) {
      qb.andWhere('vehiculo.modelo = :modelo', { modelo });
    }

    if (status !== undefined) {
      qb.andWhere('vehiculo.status = :status', { status });
    }

    qb.orderBy(`vehiculo.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [vehiculos, totalRecords] = await qb.getManyAndCount();

    const data = vehiculos.map((vehiculo) => this.toResponseDto(vehiculo));

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

  async findOne(id: string): Promise<VehiculoResponseDto> {
    const vehiculo = await this.findVehiculoOrFail(id);
    return this.toResponseDto(vehiculo);
  }

  async create(
    createVehiculoDto: CreateVehiculoDto,
    userId: string,
  ): Promise<VehiculoResponseDto> {
    const vehiculo = this.vehiculoRepository.create({
      ...createVehiculoDto,
      createdBy: userId,
    });

    const savedVehiculo = await this.vehiculoRepository.save(vehiculo);

    return this.toResponseDto(savedVehiculo);
  }

  async update(
    id: string,
    updateVehiculoDto: UpdateVehiculoDto,
    userId: string,
  ): Promise<VehiculoResponseDto> {
    const vehiculo = await this.findVehiculoOrFail(id);

    Object.assign(vehiculo, updateVehiculoDto, {
      updatedBy: userId,
    });

    const updatedVehiculo = await this.vehiculoRepository.save(vehiculo);

    return this.toResponseDto(updatedVehiculo);
  }

  private async findVehiculoOrFail(id: string): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoRepository.findOne({
      where: { id },
    });

    if (!vehiculo) {
      throw new NotFoundException({
        error: {
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'Vehicle not found.',
          details: [],
        },
      });
    }

    return vehiculo;
  }

  private toResponseDto(vehiculo: Vehiculo): VehiculoResponseDto {
    return {
      id: vehiculo.id,
      tipo: vehiculo.tipo,
      clase: vehiculo.clase,
      submarca: vehiculo.submarca,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      color: vehiculo.color,
      placa: vehiculo.placa,
      status: vehiculo.status,
      createdAt: vehiculo.createdAt,
      updatedAt: vehiculo.updatedAt,
    };
  }
}
