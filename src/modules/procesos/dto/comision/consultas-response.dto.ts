export class ResponsableActividadResponseDto {
  direccion: { id: string; nombre: string } | null;
  autoriza: string | null;
  puestoAutoriza: string | null;
}

export class CalculoDestinoResponseDto {
  zona: string | null;
  diasComision: number;
  hospedaje: number;
  alimentos: number;
  peaje: number;
  conRecurso: boolean;
}
