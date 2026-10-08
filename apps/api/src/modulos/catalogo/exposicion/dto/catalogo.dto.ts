import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ConsultaPaginadaDto, PaginaDto } from '../../../../compartido/paginacion/paginacion';
import { OrdenCatalogo } from '../../dominio/catalogo';

const aBooleano = ({ value }: { value: unknown }) =>
  value === true || value === 'true' ? true : value === false || value === 'false' ? false : value;

export class ConsultaCatalogoDto extends ConsultaPaginadaDto {
  @ApiPropertyOptional({ description: 'Texto a buscar en el nombre', example: 'camiseta' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() categoriaId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() vendedorId?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMin?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMax?: number;

  @ApiPropertyOptional({ description: 'true: solo con existencias' })
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean()
  disponible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean()
  preventa?: boolean;

  @ApiPropertyOptional({ enum: OrdenCatalogo, default: OrdenCatalogo.RECIENTES })
  @IsOptional()
  @IsEnum(OrdenCatalogo)
  orden: OrdenCatalogo = OrdenCatalogo.RECIENTES;
}

export class CrearProductoDto {
  @ApiProperty({ example: 'Camiseta Minimal' }) @IsString() @MinLength(2) @MaxLength(150) nombre!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) descripcion?: string;

  @ApiProperty({ example: 29.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99_999_999)
  precio!: number;

  @ApiProperty({ example: 50, description: 'Existencias iniciales' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  existencias!: number;

  @ApiProperty() @IsUUID() categoriaId!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() preventa?: boolean;
}

class CamposEditablesProducto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(150) nombre!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) descripcion?: string;
  @ApiProperty() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(99_999_999) precio!: number;
  @ApiProperty() @IsUUID() categoriaId!: string;
  @ApiProperty() @IsBoolean() preventa!: boolean;
}

/** Las existencias no se editan aquí: pertenecen a Inventario. */
export class ActualizarProductoDto extends PartialType(CamposEditablesProducto) {}

export class CategoriaDto {
  @ApiProperty({ example: 'Ropa' }) @IsString() @MinLength(2) @MaxLength(50) nombre!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) descripcion?: string;
}

export class ActualizarCategoriaDto extends PartialType(CategoriaDto) {}

export class CategoriaRespuestaDto {
  @ApiProperty() id!: string;
  @ApiProperty() nombre!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) descripcion!: string | null;
}

class ReferenciaDto {
  @ApiProperty() id!: string;
  @ApiProperty() nombre!: string;
}

export class ProductoDto {
  @ApiProperty() id!: string;
  @ApiProperty() nombre!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) descripcion!: string | null;
  @ApiProperty({ example: 29.99 }) precio!: number;
  @ApiProperty({ example: 50 }) existencias!: number;
  @ApiProperty() disponible!: boolean;
  @ApiPropertyOptional({ nullable: true, type: String, description: 'URL temporal firmada' }) imagenUrl!: string | null;
  @ApiProperty({ type: ReferenciaDto }) categoria!: ReferenciaDto;
  @ApiProperty({ type: ReferenciaDto }) vendedor!: ReferenciaDto;
  @ApiProperty() preventa!: boolean;
  @ApiProperty() activo!: boolean;
  @ApiProperty() creadoEn!: string;
}

export class PaginaProductosDto extends PaginaDto {
  @ApiProperty({ type: [ProductoDto] }) contenido!: ProductoDto[];
}
