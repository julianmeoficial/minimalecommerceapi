import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { PerfilService } from '../aplicacion/perfil.service';
import { UsuarioDto } from './dto/auth.dto';
import { ActualizarPerfilDto, DireccionDto, DireccionRespuestaDto } from './dto/perfil.dto';
import { aDireccionDto, aUsuarioDto } from './mapeo';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller({ path: 'usuarios/yo', version: '1' })
export class PerfilController {
  constructor(private readonly perfil: PerfilService) {}

  @Get()
  @ApiOkResponse({ type: UsuarioDto })
  async obtener(@UsuarioActual() u: UsuarioAutenticado): Promise<UsuarioDto> {
    return aUsuarioDto(await this.perfil.obtener(u.userId));
  }

  @Patch()
  @ApiOkResponse({ type: UsuarioDto })
  async actualizar(@UsuarioActual() u: UsuarioAutenticado, @Body() dto: ActualizarPerfilDto): Promise<UsuarioDto> {
    return aUsuarioDto(await this.perfil.actualizar(u.userId, dto));
  }

  @Get('direcciones')
  @ApiOkResponse({ type: [DireccionRespuestaDto] })
  async direcciones(@UsuarioActual() u: UsuarioAutenticado): Promise<DireccionRespuestaDto[]> {
    return (await this.perfil.listarDirecciones(u.userId)).map(aDireccionDto);
  }

  @Post('direcciones')
  @ApiCreatedResponse({ type: DireccionRespuestaDto })
  async crearDireccion(@UsuarioActual() u: UsuarioAutenticado, @Body() dto: DireccionDto): Promise<DireccionRespuestaDto> {
    const d = await this.perfil.crearDireccion(u.userId, {
      label: dto.etiqueta,
      fullAddress: dto.direccion,
      city: dto.ciudad,
      postalCode: dto.codigoPostal,
      phone: dto.telefono,
      primaryAddress: !!dto.principal,
    });
    return aDireccionDto(d);
  }

  @Delete('direcciones/:id')
  @HttpCode(204)
  async eliminarDireccion(@UsuarioActual() u: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    await this.perfil.eliminarDireccion(u.userId, id);
  }
}
