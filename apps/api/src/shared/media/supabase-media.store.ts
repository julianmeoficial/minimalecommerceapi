import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { MediaStore } from './media-store';
import { ApiException } from '../errors/api-error';

@Injectable()
export class SupabaseMediaStore implements MediaStore {
  private client: SupabaseClient;
  private bucket: string;

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for supabase media');
    }
    this.client = createClient(url, key);
    this.bucket = config.get<string>('SUPABASE_STORAGE_BUCKET') || 'product-images';
  }

  async store(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const ext = path.extname(filename) || '.bin';
    const key = `${randomUUID()}${ext}`;
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, buffer, { contentType, upsert: false });
    if (error) throw new ApiException('MEDIA_STORE_ERROR', error.message, 500);
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  async delete(pathOrUrl: string): Promise<void> {
    const key = pathOrUrl.split('/').pop();
    if (!key) return;
    await this.client.storage.from(this.bucket).remove([key]);
  }
}
