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

  // Obtiene vehículos con paginación, filtros y ordenamiento.
  async findAll(query: FindVehiculosQueryDto) {
    const {
      page = 1,
      limit = 25,
      nombre,
      marca,
      placa,
      tipo,
      status,
      sortBy = 'nombre',
      sortOrder = 'ASC',
    } = query;

    const qb = this.vehiculoRepository.createQueryBuilder('vehiculo');

    if (nombre) {
      qb.andWhere('LOWER(vehiculo.nombre) LIKE LOWER(:nombre)', {
        nombre: `%${nombre.trim()}%`,
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

  // Busca un vehículo por ID.
  async findOne(id: string): Promise<VehiculoResponseDto> {
    const vehiculo = await this.findVehiculoOrFail(id);
    return this.toResponseDto(vehiculo);
  }

  // Crea un vehículo nuevo.
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

  // Actualiza parcialmente un vehículo.
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
      nombre: vehiculo.nombre,
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
