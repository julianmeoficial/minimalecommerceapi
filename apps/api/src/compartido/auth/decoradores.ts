import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsuarioAutenticado } from './usuario-autenticado';

export const ES_PUBLICO = 'esPublico';
export const ROLES = 'roles';

/** Excluye la ruta del JwtAuthGuard global; todo lo demás exige token (denegación por defecto). */
export const Publico = () => SetMetadata(ES_PUBLICO, true);

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES, roles);

export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => ctx.switchToHttp().getRequest().user,
);
