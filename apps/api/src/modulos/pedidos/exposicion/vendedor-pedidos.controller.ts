import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { RespuestaErrorDto } from '../../../compartido/errores/respuesta-error.dto';
import { construirPagina } from '../../../compartido/paginacion/paginacion';
import { CicloVidaPedidoService } from '../aplicacion/ciclo-vida-pedido.service';
import { CompraPedidoService } from '../aplicacion/compra-pedido.service';
import { CambiarEstadoDto, ConsultaPedidosVendedorDto, PaginaPedidosDto, PedidoDto } from './dto/pedidos.dto';
import { aPedidoDto } from './mapeo';

/** CU-09 Gestionar inventario y pedidos del vendedor. */
@ApiTags('vendedor / pedidos')
@ApiBearerAuth()
@ApiForbiddenResponse({ type: RespuestaErrorDto, description: 'El pedido no contiene productos del vendedor' })
@Roles(UserRole.VENDEDOR)
@Controller({ path: 'vendedor/pedidos', version: '1' })
export class VendedorPedidosController {
  constructor(
    private readonly compra: CompraPedidoService,
    private readonly ciclo: CicloVidaPedidoService,
  ) {}

  @Get()
  @ApiOkResponse({ type: PaginaPedidosDto })
  async listar(@UsuarioActual() u: UsuarioAutenticado, @Query() q: ConsultaPedidosVendedorDto): Promise<PaginaPedidosDto> {
    const [pedidos, total] = await this.compra.pedidosDeVendedor(u.userId, q.estado, q.pagina, q.tamano);
    const contenido = pedidos.map((p) => aPedidoDto(p, 'VENDEDOR', this.compra.vencimiento(p.placedAt), u.userId));
    return construirPagina(contenido, total, q.pagina, q.tamano);
  }

  @Patch(':id/estado')
  @ApiOkResponse({ type: PedidoDto })
  @ApiConflictResponse({ type: RespuestaErrorDto, description: 'INVALID_TRANSITION' })
  async cambiarEstado(
    @UsuarioActual() u: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoDto,
  ): Promise<PedidoDto> {
    const p = await this.ciclo.cambiarEstado(u, id, dto.estado);
    return aPedidoDto(p, 'VENDEDOR', this.compra.vencimiento(p.placedAt), u.userId);
  }
}
