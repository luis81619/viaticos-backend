export interface RhTrabajador {
  id: string;

  nombre: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;

  emailPersonal: string | null;
  emailInstitucional: string | null;

  numeroCuentaNomina: string | null;
  numeroSeguridadSocial: string | null;
  numeroTrabajador: number | null;

  rfc: string | null;

  celular: string | null;
  telefono: string | null;
  otroTelefono: string | null;

  createdAt: string;
  updatedAt: string;

  bancoId: string | null;
}

export interface RhTrabajadoresResponse {
  success: boolean;
  generatedAt: string;
  total: number;
  isComplete: boolean;
  trabajadores: RhTrabajador[];
}
