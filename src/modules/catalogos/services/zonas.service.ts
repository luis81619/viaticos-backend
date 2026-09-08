import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Zona } from '../entities/zona.entity';
import { Estado } from '../entities/estado.entity';
import { ZonaResponseDto } from '../dto/zona/zona-response.dto';
import { FindZonasQueryDto } from '../dto/zona/find-zonas-query.dto';

const ZONAS_BASE = ['I', 'II', 'III', 'IV'];

@Injectable()
export class ZonasService {
  constructor(
    @InjectRepository(Zona)
    private readonly zonaRepository: Repository<Zona>,

    @InjectRepository(Estado)
    private readonly estadoRepository: Repository<Estado>,
  ) {}

  async findAll(query: FindZonasQueryDto = {}): Promise<ZonaResponseDto[]> {
    // Si se filtra por estado, aseguramos que existan las 4 zonas base.
    if (query.estadoId) {
      await this.ensureZonasBaseParaEstado(query.estadoId);
    }

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

  // Crea las zonas I/II/III/IV que aún no existan para el estado dado.
  private async ensureZonasBaseParaEstado(estadoId: string): Promise<void> {
    const estado = await this.estadoRepository.findOne({ where: { id: estadoId } });
    if (!estado) return;

    const existentes = await this.zonaRepository
      .createQueryBuilder('zona')
      .leftJoin('zona.estado', 'estado')
      .where('estado.id = :estadoId', { estadoId })
      .getMany();

    const zonasPresentes = new Set(existentes.map((z) => z.zona));
    const faltantes = ZONAS_BASE.filter((z) => !zonasPresentes.has(z));

    if (faltantes.length === 0) return;

    const nuevas = faltantes.map((z) =>
      this.zonaRepository.create({
        nombre: `Zona ${z}`,
        zona: z,
        estado,
      }),
    );

    await this.zonaRepository.save(nuevas);
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
