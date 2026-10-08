import { Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { RequiereModulo } from '../../registro-modulos/exposicion/requiere-modulo';
import { FavoritosService } from '../aplicacion/favoritos.service';

@ApiTags('favoritos')
@ApiBearerAuth()
@RequiereModulo('favoritos')
@Roles(UserRole.COMPRADOR)
@Controller({ path: 'favoritos', version: '1' })
export class FavoritosController {
  constructor(private readonly favoritos: FavoritosService) {}

  @Get()
  listar(@UsuarioActual() u: UsuarioAutenticado) {
    return this.favoritos.listar(u.userId);
  }

  @Post(':productoId')
  agregar(@UsuarioActual() u: UsuarioAutenticado, @Param('productoId', ParseUUIDPipe) productoId: string) {
    return this.favoritos.agregar(u.userId, productoId);
  }

  @Delete(':productoId')
  async quitar(@UsuarioActual() u: UsuarioAutenticado, @Param('productoId', ParseUUIDPipe) productoId: string) {
    await this.favoritos.quitar(u.userId, productoId);
    return { eliminado: true };
  }
}
