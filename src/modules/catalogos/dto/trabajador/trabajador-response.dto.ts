export class TrabajadorResponseDto {
  id: string;

  nombre: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;

  emailPersonal: string | null;
  emailInstitucional: string | null;

  numeroCuentaNomina: string | null;
  numeroSeguridadSocial: string | null;
  numeroInfonavit: string | null;
  numeroTrabajador: number | null;

  rfc: string | null;

  celular: string | null;
  telefono: string | null;
  otroTelefono: string | null;

  bancoId: string | null;
  fotoId: string | null;
  firmaId: string | null;
  plantelId: string | null;

  createdAt: Date;
  updatedAt: Date;
}
