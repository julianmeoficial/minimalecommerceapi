import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Publico } from '../../../compartido/auth/decoradores';
import { RespuestaErrorDto } from '../../../compartido/errores/respuesta-error.dto';
import { CategoriasService } from '../aplicacion/categorias.service';
import { ConsultaCatalogoService } from '../aplicacion/consulta-catalogo.service';
import { CategoriaRespuestaDto, ConsultaCatalogoDto, PaginaProductosDto, ProductoDto } from './dto/catalogo.dto';

export const aCategoriaDto = (c: Category): CategoriaRespuestaDto => ({
  id: c.id,
  nombre: c.name,
  descripcion: c.description,
});

/** CU-01 Consultar catálogo (público). */
@ApiTags('catalogo')
@Publico()
@Controller({ path: 'catalogo', version: '1' })
export class CatalogoController {
  constructor(
    private readonly consulta: ConsultaCatalogoService,
    private readonly categorias: CategoriasService,
  ) {}

  @Get('productos')
  @ApiOkResponse({ type: PaginaProductosDto, description: 'Primera página en menos de 2 s con 100 interacciones concurrentes (EAC-01)' })
  consultar(@Query() q: ConsultaCatalogoDto): Promise<PaginaProductosDto> {
    return this.consulta.consultaCatalogo(q);
  }

  @Get('productos/:id')
  @ApiOkResponse({ type: ProductoDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  detalle(@Param('id', ParseUUIDPipe) id: string): Promise<ProductoDto> {
    return this.consulta.detalle(id);
  }

  @Get('categorias')
  @ApiOkResponse({ type: [CategoriaRespuestaDto] })
  async listarCategorias(): Promise<CategoriaRespuestaDto[]> {
    return (await this.categorias.listar()).map(aCategoriaDto);
  }
}
