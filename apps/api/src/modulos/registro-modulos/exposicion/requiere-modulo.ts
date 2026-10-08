import { applyDecorators, CanActivate, ExecutionContext, Injectable, SetMetadata, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiConflictResponse } from '@nestjs/swagger';
import { RespuestaErrorDto } from '../../../compartido/errores/respuesta-error.dto';
import { RegistroModulosService } from '../aplicacion/registro-modulos.service';
import { ClaveModulo } from '../dominio/modulos';

const MODULO_REQUERIDO = 'moduloRequerido';

@Injectable()
export class ModuloActivoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly registro: RegistroModulosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const modulo = this.reflector.getAllAndOverride<ClaveModulo | undefined>(MODULO_REQUERIDO, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (modulo) await this.registro.exigirActivo(modulo);
    return true;
  }
}

/** Responde 409 MODULE_DISABLED si el módulo está apagado en el Registro de módulos. */
export const RequiereModulo = (modulo: ClaveModulo) =>
  applyDecorators(
    SetMetadata(MODULO_REQUERIDO, modulo),
    UseGuards(ModuloActivoGuard),
    ApiConflictResponse({ type: RespuestaErrorDto, description: `MODULE_DISABLED si "${modulo}" está desactivado` }),
  );
