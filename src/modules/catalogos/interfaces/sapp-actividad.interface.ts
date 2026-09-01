import { TipoUnidad } from '../enums/tipo-unidad.enum';

export interface SappProyectoPoa {
  id: string;
  numero: number;
  nombre: string;
  isActive: boolean;
}

export interface SappActividad {
  id: string;
  folio: string;
  descripcion: string;
  proyectoPoaId: string;
  medioVerificacion: string;
  tipo: TipoUnidad;
  ingreso: string;
  conRecurso: boolean;
}

export interface SappActivitiesSnapshot {
  projects: SappProyectoPoa[];
  activities: SappActividad[];

  totalProjects: number;
  totalActivities: number;

  isComplete: boolean;
  generatedAt: string;
}

export interface SappActivitiesIntegrationResponse {
  success: boolean;
  status: number;
  message: string;
  data: SappActivitiesSnapshot;
}