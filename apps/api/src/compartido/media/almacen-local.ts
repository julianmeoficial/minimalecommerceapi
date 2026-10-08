import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { AlmacenMedios } from './almacen-medios';

export const PATRON_CLAVE_MEDIO = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/;

/** Solo para desarrollo: la validación de entorno obliga a Supabase en producción. */
@Injectable()
export class AlmacenLocal extends AlmacenMedios {
  readonly raiz: string;

  constructor(config: ConfigService) {
    super();
    this.raiz = path.resolve(config.get<string>('UPLOAD_DIR') ?? '../../.data/uploads');
  }

  async guardar(buffer: Buffer, extension: string): Promise<string> {
    await fs.mkdir(this.raiz, { recursive: true });
    const clave = `${randomUUID()}${extension}`;
    await fs.writeFile(path.join(this.raiz, clave), buffer);
    return clave;
  }

  async eliminar(clave: string): Promise<void> {
    if (!PATRON_CLAVE_MEDIO.test(clave)) return;
    await fs.unlink(path.join(this.raiz, clave)).catch(() => undefined);
  }

  urlLectura(clave: string): Promise<string> {
    return Promise.resolve(`/api/v1/medios/${clave}`);
  }

  rutaDe(clave: string): string | null {
    return PATRON_CLAVE_MEDIO.test(clave) ? path.join(this.raiz, clave) : null;
  }
}
