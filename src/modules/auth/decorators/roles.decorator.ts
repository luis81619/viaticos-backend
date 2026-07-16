import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../constants/auth.constants';
import { ViaticosRole } from '../enums/viaticos-role.enum';

export const Roles = (...roles: ViaticosRole[]) =>
  SetMetadata(ROLES_KEY, roles);