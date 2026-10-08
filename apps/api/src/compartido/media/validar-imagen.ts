import { CodigoError } from '../errores/codigos-error';
import { ErrorApi } from '../errores/error-api';

export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

interface FirmaImagen {
  mime: string;
  extension: string;
  coincide: (b: Buffer) => boolean;
}

const FIRMAS: FirmaImagen[] = [
  { mime: 'image/jpeg', extension: '.jpg', coincide: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    extension: '.png',
    coincide: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/webp',
    extension: '.webp',
    coincide: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  { mime: 'image/gif', extension: '.gif', coincide: (b) => b.subarray(0, 4).toString('ascii') === 'GIF8' },
];

/** Determina el tipo por los bytes iniciales; el Content-Type y el nombre los controla el cliente y no se confía en ellos. */
export function validarImagen(buffer: Buffer | undefined): { mime: string; extension: string } {
  if (!buffer?.length) {
    throw new ErrorApi(CodigoError.INVALID_IMAGE, 'Adjunta una imagen en el campo "archivo"');
  }
  if (buffer.length > TAMANO_MAXIMO_IMAGEN) {
    throw new ErrorApi(CodigoError.INVALID_IMAGE, 'La imagen supera 5 MB');
  }
  const firma = FIRMAS.find((f) => f.coincide(buffer));
  if (!firma) {
    throw new ErrorApi(CodigoError.INVALID_IMAGE, 'Formato no soportado: usa JPEG, PNG, WEBP o GIF');
  }
  return { mime: firma.mime, extension: firma.extension };
}
