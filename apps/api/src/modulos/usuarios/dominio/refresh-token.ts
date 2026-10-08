import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Refresh token opaco con formato `<id>.<secreto>`. Solo se persiste el hash del secreto;
 * el id permite localizar el registro sin escanear la tabla.
 */
export function generarSecreto(): string {
  return randomBytes(48).toString('base64url');
}

export function hashSecreto(secreto: string): string {
  return createHash('sha256').update(secreto).digest('hex');
}

export function componerToken(id: string, secreto: string): string {
  return `${id}.${secreto}`;
}

export function separarToken(token: string): { id: string; secreto: string } | null {
  const i = token.indexOf('.');
  if (i <= 0 || i === token.length - 1) return null;
  const id = token.slice(0, i);
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return { id, secreto: token.slice(i + 1) };
}

export function secretoCoincide(secreto: string, hashGuardado: string): boolean {
  const a = Buffer.from(hashSecreto(secreto), 'hex');
  const b = Buffer.from(hashGuardado, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Convierte "15m", "1h", "30s" o "2d" a segundos. */
export function duracionASegundos(duracion: string): number {
  const m = /^(\d+)\s*([smhd])$/.exec(duracion.trim());
  if (!m) return Number(duracion);
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[m[2] as 's' | 'm' | 'h' | 'd'];
  return Number(m[1]) * factor;
}
