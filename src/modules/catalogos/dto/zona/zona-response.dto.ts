export class ZonaResponseDto {
  id: string;

  nombre: string;

  zona: string;

  descripcion?: string;

  estado?: {
    id: string;
    nombre: string;
    clave: number;
  };
}
