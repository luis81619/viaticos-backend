import { GlobalPlantel } from './global-plantel.interface';
import { TokenTimeLeft } from './token-time-left.interface';

export interface GlobalAuthUser {
  user_id: string;

  nombres: string;
  apell_Paterno: string;
  apell_Materno: string;

  email: string;
  numeroTrabajador: string;

  isActive: boolean;
  lastSession: string;

  plantelId: string;
  plantel: GlobalPlantel;

  roles: string[];

  timeLeft: TokenTimeLeft;
}