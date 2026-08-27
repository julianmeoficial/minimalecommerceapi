export class ApiException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details: string[] = [],
  ) {
    super(message);
  }
}

export class NotFoundError extends ApiException {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', id ? `${resource} no encontrado: ${id}` : `${resource} no encontrado`, 404);
  }
}

export class ConflictError extends ApiException {
  constructor(code: string, message: string) {
    super(code, message, 409);
  }
}

export class ForbiddenError extends ApiException {
  constructor(message = 'No tienes permiso para esta operación') {
    super('FORBIDDEN', message, 403);
  }
}
