import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CouponType, UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { ConsultaPaginadaDto, construirPagina } from '../../../compartido/paginacion/paginacion';
import { RequiereModulo } from '../../registro-modulos/exposicion/requiere-modulo';
import { CuponesService } from '../aplicacion/cupones.service';

class CrearCuponDto {
  @IsString() @MaxLength(40) codigo!: string;
  @IsEnum(CouponType) tipo!: CouponType;
  @Type(() => Number) @IsNumber() @Min(0.01) @Max(100000) valor!: number;
  @IsOptional() @IsString() descripcion?: string;
  @Type(() => Date) @IsDate() iniciaEn!: Date;
  @Type(() => Date) @IsDate() venceEn!: Date;
  @Type(() => Number) @IsNumber() @Min(1) maxUsos!: number;
}

@ApiTags('vendedor / cupones')
@ApiBearerAuth()
@RequiereModulo('cupones')
@Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
@Controller({ path: 'vendedor/cupones', version: '1' })
export class CuponesVendedorController {
  constructor(private readonly cupones: CuponesService) {}

  @Post()
  crear(@UsuarioActual() u: UsuarioAutenticado, @Body() dto: CrearCuponDto) {
    return this.cupones.crear(u, {
      code: dto.codigo,
      type: dto.tipo,
      value: dto.valor,
      description: dto.descripcion,
      startsAt: dto.iniciaEn,
      expiresAt: dto.venceEn,
      maxUses: dto.maxUsos,
      active: true,
    });
  }

  @Get()
  async listar(@UsuarioActual() u: UsuarioAutenticado, @Query() q: ConsultaPaginadaDto) {
    const [rows, total] = await this.cupones.misCupones(u, q.pagina, q.tamano);
    return construirPagina(rows, total, q.pagina, q.tamano);
  }
}
