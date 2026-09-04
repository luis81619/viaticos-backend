import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NivelAplicacion } from '../entities/nivel-aplicacion.entity';
import { NivelAplicacionResponseDto } from '../dto/nivel-aplicacion/nivel-aplicacion-response.dto';

@Injectable()
export class NivelesAplicacionService {
  constructor(
    @InjectRepository(NivelAplicacion)
    private readonly nivelRepository: Repository<NivelAplicacion>,
  ) {}

  async findAll(): Promise<NivelAplicacionResponseDto[]> {
    const niveles = await this.nivelRepository.find({
      order: { orden: 'ASC', nombre: 'ASC' },
    });

    return niveles.map((n) => ({
      id: n.id,
      nombre: n.nombre,
      orden: n.orden,
    }));
  }
}
