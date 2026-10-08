import { CodigoError } from './codigos-error';

export class ErrorApi extends Error {
  constructor(
    public readonly code: CodigoError,
    message: string,
    public readonly status: number = 400,
    public readonly details: string[] = [],
  ) {
    super(message);
  }
}

export class NoEncontrado extends ErrorApi {
  constructor(recurso: string, id?: string) {
    super(CodigoError.NOT_FOUND, id ? `${recurso} no encontrado: ${id}` : `${recurso} no encontrado`, 404);
  }
}

export class Conflicto extends ErrorApi {
  constructor(code: CodigoError, message: string) {
    super(code, message, 409);
  }
}

export class Prohibido extends ErrorApi {
  constructor(message = 'No tienes permiso para esta operación', code = CodigoError.FORBIDDEN) {
    super(code, message, 403);
  }
}

export class NoAutorizado extends ErrorApi {
  constructor(message = 'Credenciales inválidas', code = CodigoError.UNAUTHORIZED) {
    super(code, message, 401);
  }
}

export class ServicioNoDisponible extends ErrorApi {
  constructor(code: CodigoError, message: string) {
    super(code, message, 503);
  }
}
