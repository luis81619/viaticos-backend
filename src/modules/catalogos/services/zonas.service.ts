import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Zona } from '../entities/zona.entity';
import { ZonaResponseDto } from '../dto/zona/zona-response.dto';
import { FindZonasQueryDto } from '../dto/zona/find-zonas-query.dto';

@Injectable()
export class ZonasService {
  constructor(
    @InjectRepository(Zona)
    private readonly zonaRepository: Repository<Zona>,
  ) {}

  async findAll(query: FindZonasQueryDto = {}): Promise<ZonaResponseDto[]> {
    const qb = this.zonaRepository
      .createQueryBuilder('zona')
      .leftJoinAndSelect('zona.estado', 'estado');

    if (query.estadoId) {
      qb.andWhere('estado.id = :estadoId', { estadoId: query.estadoId });
    }

    qb.orderBy('estado.nombre', 'ASC')
      .addOrderBy('zona.zona', 'ASC')
      .addOrderBy('zona.nombre', 'ASC');

    const zonas = await qb.getMany();

    return zonas.map((zona) => this.toResponseDto(zona));
  }

  private toResponseDto(zona: Zona): ZonaResponseDto {
    return {
      id: zona.id,
      nombre: zona.nombre,
      zona: zona.zona,
      descripcion: zona.descripcion,
      estado: zona.estado
        ? {
            id: zona.estado.id,
            nombre: zona.estado.nombre,
            clave: zona.estado.clave,
          }
        : undefined,
    };
  }
}
