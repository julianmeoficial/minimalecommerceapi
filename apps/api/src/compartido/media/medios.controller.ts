import { Controller, Get, Param, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { Publico } from '../auth/decoradores';
import { NoEncontrado } from '../errores/error-api';
import { AlmacenLocal } from './almacen-local';

/** Sirve imágenes solo con el driver local (desarrollo). */
@ApiExcludeController()
@Controller({ path: 'medios', version: '1' })
export class MediosController {
  constructor(
    private readonly local: AlmacenLocal,
    private readonly config: ConfigService,
  ) {}

  @Publico()
  @Get(':clave')
  servir(@Param('clave') clave: string, @Res() res: Response) {
    const ruta = this.local.rutaDe(clave);
    if (this.config.get('MEDIA_DRIVER') !== 'local' || !ruta || !existsSync(ruta)) {
      throw new NoEncontrado('archivo', clave);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(ruta);
  }
}
