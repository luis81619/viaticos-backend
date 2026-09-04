import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Estado } from '../entities/estado.entity';
import { Zona } from '../entities/zona.entity';
import { Municipio } from '../entities/municipio.entity';

import {
  EstadoZonificacionResponseDto,
  GrupoZonaEnZonificacion,
  RegionEnZonificacion,
} from '../dto/zonificacion/zonificacion-response.dto';

@Injectable()
export class ZonificacionService {
  constructor(
    @InjectRepository(Estado)
    private readonly estadoRepository: Repository<Estado>,

    @InjectRepository(Zona)
    private readonly zonaRepository: Repository<Zona>,

    @InjectRepository(Municipio)
    private readonly municipioRepository: Repository<Municipio>,
  ) {}

  async listarPorEstado(): Promise<EstadoZonificacionResponseDto[]> {
    const [estados, zonas, municipios] = await Promise.all([
      this.estadoRepository.find({ order: { nombre: 'ASC' } }),

      this.zonaRepository
        .createQueryBuilder('zona')
        .leftJoinAndSelect('zona.estado', 'estado')
        .orderBy('zona.zona', 'ASC')
        .addOrderBy('zona.nombre', 'ASC')
        .getMany(),

      this.municipioRepository
        .createQueryBuilder('municipio')
        .leftJoinAndSelect('municipio.estado', 'estado')
        .leftJoinAndSelect('municipio.zona', 'zona')
        .where('municipio.id_zona IS NOT NULL')
        .orderBy('municipio.nombre', 'ASC')
        .getMany(),
    ]);

    return estados.map((estado) => {
      const zonasEstado = zonas.filter((z) => z.estado?.id === estado.id);

      const municipiosEstado = municipios.filter(
        (m) => m.estado?.id === estado.id && m.zona,
      );

      const gruposMap = new Map<string, RegionEnZonificacion[]>();

      for (const zonaFila of zonasEstado) {
        const municipiosDeRegion = municipiosEstado
          .filter((m) => m.zona?.id === zonaFila.id)
          .map((m) => ({ id: m.id, nombre: m.nombre }));

        const region: RegionEnZonificacion = {
          id: zonaFila.id,
          nombre: zonaFila.nombre,
          descripcion: zonaFila.descripcion,
          municipios: municipiosDeRegion,
        };

        const existente = gruposMap.get(zonaFila.zona) ?? [];
        existente.push(region);
        gruposMap.set(zonaFila.zona, existente);
      }

      const zonasAgrupadas: GrupoZonaEnZonificacion[] = Array.from(
        gruposMap.entries(),
      )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([zona, regiones]) => ({ zona, regiones }));

      return {
        estado: {
          id: estado.id,
          nombre: estado.nombre,
          clave: estado.clave,
        },
        zonas: zonasAgrupadas,
      };
    });
  }
}
