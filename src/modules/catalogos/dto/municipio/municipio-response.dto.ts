export class MunicipioResponseDto {
  id: string;

  nombre: string;

  region?: string;

  estado: {
    id: string;
    nombre: string;
    clave: number;
  } | null;

  zona: {
    id: string;
    nombre: string;
    zona: string;
  } | null;

  createdAt: Date;

  updatedAt: Date;
}
