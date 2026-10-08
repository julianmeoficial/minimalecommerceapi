import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsBoolean } from 'class-validator';
import { Roles } from '../../../compartido/auth/decoradores';
import { NoEncontrado } from '../../../compartido/errores/error-api';
import { RegistroModulosService } from '../aplicacion/registro-modulos.service';
import { esClaveModulo } from '../dominio/modulos';

class CambiarModuloDto {
  @ApiProperty() @IsBoolean() activo!: boolean;
}

@ApiTags('admin / modulos')
@ApiBearerAuth()
@Roles(UserRole.SUPERADMIN)
@Controller({ path: 'admin/modulos', version: '1' })
export class ModulosController {
  constructor(private readonly registro: RegistroModulosService) {}

  @Get()
  listar() {
    return this.registro.listar();
  }

  @Patch(':clave')
  cambiar(@Param('clave') clave: string, @Body() dto: CambiarModuloDto) {
    if (!esClaveModulo(clave)) throw new NoEncontrado('módulo', clave);
    return this.registro.cambiar(clave, dto.activo);
  }
}
