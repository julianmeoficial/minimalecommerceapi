import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { CodigoError } from './codigos-error';
import { ErrorApi } from './error-api';

interface Traducido {
  status: number;
  code: CodigoError;
  message: string;
  details: string[];
}

const CODIGO_POR_ESTADO: Record<number, CodigoError> = {
  400: CodigoError.VALIDATION_ERROR,
  401: CodigoError.UNAUTHORIZED,
  403: CodigoError.FORBIDDEN,
  404: CodigoError.NOT_FOUND,
  409: CodigoError.CONFLICT,
  429: CodigoError.TOO_MANY_REQUESTS,
};

@Catch()
export class FiltroExcepciones implements ExceptionFilter {
  private readonly logger = new Logger('Errores');

  constructor(private readonly cls: ClsService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { user?: { userId?: string } }>();
    const correlationId = this.cls.getId() ?? (req.headers['x-correlation-id'] as string);

    const t = this.traducir(exception);
    const contexto = {
      correlationId,
      code: t.code,
      status: t.status,
      method: req.method,
      path: req.originalUrl ?? req.url,
      userId: req.user?.userId,
    };

    if (t.status >= 500) {
      this.logger.error({ ...contexto, err: exception }, 'Error no controlado');
    } else if (t.status === 401 || t.status === 403) {
      this.logger.warn(contexto, 'Acceso denegado');
    }

    res.status(t.status).json({
      code: t.code,
      message: t.message,
      details: t.details,
      timestamp: new Date().toISOString(),
      path: contexto.path,
      correlationId,
    });
  }

  private traducir(exception: unknown): Traducido {
    if (exception instanceof ErrorApi) {
      return {
        status: exception.status,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return { status: 409, code: CodigoError.CONFLICT, message: 'El recurso ya existe', details: [] };
        case 'P2003':
          return { status: 409, code: CodigoError.CONFLICT, message: 'El recurso está referenciado por otros datos', details: [] };
        case 'P2025':
          return { status: 404, code: CodigoError.NOT_FOUND, message: 'Recurso no encontrado', details: [] };
      }
    }

    if (exception instanceof ThrottlerException) {
      return { status: 429, code: CodigoError.TOO_MANY_REQUESTS, message: 'Demasiadas peticiones', details: [] };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const code = CODIGO_POR_ESTADO[status] ?? (status >= 500 ? CodigoError.INTERNAL_ERROR : CodigoError.VALIDATION_ERROR);
      if (typeof body === 'object' && body && Array.isArray((body as { message?: unknown }).message)) {
        return {
          status,
          code: CodigoError.VALIDATION_ERROR,
          message: 'La petición no es válida',
          details: (body as { message: string[] }).message,
        };
      }
      if (status >= 500) {
        return { status, code, message: 'Error interno', details: [] };
      }
      const message =
        typeof body === 'string' ? body : ((body as { message?: string }).message ?? exception.message);
      return { status, code, message, details: [] };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: CodigoError.INTERNAL_ERROR,
      message: 'Error interno',
      details: [],
    };
  }
}
