import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { RespuestaErrorDto } from '../../../compartido/errores/respuesta-error.dto';
import { InventarioService } from '../aplicacion/inventario.service';

class ExistenciasDto {
  @ApiProperty({ example: 25 }) @Type(() => Number) @IsInt() @Min(0) @Max(1_000_000) existencias!: number;
}

class ExistenciasRespuestaDto {
  @ApiProperty() productoId!: string;
  @ApiProperty() existencias!: number;
}

/** CU-09 Gestionar inventario. */
@ApiTags('vendedor / inventario')
@ApiBearerAuth()
@Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
@Controller({ path: 'vendedor/productos', version: '1' })
export class InventarioController {
  constructor(private readonly inventario: InventarioService) {}

  @Put(':id/existencias')
  @ApiOkResponse({ type: ExistenciasRespuestaDto })
  @ApiForbiddenResponse({ type: RespuestaErrorDto })
  async ajustar(
    @UsuarioActual() u: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExistenciasDto,
  ): Promise<ExistenciasRespuestaDto> {
    return { productoId: id, existencias: await this.inventario.ajustarExistencias(u, id, dto.existencias) };
  }
}
