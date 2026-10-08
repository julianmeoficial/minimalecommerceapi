import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../../compartido/auth/decoradores';
import { RespuestaErrorDto } from '../../../compartido/errores/respuesta-error.dto';
import { CategoriasService } from '../aplicacion/categorias.service';
import { aCategoriaDto } from './catalogo.controller';
import { ActualizarCategoriaDto, CategoriaDto, CategoriaRespuestaDto } from './dto/catalogo.dto';

@ApiTags('admin / categorias')
@ApiBearerAuth()
@Roles(UserRole.SUPERADMIN)
@Controller({ path: 'admin/categorias', version: '1' })
export class AdminCategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  @Post()
  @ApiCreatedResponse({ type: CategoriaRespuestaDto })
  @ApiConflictResponse({ type: RespuestaErrorDto, description: 'CATEGORY_EXISTS' })
  async crear(@Body() dto: CategoriaDto): Promise<CategoriaRespuestaDto> {
    return aCategoriaDto(await this.categorias.crear({ name: dto.nombre, description: dto.descripcion }));
  }

  @Patch(':id')
  @ApiOkResponse({ type: CategoriaRespuestaDto })
  async actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarCategoriaDto): Promise<CategoriaRespuestaDto> {
    return aCategoriaDto(await this.categorias.actualizar(id, { name: dto.nombre, description: dto.descripcion }));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiConflictResponse({ type: RespuestaErrorDto, description: 'CATEGORY_IN_USE' })
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    await this.categorias.eliminar(id);
  }
}
