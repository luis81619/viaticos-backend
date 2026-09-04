import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import {
  LessThanOrEqual,
  MoreThanOrEqual,
  IsNull,
  Or,
  Repository,
} from 'typeorm';

import { NivelAplicacion } from '../entities/nivel-aplicacion.entity';
import { TarifaViaticos } from '../entities/tarifa-viaticos.entity';

import {
  NivelEnTabulador,
  TarifaEnTabulador,
} from '../dto/tabulador/tabulador-response.dto';
import {
  ActualizarTabuladorDto,
  TarifaUpdateItemDto,
} from '../dto/tabulador/actualizar-tabulador.dto';

import { ErrorCode } from 'src/common/exceptions/error-codes';

const ZONAS_FIJAS = ['I', 'II', 'III', 'IV'] as const;

@Injectable()
export class TabuladorService {
  constructor(
    @InjectRepository(NivelAplicacion)
    private readonly nivelRepository: Repository<NivelAplicacion>,

    @InjectRepository(TarifaViaticos)
    private readonly tarifaRepository: Repository<TarifaViaticos>,
  ) {}

  async listar(): Promise<NivelEnTabulador[]> {
    const [niveles, tarifas] = await Promise.all([
      this.nivelRepository.find({
        order: { orden: 'ASC', nombre: 'ASC' },
      }),

      this.tarifaRepository
        .createQueryBuilder('tarifa')
        .leftJoinAndSelect('tarifa.nivelAplicacion', 'nivel')
        .where(
          'tarifa.vigenciaHasta IS NULL OR tarifa.vigenciaHasta >= CURRENT_DATE',
        )
        .andWhere('tarifa.vigenciaDesde <= CURRENT_DATE')
        .getMany(),
    ]);

    return niveles.map((nivel) => {
      const tarifasNivel = tarifas.filter(
        (t) => t.nivelAplicacion?.id === nivel.id,
      );

      // Rellenamos las 4 zonas
      const tarifasCompletas: TarifaEnTabulador[] = ZONAS_FIJAS.map(
        (zonaNum) => {
          const existente = tarifasNivel.find((t) => t.zona === zonaNum);

          if (existente) {
            return {
              id: existente.id,
              zona: existente.zona,
              tarifaHospedaje: Number(existente.tarifaHospedaje),
              tarifaAlimentos: Number(existente.tarifaAlimentos),
              tarifaPeaje:
                existente.tarifaPeaje != null
                  ? Number(existente.tarifaPeaje)
                  : undefined,
              vigenciaDesde: existente.vigenciaDesde,
              vigenciaHasta: existente.vigenciaHasta,
            };
          }

          return {
            id: '',
            zona: zonaNum,
            tarifaHospedaje: 0,
            tarifaAlimentos: 0,
            tarifaPeaje: undefined,
            vigenciaDesde: new Date().toISOString().slice(0, 10),
            vigenciaHasta: undefined,
          };
        },
      );

      return {
        nivel: {
          id: nivel.id,
          nombre: nivel.nombre,
          orden: nivel.orden,
        },
        tarifas: tarifasCompletas,
      };
    });
  }

  /**
   * Actualiza o crea todas las tarifas del payload
   */
  async actualizarMasivo(
    dto: ActualizarTabuladorDto,
    userId: string,
  ): Promise<NivelEnTabulador[]> {
    for (const item of dto.tarifas) {
      await this.upsertTarifa(item, userId);
    }

    return this.listar();
  }

  private async upsertTarifa(
    item: TarifaUpdateItemDto,
    userId: string,
  ): Promise<void> {
    const nivel = await this.nivelRepository.findOne({
      where: { id: item.nivelAplicacionId },
    });

    if (!nivel) {
      throw new NotFoundException({
        error: {
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Nivel de aplicación ${item.nivelAplicacionId} no encontrado.`,
          details: [],
        },
      });
    }

    // Busca la tarifa vigente actual
    const existente = await this.tarifaRepository
      .createQueryBuilder('tarifa')
      .leftJoin('tarifa.nivelAplicacion', 'nivel')
      .where('nivel.id = :nivelId', { nivelId: item.nivelAplicacionId })
      .andWhere('tarifa.zona = :zona', { zona: item.zona })
      .andWhere(
        'tarifa.vigenciaHasta IS NULL OR tarifa.vigenciaHasta >= CURRENT_DATE',
      )
      .getOne();

    if (existente) {
      existente.tarifaHospedaje = item.tarifaHospedaje;
      existente.tarifaAlimentos = item.tarifaAlimentos;
      existente.tarifaPeaje = item.tarifaPeaje;
      existente.updatedBy = userId;
      await this.tarifaRepository.save(existente);
      return;
    }

    // Si no existe, crea una nueva con vigencia desde hoy
    const nueva = this.tarifaRepository.create({
      nivelAplicacion: nivel,
      zona: item.zona,
      tarifaHospedaje: item.tarifaHospedaje,
      tarifaAlimentos: item.tarifaAlimentos,
      tarifaPeaje: item.tarifaPeaje,
      vigenciaDesde: new Date().toISOString().slice(0, 10),
      createdBy: userId,
    });

    await this.tarifaRepository.save(nueva);
  }
}
