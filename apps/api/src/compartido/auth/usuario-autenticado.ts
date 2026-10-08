import { UserRole } from '@prisma/client';

/** Payload del JWT validado; clase para compatibilidad con emitDecoratorMetadata. */
export class UsuarioAutenticado {
  userId!: string;
  email!: string;
  role!: UserRole;
}

export const esSuperadmin = (u: UsuarioAutenticado) => u.role === UserRole.SUPERADMIN;
