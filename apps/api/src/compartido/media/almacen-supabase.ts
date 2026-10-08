import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { CodigoError } from '../errores/codigos-error';
import { ErrorApi } from '../errores/error-api';
import { AlmacenMedios } from './almacen-medios';

/** El bucket debe ser privado: las lecturas usan URL firmadas con vencimiento. */
@Injectable()
export class AlmacenSupabase extends AlmacenMedios {
  private readonly client: SupabaseClient;
  private readonly bucket: string;
  private readonly ttl: number;

  constructor(config: ConfigService) {
    super();
    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
    this.bucket = config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'product-images';
    this.ttl = config.get<number>('MEDIA_URL_TTL_SEGUNDOS') ?? 3600;
  }

  async guardar(buffer: Buffer, extension: string, contentType: string): Promise<string> {
    const clave = `productos/${randomUUID()}${extension}`;
    const { error } = await this.client.storage.from(this.bucket).upload(clave, buffer, { contentType, upsert: false });
    if (error) throw new ErrorApi(CodigoError.MEDIA_STORE_ERROR, 'No se pudo guardar la imagen', 502);
    return clave;
  }

  async eliminar(clave: string): Promise<void> {
    await this.client.storage.from(this.bucket).remove([clave]);
  }

  async urlLectura(clave: string): Promise<string> {
    const { data, error } = await this.client.storage.from(this.bucket).createSignedUrl(clave, this.ttl);
    if (error || !data) throw new ErrorApi(CodigoError.MEDIA_STORE_ERROR, 'No se pudo firmar la URL', 502);
    return data.signedUrl;
  }
}
