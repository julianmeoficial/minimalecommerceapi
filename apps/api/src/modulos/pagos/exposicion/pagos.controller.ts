import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { CobrosService } from '../aplicacion/cobros.service';

@ApiTags('pagos')
@ApiBearerAuth()
@Controller({ path: 'pagos', version: '1' })
export class PagosController {
  constructor(private readonly cobros: CobrosService) {}

  @Post('pedidos/:id/intento')
  @Roles(UserRole.COMPRADOR, UserRole.SUPERADMIN)
  @ApiOkResponse({ description: 'Intento de pago creado (sin confirmación del cliente)' })
  iniciar(@UsuarioActual() u: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.cobros.iniciarCobro(u, id);
  }

  @Get('pedidos/:id')
  @ApiOkResponse({ description: 'Estado del pago del pedido' })
  estado(@UsuarioActual() u: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.cobros.consultaPago(u, id);
  }
}
