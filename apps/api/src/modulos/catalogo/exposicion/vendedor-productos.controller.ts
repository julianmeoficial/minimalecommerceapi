import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { RespuestaErrorDto } from '../../../compartido/errores/respuesta-error.dto';
import { TAMANO_MAXIMO_IMAGEN } from '../../../compartido/media/validar-imagen';
import { ConsultaPaginadaDto, construirPagina } from '../../../compartido/paginacion/paginacion';
import { GestionProductosService } from '../aplicacion/gestion-productos.service';
import { ActualizarProductoDto, CrearProductoDto, PaginaProductosDto, ProductoDto } from './dto/catalogo.dto';

/** CU-08 Publicar y editar productos. */
@ApiTags('vendedor / productos')
@ApiBearerAuth()
@ApiForbiddenResponse({ type: RespuestaErrorDto, description: 'Rol distinto de vendedor o producto de otro vendedor' })
@Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
@Controller({ path: 'vendedor/productos', version: '1' })
export class VendedorProductosController {
  constructor(private readonly gestion: GestionProductosService) {}

  @Get()
  @ApiOkResponse({ type: PaginaProductosDto })
  async misProductos(@UsuarioActual() u: UsuarioAutenticado, @Query() q: ConsultaPaginadaDto): Promise<PaginaProductosDto> {
    const [contenido, total] = await this.gestion.misProductos(u, q.pagina, q.tamano);
    return construirPagina(contenido, total, q.pagina, q.tamano);
  }

  @Post()
  @ApiCreatedResponse({ type: ProductoDto })
  crear(@UsuarioActual() u: UsuarioAutenticado, @Body() dto: CrearProductoDto): Promise<ProductoDto> {
    return this.gestion.crear(u, {
      name: dto.nombre,
      description: dto.descripcion,
      price: dto.precio,
      stock: dto.existencias,
      categoryId: dto.categoriaId,
      preorder: !!dto.preventa,
    });
  }

  @Patch(':id')
  @ApiOkResponse({ type: ProductoDto })
  actualizar(
    @UsuarioActual() u: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarProductoDto,
  ): Promise<ProductoDto> {
    return this.gestion.actualizar(u, id, {
      name: dto.nombre,
      description: dto.descripcion,
      price: dto.precio,
      categoryId: dto.categoriaId,
      preorder: dto.preventa,
    });
  }

  @Post(':id/publicar')
  @HttpCode(200)
  @ApiOkResponse({ type: ProductoDto })
  publicar(@UsuarioActual() u: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string): Promise<ProductoDto> {
    return this.gestion.cambiarPublicacion(u, id, true);
  }

  @Post(':id/despublicar')
  @HttpCode(200)
  @ApiOkResponse({ type: ProductoDto })
  despublicar(@UsuarioActual() u: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string): Promise<ProductoDto> {
    return this.gestion.cambiarPublicacion(u, id, false);
  }

  @Put(':id/imagen')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { archivo: { type: 'string', format: 'binary' } } } })
  @ApiOkResponse({ type: ProductoDto })
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: TAMANO_MAXIMO_IMAGEN, files: 1 } }))
  imagen(
    @UsuarioActual() u: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() archivo?: Express.Multer.File,
  ): Promise<ProductoDto> {
    return this.gestion.adjuntarImagen(u, id, archivo?.buffer);
  }
}
