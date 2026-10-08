import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, Length } from 'class-validator';
import { Publico, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { ConsultaPaginadaDto, construirPagina } from '../../../compartido/paginacion/paginacion';
import { RequiereModulo } from '../../registro-modulos/exposicion/requiere-modulo';
import { ContenidoService } from '../aplicacion/contenido.service';

class CrearPublicacionDto {
  @IsString() @Length(3, 200) titulo!: string;
  @IsOptional() @IsString() resumen?: string;
  @IsOptional() @IsString() cuerpo?: string;
}

class CrearEventoDto {
  @IsString() @Length(3, 200) titulo!: string;
  @IsOptional() @IsString() descripcion?: string;
  @Type(() => Date) @IsDate() iniciaEn!: Date;
  @IsOptional() @Type(() => Date) @IsDate() terminaEn?: Date;
  @IsOptional() @IsString() ubicacion?: string;
}

@ApiTags('contenido')
@RequiereModulo('contenido')
@Controller({ path: 'contenido', version: '1' })
export class ContenidoController {
  constructor(private readonly contenido: ContenidoService) {}

  @Get('publicaciones')
  @Publico()
  async publicaciones(@Query() q: ConsultaPaginadaDto) {
    const [rows, total] = await this.contenido.publicaciones(q.pagina, q.tamano);
    return construirPagina(rows, total, q.pagina, q.tamano);
  }

  @Get('eventos')
  @Publico()
  async eventos(@Query() q: ConsultaPaginadaDto) {
    const [rows, total] = await this.contenido.eventos(q.pagina, q.tamano);
    return construirPagina(rows, total, q.pagina, q.tamano);
  }

  @Post('publicaciones')
  @ApiBearerAuth()
  crearPublicacion(@UsuarioActual() u: UsuarioAutenticado, @Body() dto: CrearPublicacionDto) {
    return this.contenido.crearPublicacion(u, dto);
  }

  @Post('eventos')
  @ApiBearerAuth()
  crearEvento(@UsuarioActual() u: UsuarioAutenticado, @Body() dto: CrearEventoDto) {
    return this.contenido.crearEvento(u, dto);
  }
}
