import { ApiProperty } from '@nestjs/swagger';
import { CodigoError } from './codigos-error';

export class RespuestaErrorDto {
  @ApiProperty({ enum: CodigoError, example: CodigoError.NOT_FOUND })
  code!: CodigoError;

  @ApiProperty({ example: 'producto no encontrado' })
  message!: string;

  @ApiProperty({ type: [String], example: [] })
  details!: string[];

  @ApiProperty({ example: '2026-10-08T19:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/catalogo/productos/123' })
  path!: string;

  @ApiProperty({ example: '6f1c2b0e-3a6c-4c9e-9a51-0d1f6b8f2a11' })
  correlationId!: string;
}
