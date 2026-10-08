import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Publico, Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { ConsultaPaginadaDto, construirPagina } from '../../../compartido/paginacion/paginacion';
import { RequiereModulo } from '../../registro-modulos/exposicion/requiere-modulo';
import { ResenasService } from '../aplicacion/resenas.service';

class CrearResenaDto {
  @IsUUID() productoId!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) puntuacion!: number;
  @IsOptional() @IsString() @MaxLength(2000) comentario?: string;
}

@ApiTags('resenas')
@RequiereModulo('resenas')
@Controller({ path: 'resenas', version: '1' })
export class ResenasController {
  constructor(private readonly resenas: ResenasService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.COMPRADOR)
  crear(@UsuarioActual() u: UsuarioAutenticado, @Body() dto: CrearResenaDto) {
    return this.resenas.crear(u, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth()
  async eliminar(@UsuarioActual() u: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    await this.resenas.eliminar(u, id);
  }
}

@ApiTags('catalogo')
@Publico()
@RequiereModulo('resenas')
@Controller({ path: 'catalogo/productos', version: '1' })
export class ResenasCatalogoController {
  constructor(private readonly resenas: ResenasService) {}

  @Get(':id/resenas')
  async listar(@Param('id', ParseUUIDPipe) id: string, @Query() q: ConsultaPaginadaDto) {
    const [rows, total] = await this.resenas.listarProducto(id, q.pagina, q.tamano);
    return construirPagina(rows, total, q.pagina, q.tamano);
  }
}
