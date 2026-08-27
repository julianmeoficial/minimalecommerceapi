import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiException } from './api-error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Error interno';
    let details: string[] = [];

    if (exception instanceof ApiException) {
      status = exception.status;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body) {
        const obj = body as Record<string, unknown>;
        message = (obj.message as string) || message;
        code = (obj.error as string) || code;
        if (Array.isArray(obj.message)) {
          details = obj.message as string[];
          message = 'La petición no es válida';
          code = 'VALIDATION_ERROR';
        }
      }
    }

    res.status(status).json({
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: req.url,
      correlationId: req.headers['x-correlation-id'] ?? (req as { id?: string }).id,
    });
  }
}
