export interface MediaStore {
  store(buffer: Buffer, filename: string, contentType: string): Promise<string>;
  delete(pathOrUrl: string): Promise<void>;
}

export const MEDIA_STORE = Symbol('MEDIA_STORE');
