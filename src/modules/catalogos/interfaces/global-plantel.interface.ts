export interface GlobalPlantel {
  plantel_id: string;
  plantel_nombre: string;
  cct: string;
  clave: string;
  tipo: string;
  modelo: string;
  nombre_director: string | null;
}

export interface GlobalPlantelesResponse {
  plantels: GlobalPlantel[];
}