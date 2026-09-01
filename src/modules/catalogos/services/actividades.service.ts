import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';

import {
  HttpService,
} from '@nestjs/axios';

import {
  ConfigService,
} from '@nestjs/config';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  DataSource,
  Repository,
} from 'typeorm';

import {
  firstValueFrom,
} from 'rxjs';

import { Actividad } from '../entities/actividad.entity';
import { ProyectoPoa } from '../entities/proyecto-poa.entity';

import { SappActivitiesIntegrationResponse, SappActivitiesSnapshot } from '../interfaces/sapp-actividad.interface';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { FindActividadesQueryDto,  } from '../dto/actividad/find-actividades-query.dto';
import { ActividadResponseDto,} from '../dto/actividad/actividad-response.dto';

@Injectable()
export class ActividadesService {
  constructor(
    @InjectRepository(Actividad)
    private readonly actividadRepository:
      Repository<Actividad>,

    @InjectRepository(ProyectoPoa)
    private readonly proyectoPoaRepository:
      Repository<ProyectoPoa>,

    private readonly httpService:
      HttpService,

    private readonly configService:
      ConfigService,

    private readonly dataSource:
      DataSource,
  ) {}

  async findAll(
    query: FindActividadesQueryDto,
  ) {
    const {
      page = 1,
      limit = 25,
      search,
      tipo,
      proyectoPoaId,
    } = query;

    const queryBuilder =
      this.actividadRepository
        .createQueryBuilder(
          'actividad',
        )
        .leftJoinAndSelect(
          'actividad.proyectoPoa',
          'proyectoPoa',
        );

    if (search) {
      queryBuilder.andWhere(
        `(
          actividad.folio ILIKE :search
          OR actividad.descripcion ILIKE :search
          OR actividad.medioVerificacion ILIKE :search
          OR proyectoPoa.nombre ILIKE :search
        )`,
        {
          search: `%${search.trim()}%`,
        },
      );
    }

    if (tipo !== undefined) {
      queryBuilder.andWhere(
        'actividad.tipo = :tipo',
        {
          tipo,
        },
      );
    }

    if (proyectoPoaId) {
      queryBuilder.andWhere(
        'actividad.proyectoPoaId = :proyectoPoaId',
        {
          proyectoPoaId,
        },
      );
    }

    queryBuilder
      .orderBy(
        'proyectoPoa.numero',
        'ASC',
      )
      .addOrderBy(
        'actividad.folio',
        'ASC',
      )
      .skip(
        (page - 1) * limit,
      )
      .take(limit);

    const [
      activities,
      total,
    ] =
      await queryBuilder
        .getManyAndCount();

    const items =
      activities.map(
        (activity) =>
          this.toResponseDto(
            activity,
          ),
      );

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(
            total / limit,
          ),
      },
    };
  }

  private toResponseDto(
    activity: Actividad,
  ): ActividadResponseDto {
    return {
      id:
        activity.id,

      folio:
        activity.folio,

      descripcion:
        activity.descripcion,

      proyectoPoaId:
        activity.proyectoPoaId,

      medioVerificacion:
        activity.medioVerificacion,

      tipo:
        activity.tipo,

      ingreso:
        activity.ingreso,

      conRecurso:
        activity.conRecurso,

      proyectoPoa: {
        id:
          activity.proyectoPoa.id,

        numero:
          activity.proyectoPoa.numero,

        nombre:
          activity.proyectoPoa.nombre,

        isActive:
          activity.proyectoPoa.isActive,
      },
    };
  }


  private async getSappSnapshot():
    Promise<SappActivitiesSnapshot> {
    const sappApiUrl =
      this.configService.getOrThrow<string>(
        'SAPP_API_URL',
      );

    const sappApiKey =
      this.configService.getOrThrow<string>(
        'SAPP_API_KEY',
      );

    const sappApiTimeout = Number(
      this.configService.get<string>(
        'SAPP_API_TIMEOUT',
        '10000',
      ),
    );

    try {
      const httpResponse =
        await firstValueFrom(
          this.httpService.get<
            SappActivitiesIntegrationResponse
          >(
            `${sappApiUrl}/integraciones/viaticos/actividades`,
            {
              headers: {
                'x-api-key':
                  sappApiKey,
              },
              timeout:
                sappApiTimeout,
            },
          ),
        );

      const response =
        httpResponse.data;

      if (
        !response?.success ||
        !response?.data
      ) {
        throw new BadGatewayException(
          'SAPP returned an invalid activities response.',
        );
      }

      return response.data;
    } catch (error) {
      if (
        error instanceof
        BadGatewayException
      ) {
        throw error;
      }

      throw new BadGatewayException(
        'Unable to retrieve activities from SAPP.',
      );
    }
  }

  private validateSnapshot(
    snapshot: SappActivitiesSnapshot,
  ): void {
    if (!snapshot.isComplete) {
      throw new BadGatewayException(
        'SAPP returned an incomplete activities snapshot.',
      );
    }

    if (
      snapshot.totalProjects !==
      snapshot.projects.length
    ) {
      throw new BadGatewayException(
        'SAPP projects count does not match the received data.',
      );
    }

    if (
      snapshot.totalActivities !==
      snapshot.activities.length
    ) {
      throw new BadGatewayException(
        'SAPP activities count does not match the received data.',
      );
    }

    const projectIds = new Set<string>();

    for (const project of snapshot.projects) {
      if (
        !project.id ||
        !project.numero ||
        !project.nombre
      ) {
        throw new BadGatewayException(
          'SAPP returned an invalid POA project.',
        );
      }

      if (projectIds.has(project.id)) {
        throw new BadGatewayException(
          `SAPP returned duplicated POA project ID: ${project.id}.`,
        );
      }

      projectIds.add(project.id);
    }

    const activityIds = new Set<string>();
    const activityFolios = new Set<string>();

    for (const activity of snapshot.activities) {
      if (
        !activity.id ||
        !activity.folio ||
        !activity.descripcion ||
        !activity.proyectoPoaId
      ) {
        throw new BadGatewayException(
          'SAPP returned an invalid activity.',
        );
      }

      if (
        activityIds.has(activity.id)
      ) {
        throw new BadGatewayException(
          `SAPP returned duplicated activity ID: ${activity.id}.`,
        );
      }

      if (
        activityFolios.has(
          activity.folio,
        )
      ) {
        throw new BadGatewayException(
          `SAPP returned duplicated activity folio: ${activity.folio}.`,
        );
      }

      if (
        !projectIds.has(
          activity.proyectoPoaId,
        )
      ) {
        throw new BadGatewayException(
          `Activity ${activity.folio} references an unknown POA project.`,
        );
      }

      activityIds.add(
        activity.id,
      );

      activityFolios.add(
        activity.folio,
      );
    }
  }



  async sync(
    user: AuthenticatedUser,
  ) {
    const snapshot =
      await this.getSappSnapshot();

    this.validateSnapshot(
      snapshot,
    );

    return this.dataSource.transaction(
      async (manager) => {
        const proyectoPoaRepository =
          manager.getRepository(
            ProyectoPoa,
          );

        const localProjects =
          await proyectoPoaRepository.find({
            withDeleted: true,
          });

        const localProjectsById =
          new Map(
            localProjects.map(
              (project) => [
                project.id,
                project,
              ],
            ),
          );

        let inserted = 0;
        let updated = 0;
        let reactivated = 0;

        for (
          const sappProject
          of snapshot.projects
        ) {
          const localProject =
            localProjectsById.get(
              sappProject.id,
            );

          if (!localProject) {
            const newProject =
              proyectoPoaRepository.create({
                id: sappProject.id,
                numero:
                  sappProject.numero,
                nombre:
                  sappProject.nombre,
                isActive:
                  sappProject.isActive,
                createdBy:
                  user.id,
              });

            await proyectoPoaRepository.save(
              newProject,
            );

            inserted++;

            continue;
          }

          const wasDeleted =
            localProject.deletedAt !==
            null;

          const hasChanges =
            localProject.numero !==
              sappProject.numero ||
            localProject.nombre !==
              sappProject.nombre ||
            localProject.isActive !==
              sappProject.isActive;

          if (
            !hasChanges &&
            !wasDeleted
          ) {
            continue;
          }

          localProject.numero =
            sappProject.numero;

          localProject.nombre =
            sappProject.nombre;

          localProject.isActive =
            sappProject.isActive;

          localProject.updatedBy =
            user.id;

          if (wasDeleted) {
            localProject.deletedAt =
              null;

            localProject.deletedBy =
              null;

            reactivated++;
          }

          await proyectoPoaRepository.save(
            localProject,
          );

          if (hasChanges) {
            updated++;
          }
        }

/******************************* */

        const actividadRepository =
        manager.getRepository(
          Actividad,
        );

      const localActivities =
        await actividadRepository.find({
          withDeleted: true,
        });

      const localActivitiesById =
        new Map(
          localActivities.map(
            (activity) => [
              activity.id,
              activity,
            ],
          ),
        );

      const receivedActivityIds =
        new Set<string>();

      let activitiesInserted = 0;
      let activitiesUpdated = 0;
      let activitiesReactivated = 0;
      let activitiesDeactivated = 0;

      for (
        const sappActivity
        of snapshot.activities
      ) {
        receivedActivityIds.add(
          sappActivity.id,
        );

        const localActivity =
          localActivitiesById.get(
            sappActivity.id,
          );

        /*
        * La actividad todavía no existe
        * en VIÁTICOS.
        */
        if (!localActivity) {
          const newActivity =
            actividadRepository.create({
              id: sappActivity.id,
              folio:
                sappActivity.folio,
              descripcion:
                sappActivity.descripcion,
              proyectoPoaId:
                sappActivity.proyectoPoaId,
              medioVerificacion:
                sappActivity.medioVerificacion,
              tipo:
                sappActivity.tipo,
              ingreso:
                sappActivity.ingreso,
              conRecurso:
                sappActivity.conRecurso,
              createdBy:
                user.id,
            });

          await actividadRepository.save(
            newActivity,
          );

          activitiesInserted++;

          continue;
        }

        /*
        * La actividad ya existe.
        */
        const wasDeleted =
          localActivity.deletedAt !==
          null;

        const hasChanges =
          localActivity.folio !==
            sappActivity.folio ||
          localActivity.descripcion !==
            sappActivity.descripcion ||
          localActivity.proyectoPoaId !==
            sappActivity.proyectoPoaId ||
          localActivity.medioVerificacion !==
            sappActivity.medioVerificacion ||
          localActivity.tipo !==
            sappActivity.tipo ||
          localActivity.ingreso !==
            sappActivity.ingreso ||
          localActivity.conRecurso !==
            sappActivity.conRecurso;

        /*
        * Si no cambió y tampoco estaba
        * eliminada, no hacemos UPDATE.
        */
        if (
          !hasChanges &&
          !wasDeleted
        ) {
          continue;
        }

        localActivity.folio =
          sappActivity.folio;

        localActivity.descripcion =
          sappActivity.descripcion;

        localActivity.proyectoPoaId =
          sappActivity.proyectoPoaId;

        localActivity.medioVerificacion =
          sappActivity.medioVerificacion;

        localActivity.tipo =
          sappActivity.tipo;

        localActivity.ingreso =
          sappActivity.ingreso;

        localActivity.conRecurso =
          sappActivity.conRecurso;

        localActivity.updatedBy =
          user.id;

        /*
        * Si estaba eliminada en VIÁTICOS
        * y volvió a aparecer en SAPP,
        * se reactiva.
        */
        if (wasDeleted) {
          localActivity.deletedAt =
            null;

          localActivity.deletedBy =
            null;

          activitiesReactivated++;
        }

        await actividadRepository.save(
          localActivity,
        );

        if (hasChanges) {
          activitiesUpdated++;
        }
      }

      /*
      * Actividades existentes localmente
      * que ya no aparecen en el snapshot
      * completo de SAPP.
      */
      for (
        const localActivity
        of localActivities
      ) {
        if (
          localActivity.deletedAt !== null
        ) {
          continue;
        }

        if (
          receivedActivityIds.has(
            localActivity.id,
          )
        ) {
          continue;
        }

        localActivity.deletedAt =
          new Date();

        localActivity.deletedBy =
          user.id;

        localActivity.updatedBy =
          user.id;

        await actividadRepository.save(
          localActivity,
        );

        activitiesDeactivated++;
      }
        return {
          projects: {
            received:
              snapshot.projects.length,
            inserted,
            updated,
            reactivated,
          },

          activities: {
            received:
              snapshot.activities.length,
            inserted:
              activitiesInserted,
            updated:
              activitiesUpdated,
            reactivated:
              activitiesReactivated,
            deactivated:
              activitiesDeactivated,
          },

          generatedAt:
            snapshot.generatedAt,

          done: true,
        };
      },
    );
  }



}