import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, UserRole } from '@prisma/client';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, ErrorApi, NoEncontrado, Prohibido } from '../../../compartido/errores/error-api';
import { UnidadDeTrabajo } from '../../../compartido/prisma/persistencia';
import { CicloVidaPedidoService } from '../../pedidos/aplicacion/ciclo-vida-pedido.service';
import { CompraPedidoService } from '../../pedidos/aplicacion/compra-pedido.service';
import { RepositorioPagos } from '../datos/repositorio-pagos';
import { EventoWebhook, PasarelaPagos, ResultadoIntento } from './pasarela-pagos';

@Injectable()
export class CobrosService {
  private readonly logger = new Logger(CobrosService.name);
  private readonly moneda: string;

  constructor(
    private readonly pasarela: PasarelaPagos,
    private readonly pagos: RepositorioPagos,
    private readonly compra: CompraPedidoService,
    private readonly ciclo: CicloVidaPedidoService,
    private readonly uow: UnidadDeTrabajo,
    config: ConfigService,
  ) {
    this.moneda = config.get<string>('PAYMENT_CURRENCY') ?? 'usd';
  }

  async iniciarCobro(usuario: UsuarioAutenticado, orderId: string) {
    const pedido = await this.compra.consultaPedido(usuario, orderId);
    if (usuario.role !== UserRole.SUPERADMIN && pedido.buyerId !== usuario.userId) {
      throw new Prohibido('Solo el comprador puede pagar el pedido');
    }
    await this.compra.exigirPagable(pedido);

    const intento = await this.pasarela.crearIntento({
      orderId: pedido.id,
      amount: Number(pedido.total),
      currency: this.moneda,
      idempotencyKey: pedido.id,
    });

    const pago = await this.uow.ejecutar(async () => {
      const payment = await this.pagos.upsertPendiente({
        orderId: pedido.id,
        provider: intento.proveedor,
        externalId: intento.externalId,
        amount: Number(pedido.total),
        currency: this.moneda,
      });
      await this.ciclo.marcarPendientePago(pedido.id);
      return payment;
    });

    return {
      pagoId: pago.id,
      pedidoId: pedido.id,
      monto: Number(pago.amount),
      proveedor: pago.provider,
      externalId: pago.externalId,
      clientSecret: intento.clientSecret,
      estado: pago.status,
    };
  }

  async consultaPago(usuario: UsuarioAutenticado, orderId: string) {
    await this.compra.consultaPedido(usuario, orderId);
    const pago = await this.pagos.porOrderId(orderId);
    if (!pago) throw new NoEncontrado('pago', orderId);
    return {
      pagoId: pago.id,
      pedidoId: pago.orderId,
      monto: Number(pago.amount),
      proveedor: pago.provider,
      externalId: pago.externalId,
      estado: pago.status,
    };
  }

  async procesarWebhook(cuerpo: Buffer, firma: string | undefined) {
    const evento = await this.pasarela.verificarWebhook(cuerpo, firma);
    await this.aplicarEventoProveedor('stripe', evento);
    return { recibido: true };
  }

  async aplicarEventoProveedor(proveedor: string, evento: EventoWebhook) {
    await this.uow.ejecutar(async () => {
      const nuevo = await this.pagos.registrarEventoProveedor(proveedor, evento.providerEventId, evento.tipo);
      if (!nuevo) return;
      await this.aplicarResultado(evento.externalId, evento.estado);
    });
  }

  async aplicarResultado(externalId: string, resultado: ResultadoIntento) {
    const pago = await this.pagos.porExternalId(externalId);
    if (!pago?.externalId) return;

    if (resultado === 'SUCCEEDED') {
      const ok = await this.ciclo.registrarPagoAprobado(pago.orderId, externalId);
      if (!ok) {
        this.logger.error({ orderId: pago.orderId, externalId }, 'Pago exitoso en pedido no pagable (posible cancelación previa)');
        return;
      }
      await this.pagos.actualizarEstado(pago.orderId, PaymentStatus.SUCCEEDED, true);
      return;
    }

    if (resultado === 'FAILED' || resultado === 'CANCELED') {
      await this.pagos.actualizarEstado(pago.orderId, resultado === 'CANCELED' ? PaymentStatus.CANCELED : PaymentStatus.FAILED, true);
      await this.ciclo.registrarPagoFallido(pago.orderId, resultado === 'CANCELED' ? 'Pago cancelado' : 'Pago rechazado');
    }
  }

  async conciliarPago(orderId: string) {
    const pago = await this.pagos.porOrderId(orderId);
    if (!pago?.externalId || pago.status !== PaymentStatus.PENDING) return;
    const remoto = await this.pasarela.consultarIntento(pago.externalId);
    await this.aplicarResultado(pago.externalId, remoto.estado);
    if (remoto.estado === 'PENDING') {
      await this.pagos.actualizarEstado(orderId, PaymentStatus.PENDING, true);
    }
  }

  async simularResultado(orderId: string, aprobar: boolean) {
    const pago = await this.pagos.porOrderId(orderId);
    if (!pago?.externalId) throw new ErrorApi(CodigoError.ORDER_NOT_PAYABLE, 'No hay intento de pago', 409);
    await this.aplicarResultado(pago.externalId, aprobar ? 'SUCCEEDED' : 'FAILED');
  }
}
