import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const TAMANO_MAXIMO = 50;

export class ConsultaPaginadaDto {
  @ApiPropertyOptional({ minimum: 0, default: 0, description: 'Índice de página (base 0)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pagina: number = 0;

  @ApiPropertyOptional({ minimum: 1, maximum: TAMANO_MAXIMO, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(TAMANO_MAXIMO)
  tamano: number = 20;
}

export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}

export function construirPagina<T>(contenido: T[], total: number, pagina: number, tamano: number): Pagina<T> {
  return {
    contenido,
    pagina,
    tamano,
    totalElementos: total,
    totalPaginas: Math.ceil(total / tamano),
  };
}

export abstract class PaginaDto {
  @ApiProperty({ example: 0 }) pagina!: number;
  @ApiProperty({ example: 20 }) tamano!: number;
  @ApiProperty({ example: 57 }) totalElementos!: number;
  @ApiProperty({ example: 3 }) totalPaginas!: number;
}
