import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { CodigoError } from '../errores/codigos-error';
import { NoAutorizado, Prohibido } from '../errores/error-api';
import { ES_PUBLICO, ROLES } from './decoradores';
import { UsuarioAutenticado } from './usuario-autenticado';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const publico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publico) return true;
    return super.canActivate(context);
  }

  handleRequest<T>(err: unknown, user: T): T {
    if (err || !user) throw new NoAutorizado('Token ausente, inválido o vencido', CodigoError.TOKEN_INVALID);
    return user;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const user: UsuarioAutenticado | undefined = context.switchToHttp().getRequest().user;
    if (!user || !roles.includes(user.role)) {
      throw new Prohibido('Tu rol no permite esta operación');
    }
    return true;
  }
}
