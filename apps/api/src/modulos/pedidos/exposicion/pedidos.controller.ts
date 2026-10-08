import { Body, Controller, Get, Headers, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { ErrorApi } from '../../../compartido/errores/error-api';
import { RespuestaErrorDto } from '../../../compartido/errores/respuesta-error.dto';
import { ConsultaPaginadaDto, construirPagina } from '../../../compartido/paginacion/paginacion';
import { CicloVidaPedidoService } from '../aplicacion/ciclo-vida-pedido.service';
import { CompraPedidoService } from '../aplicacion/compra-pedido.service';
import { PoliticaPropiedadPedido } from '../aplicacion/politica-propiedad-pedido';
import { PedidoCompleto } from '../datos/repositorio-pedidos';
import { CrearPedidoDto, PaginaPedidosDto, PedidoDto } from './dto/pedidos.dto';
import { aPedidoDto } from './mapeo';

const PATRON_IDEMPOTENCIA = /^[A-Za-z0-9_-]{8,100}$/;

/** CU-03 Realizar checkout y CU-05 Consultar historial de pedidos. */
@ApiTags('pedidos')
@ApiBearerAuth()
@ApiForbiddenResponse({ type: RespuestaErrorDto, description: 'El pedido pertenece a otro usuario' })
@Controller({ path: 'pedidos', version: '1' })
export class PedidosController {
  constructor(
    private readonly compra: CompraPedidoService,
    private readonly ciclo: CicloVidaPedidoService,
  ) {}

  @Post()
  @Roles(UserRole.COMPRADOR)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Clave única por intento de compra (8 a 100 caracteres). Repetirla devuelve el mismo pedido.',
  })
  @ApiCreatedResponse({ type: PedidoDto })
  @ApiBadRequestResponse({ type: RespuestaErrorDto, description: 'EMPTY_CART, ADDRESS_REQUIRED, IDEMPOTENCY_KEY_REQUIRED' })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'STOCK_INSUFFICIENT, PRODUCT_UNAVAILABLE, COUPON_EXPIRED, COUPON_EXHAUSTED, MODULE_DISABLED',
  })
  async crear(
    @UsuarioActual() u: UsuarioAutenticado,
    @Headers('idempotency-key') clave: string | undefined,
    @Body() dto: CrearPedidoDto,
  ): Promise<PedidoDto> {
    if (!clave || !PATRON_IDEMPOTENCIA.test(clave)) {
      throw new ErrorApi(
        CodigoError.IDEMPOTENCY_KEY_REQUIRED,
        'La cabecera Idempotency-Key es obligatoria (8 a 100 caracteres alfanuméricos, guion o guion bajo)',
      );
    }
    const pedido = await this.compra.creaPedido(u.userId, dto, clave);
    return this.aDto(u, pedido);
  }

  @Get()
  @Roles(UserRole.COMPRADOR)
  @ApiOkResponse({ type: PaginaPedidosDto })
  async historial(@UsuarioActual() u: UsuarioAutenticado, @Query() q: ConsultaPaginadaDto): Promise<PaginaPedidosDto> {
    const [pedidos, total] = await this.compra.consultaHistorial(u.userId, q.pagina, q.tamano);
    return construirPagina(pedidos.map((p) => this.aDto(u, p)), total, q.pagina, q.tamano);
  }

  @Get(':id')
  @ApiOkResponse({ type: PedidoDto })
  async detalle(@UsuarioActual() u: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string): Promise<PedidoDto> {
    return this.aDto(u, await this.compra.consultaPedido(u, id));
  }

  @Post(':id/cancelar')
  @HttpCode(200)
  @Roles(UserRole.COMPRADOR, UserRole.SUPERADMIN)
  @ApiOkResponse({ type: PedidoDto })
  @ApiConflictResponse({ type: RespuestaErrorDto, description: 'INVALID_TRANSITION: el pedido ya fue pagado o cerrado' })
  async cancelar(@UsuarioActual() u: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string): Promise<PedidoDto> {
    return this.aDto(u, await this.ciclo.cancelarPorComprador(u, id));
  }

  @Post(':id/recibido')
  @HttpCode(200)
  @Roles(UserRole.COMPRADOR)
  @ApiOkResponse({ type: PedidoDto, description: 'El comprador confirma la entrega (ENVIADO a ENTREGADO)' })
  async recibido(@UsuarioActual() u: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string): Promise<PedidoDto> {
    return this.aDto(u, await this.ciclo.cambiarEstado(u, id, 'ENTREGADO'));
  }

  private aDto(u: UsuarioAutenticado, p: PedidoCompleto): PedidoDto {
    const actor = PoliticaPropiedadPedido.exigir(u, p);
    return aPedidoDto(p, actor, this.compra.vencimiento(p.placedAt), actor === 'VENDEDOR' ? u.userId : undefined);
  }
}
