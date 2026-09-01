import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { firstValueFrom } from 'rxjs';
import {
  DataSource,
  In,
  Repository,
} from 'typeorm';

import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

import { Plantel } from '../entities/plantel.entity';
import {
  GlobalPlantel,
  GlobalPlantelesResponse,
} from '../interfaces/global-plantel.interface';

@Injectable()
export class PlantelesService {
  constructor(
    @InjectRepository(Plantel)
    private readonly plantelRepository:
      Repository<Plantel>,

    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Plantel[]> {
    return this.plantelRepository.find({
      order: {
        tipo: 'ASC',
        clave: 'ASC',
      },
    });
  }

  async sync(
    token: string,
    user: AuthenticatedUser,
  ): Promise<{
    received: number;
    inserted: number;
    updated: number;
    reactivated: number;
    deactivated: number;
    done: boolean;
  }> {
    const globalApiUrl =
      this.configService.getOrThrow<string>(
        'GLOBAL_API_URL',
      );

    let response: GlobalPlantelesResponse;

    try {
      const httpResponse = await firstValueFrom(
        this.httpService.get<GlobalPlantelesResponse>(
          `${globalApiUrl}/plantels`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000,
          },
        ),
      );

      response = httpResponse.data;
    } catch {
      throw new ServiceUnavailableException(
        'Global plantels service is temporarily unavailable.',
      );
    }

    const receivedPlantels = response.plantels;

    this.validateResponse(receivedPlantels);

    return this.dataSource.transaction(
      async (manager) => {
        const existingPlantels =
          await manager.find(Plantel, {
            withDeleted: true,
          });

        const existingById = new Map(
          existingPlantels.map((plantel) => [
            plantel.id,
            plantel,
          ]),
        );

        const receivedIds = new Set(
          receivedPlantels.map(
            (plantel) => plantel.plantel_id,
          ),
        );

        const plantelsToInsert: Plantel[] = [];
        const plantelsToUpdate: Plantel[] = [];

        let reactivated = 0;

        for (
          const receivedPlantel of receivedPlantels
        ) {
          const tipo = Number.parseInt(
            receivedPlantel.tipo,
            10,
          );

          const existingPlantel =
            existingById.get(
              receivedPlantel.plantel_id,
            );

          if (existingPlantel) {
            existingPlantel.nombre =
              this.normalizeText(
                receivedPlantel.plantel_nombre,
              );

            existingPlantel.cct =
              this.normalizeText(
                receivedPlantel.cct,
              );

            existingPlantel.clave =
              this.normalizeText(
                receivedPlantel.clave,
              );

            existingPlantel.tipo = tipo;

            existingPlantel.modelo =
              this.normalizeText(
                receivedPlantel.modelo,
              );

            existingPlantel.director =
              receivedPlantel.nombre_director
                ? this.normalizeText(
                    receivedPlantel.nombre_director,
                  )
                : null;

            existingPlantel.updatedBy = user.id;

            if (existingPlantel.deletedAt) {
              existingPlantel.deletedAt = null;
              existingPlantel.deletedBy = null;
              reactivated++;
            }

            plantelsToUpdate.push(
              existingPlantel,
            );

            continue;
          }

          const newPlantel =
            manager.create(Plantel, {
              id: receivedPlantel.plantel_id,
              nombre: this.normalizeText(
                receivedPlantel.plantel_nombre,
              ),
              cct: this.normalizeText(
                receivedPlantel.cct,
              ),
              clave: this.normalizeText(
                receivedPlantel.clave,
              ),
              tipo,
              modelo: this.normalizeText(
                receivedPlantel.modelo,
              ),
              director:
                receivedPlantel.nombre_director
                  ? this.normalizeText(
                      receivedPlantel.nombre_director,
                    )
                  : null,
              createdBy: user.id,
              updatedBy: user.id,
            });

          plantelsToInsert.push(newPlantel);
        }

        const idsToDeactivate =
          existingPlantels
            .filter(
              (plantel) =>
                !plantel.deletedAt &&
                !receivedIds.has(plantel.id),
            )
            .map((plantel) => plantel.id);

        if (plantelsToUpdate.length > 0) {
          await manager.save(
            Plantel,
            plantelsToUpdate,
            {
              chunk: 100,
            },
          );
        }

        if (plantelsToInsert.length > 0) {
          await manager.save(
            Plantel,
            plantelsToInsert,
            {
              chunk: 100,
            },
          );
        }

        if (idsToDeactivate.length > 0) {
          await manager.update(
            Plantel,
            {
              id: In(idsToDeactivate),
            },
            {
              deletedAt: new Date(),
              deletedBy: user.id,
              updatedBy: user.id,
            },
          );
        }

        return {
          received: receivedPlantels.length,
          inserted: plantelsToInsert.length,
          updated: plantelsToUpdate.length,
          reactivated,
          deactivated:
            idsToDeactivate.length,
          done: true,
        };
      },
    );
  }

  private validateResponse(
    plantels: GlobalPlantel[],
  ): void {
    if (!Array.isArray(plantels)) {
      throw new BadGatewayException(
        'Global returned an invalid plantels response.',
      );
    }

    if (plantels.length === 0) {
      throw new BadGatewayException(
        'Global returned an empty plantels response.',
      );
    }

    const receivedIds = new Set<string>();

    for (const plantel of plantels) {
      const tipo = Number.parseInt(
        plantel.tipo,
        10,
      );

      if (
        !plantel.plantel_id ||
        !plantel.plantel_nombre ||
        !plantel.cct ||
        !plantel.clave ||
        !plantel.modelo ||
        !Number.isInteger(tipo) ||
        tipo < 1 ||
        tipo > 9
      ) {
        throw new BadGatewayException(
          `Global returned invalid information for plantel ${plantel.plantel_id || 'unknown'}.`,
        );
      }

      if (
        receivedIds.has(plantel.plantel_id)
      ) {
        throw new BadGatewayException(
          `Global returned duplicated plantel ${plantel.plantel_id}.`,
        );
      }

      receivedIds.add(plantel.plantel_id);
    }
  }

  private normalizeText(
    value: string,
  ): string {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }
}