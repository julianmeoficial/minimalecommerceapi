import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegistroDto {
  @ApiProperty({ example: 'Ana Pérez' })
  @Transform(recortar)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre!: string;

  @ApiProperty({ example: 'ana@correo.com' })
  @Transform(recortar)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 10, maxLength: 128, example: 'una-clave-larga-segura' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ example: '+573001112233' })
  @IsOptional()
  @Matches(/^\+?[0-9 ()-]{7,20}$/)
  telefono?: string;

  @ApiProperty({ enum: [UserRole.COMPRADOR, UserRole.VENDEDOR] })
  @IsIn([UserRole.COMPRADOR, UserRole.VENDEDOR])
  rol!: UserRole;
}

export class IngresoDto {
  @ApiProperty({ example: 'comprador@demo.com' })
  @Transform(recortar)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'demo12345' })
  @IsString()
  @MaxLength(128)
  password!: string;
}

export class RefrescarDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  refreshToken!: string;
}

export class UsuarioDto {
  @ApiProperty() id!: string;
  @ApiProperty() nombre!: string;
  @ApiProperty() email!: string;
  @ApiPropertyOptional({ nullable: true, type: String }) telefono!: string | null;
  @ApiProperty({ enum: UserRole }) rol!: UserRole;
  @ApiProperty() activo!: boolean;
}

export class SesionDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ description: 'Token opaco de un solo uso; se rota en cada /auth/refrescar' }) refreshToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: string;
  @ApiProperty({ example: 900, description: 'Vigencia del access token en segundos' }) expiresIn!: number;
  @ApiProperty({ type: UsuarioDto }) usuario!: UsuarioDto;
}
