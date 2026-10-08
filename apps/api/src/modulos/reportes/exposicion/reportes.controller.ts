import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { ReportesService } from '../aplicacion/reportes.service';

class DiasDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) dias?: number = 30;
}

@ApiTags('reportes')
@ApiBearerAuth()
@Controller({ version: '1' })
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get('vendedor/metricas')
  @Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
  metricasVendedor(@UsuarioActual() u: UsuarioAutenticado, @Query() q: DiasDto) {
    return this.reportes.metricasVendedor(u, q.dias);
  }

  @Get('admin/reportes/plataforma')
  @Roles(UserRole.SUPERADMIN)
  plataforma(@UsuarioActual() u: UsuarioAutenticado) {
    return this.reportes.plataforma(u);
  }

  @Get('admin/reportes/ventas')
  @Roles(UserRole.SUPERADMIN)
  ventas(@UsuarioActual() u: UsuarioAutenticado, @Query() q: DiasDto) {
    return this.reportes.ventas(u, q.dias);
  }
}
