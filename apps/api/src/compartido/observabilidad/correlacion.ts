import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const CABECERA_CORRELACION = 'x-correlation-id';
const FORMATO_VALIDO = /^[A-Za-z0-9._-]{8,64}$/;

/**
 * Normaliza el identificador de correlación antes que cualquier otro middleware para
 * que Pino, CLS y la respuesta usen el mismo valor. Los valores externos con formato
 * no válido se reemplazan para evitar inyección en los registros.
 */
export function middlewareCorrelacion(req: Request, res: Response, next: NextFunction) {
  const entrante = req.headers[CABECERA_CORRELACION];
  const id = typeof entrante === 'string' && FORMATO_VALIDO.test(entrante) ? entrante : randomUUID();
  req.headers[CABECERA_CORRELACION] = id;
  res.setHeader(CABECERA_CORRELACION, id);
  next();
}
