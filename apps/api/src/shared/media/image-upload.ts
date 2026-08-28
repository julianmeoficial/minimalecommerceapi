import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const imageUploadOptions: MulterOptions = {
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file || !ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(
        new BadRequestException(
          'Solo se permiten imágenes JPEG, PNG, WebP o GIF (máx. 5 MB)',
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
};
