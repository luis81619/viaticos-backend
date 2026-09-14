import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Zona } from '../entities/zona.entity';
import { ZonaResponseDto } from '../dto/zona/zona-response.dto';

const ZONAS_BASE = ['I', 'II', 'III', 'IV'];

@Injectable()
export class ZonasService {
  constructor(
    @InjectRepository(Zona)
    private readonly zonaRepository: Repository<Zona>,
  ) {}

  // Devuelve las 4 zonas globales (I/II/III/IV). Si alguna no existe se crea al vuelo.
  // Si en la BD hay duplicados por historial (una zona por estado), deduplica y
  // devuelve solo una fila por cada nivel.
  async findAll(): Promise<ZonaResponseDto[]> {
    await this.ensureZonasBase();

    const zonas = await this.zonaRepository
      .createQueryBuilder('zona')
      .orderBy('zona.zona', 'ASC')
      .addOrderBy('zona.createdAt', 'ASC')
      .getMany();

    // Dedup por nivel (I/II/III/IV): conservamos la primera de cada.
    const porNivel = new Map<string, Zona>();
    for (const z of zonas) {
      if (!porNivel.has(z.zona)) {
        porNivel.set(z.zona, z);
      }
    }

    // Devolvemos en el orden fijo I -> II -> III -> IV.
    return ZONAS_BASE
      .map((nivel) => porNivel.get(nivel))
      .filter((z): z is Zona => !!z)
      .map((z) => this.toResponseDto(z));
  }

  // Crea las zonas I/II/III/IV globales que aún no existan.
  private async ensureZonasBase(): Promise<void> {
    const existentes = await this.zonaRepository.find();
    const zonasPresentes = new Set(existentes.map((z) => z.zona));
    const faltantes = ZONAS_BASE.filter((z) => !zonasPresentes.has(z));

    if (faltantes.length === 0) return;

    const nuevas = faltantes.map((z) =>
      this.zonaRepository.create({
        nombre: `Zona ${z}`,
        zona: z,
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
    };
  }
}
