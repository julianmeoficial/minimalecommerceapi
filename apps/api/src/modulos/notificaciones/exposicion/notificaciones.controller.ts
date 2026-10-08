import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { ConsultaPaginadaDto, construirPagina } from '../../../compartido/paginacion/paginacion';
import { RequiereModulo } from '../../registro-modulos/exposicion/requiere-modulo';
import { NotificacionesService } from '../aplicacion/notificaciones.service';

@ApiTags('notificaciones')
@ApiBearerAuth()
@RequiereModulo('notificaciones')
@Controller({ path: 'notificaciones', version: '1' })
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get()
  async listar(@UsuarioActual() u: UsuarioAutenticado, @Query() q: ConsultaPaginadaDto) {
    const [rows, total] = await this.notificaciones.listar(u.userId, q.pagina, q.tamano);
    return construirPagina(rows, total, q.pagina, q.tamano);
  }

  @Patch(':id/leida')
  async leida(@UsuarioActual() u: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    await this.notificaciones.marcarLeida(u.userId, id);
    return { leida: true };
  }
}
