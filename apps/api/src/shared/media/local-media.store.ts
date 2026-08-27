import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { MediaStore } from './media-store';

@Injectable()
export class LocalMediaStore implements MediaStore {
  private root: string;

  constructor(config: ConfigService) {
    this.root = path.resolve(config.get<string>('UPLOAD_DIR') || './uploads');
  }

  async store(buffer: Buffer, filename: string, _contentType: string): Promise<string> {
    await fs.mkdir(this.root, { recursive: true });
    const ext = path.extname(filename) || '.bin';
    const name = `${randomUUID()}${ext}`;
    await fs.writeFile(path.join(this.root, name), buffer);
    return `/api/v1/media/${name}`;
  }

  async delete(pathOrUrl: string): Promise<void> {
    const name = pathOrUrl.split('/').pop();
    if (!name) return;
    await fs.unlink(path.join(this.root, name)).catch(() => undefined);
  }
}
