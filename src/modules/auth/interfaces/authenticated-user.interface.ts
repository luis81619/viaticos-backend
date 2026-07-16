import { ViaticosRole } from '../enums/viaticos-role.enum';
import { TokenTimeLeft } from './token-time-left.interface';

export interface AuthenticatedUser {
  id: string;

  email: string;
  fullName: string;
  numeroTrabajador: string;

  isActive: boolean;

  plantelId: string;
  plantelNombre: string;
  cct: string;

  tipoPlantel?: string;
  modeloPlantel?: string;

  rolesGlobal: string[];
  rolesViaticos: ViaticosRole[];

  permissions: string[];

  isAdmin: boolean;
  isDirector: boolean;
  isTrabajador: boolean;

  tokenTimeLeft: TokenTimeLeft;
}