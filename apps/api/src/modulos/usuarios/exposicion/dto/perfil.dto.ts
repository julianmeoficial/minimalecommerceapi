import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ConsultaPaginadaDto } from '../../../../compartido/paginacion/paginacion';

export class ActualizarPerfilDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(100) nombre?: string;
  @ApiPropertyOptional() @IsOptional() @Matches(/^\+?[0-9 ()-]{7,20}$/) telefono?: string;
}

export class DireccionDto {
  @ApiProperty({ example: 'Casa' }) @IsString() @MaxLength(100) etiqueta!: string;
  @ApiProperty({ example: 'Calle 10 # 20-30' }) @IsString() @MinLength(5) @MaxLength(400) direccion!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) ciudad?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) codigoPostal?: string;
  @ApiPropertyOptional() @IsOptional() @Matches(/^\+?[0-9 ()-]{7,20}$/) telefono?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() principal?: boolean;
}

export class DireccionRespuestaDto {
  @ApiProperty() id!: string;
  @ApiProperty() etiqueta!: string;
  @ApiProperty() direccion!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) ciudad!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) codigoPostal!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) telefono!: string | null;
  @ApiProperty() principal!: boolean;
}

export class ListarUsuariosDto extends ConsultaPaginadaDto {
  @ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole) rol?: UserRole;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => String(value).trim()) @IsString() @MaxLength(100) q?: string;
}

export class AdministrarUsuarioDto {
  @ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole) rol?: UserRole;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() activo?: boolean;
}
