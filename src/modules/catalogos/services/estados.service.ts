import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Estado } from '../entities/estado.entity';
import { EstadoResponseDto } from '../dto/estado/estado-response.dto';

@Injectable()
export class EstadosService {
  constructor(
    @InjectRepository(Estado)
    private readonly estadoRepository: Repository<Estado>,
  ) {}

  async findAll(): Promise<EstadoResponseDto[]> {
    const estados = await this.estadoRepository.find({
      order: { nombre: 'ASC' },
    });

    return estados.map((estado) => this.toResponseDto(estado));
  }

  private toResponseDto(estado: Estado): EstadoResponseDto {
    return {
      id: estado.id,
      nombre: estado.nombre,
      clave: estado.clave,
    };
  }
}
