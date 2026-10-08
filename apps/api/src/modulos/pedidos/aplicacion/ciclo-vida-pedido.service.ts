import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, NoEncontrado } from '../../../compartido/errores/error-api';
import { BusEventos } from '../../../compartido/eventos/bus-eventos';
import {
  EstadoPedidoCambiado,
  EVENTOS,
  PedidoCancelado,
  PedidoPagado,
} from '../../../compartido/eventos/eventos-pedido';
import { UnidadDeTrabajo } from '../../../compartido/prisma/persistencia';
import { CuponesService } from '../../complementarios/aplicacion/cupones.service';
import { InventarioService } from '../../inventario/aplicacion/inventario.service';
import { PedidoCompleto, RepositorioPedidos } from '../datos/repositorio-pedidos';
import { Actor, exigirTransicion, puedeTransicionar } from '../dominio/maquina-estados';
import { eventoBase } from './eventos';
import { PoliticaPropiedadPedido } from './politica-propiedad-pedido';

/**
 * Único punto que cambia el estado de un pedido. Cada transición valida la máquina de
 * estados, se aplica con bloqueo optimista y publica su evento después del commit.
 */
@Injectable()
export class CicloVidaPedidoService {
  private readonly logger = new Logger(CicloVidaPedidoService.name);

  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly inventario: InventarioService,
    private readonly cupones: CuponesService,
    private readonly uow: UnidadDeTrabajo,
    private readonly bus: BusEventos,
  ) {}

  /** CU-09: el vendedor (o superadmin) avanza el pedido: EN_PREPARACION, ENVIADO, ENTREGADO. */
  async cambiarEstado(usuario: UsuarioAutenticado, id: string, hacia: OrderStatus): Promise<PedidoCompleto> {
    const pedido = await this.exigirPedido(id);
    const actor = PoliticaPropiedadPedido.exigir(usuario, pedido);
    if (hacia === OrderStatus.CANCELADO) return this.cancelar(pedido, actor, 'Cancelado por el usuario');
    if (hacia === OrderStatus.REEMBOLSADO) {
      throw new Conflicto(CodigoError.INVALID_TRANSITION, 'Los reembolsos se gestionan desde Pagos');
    }
    exigirTransicion(pedido.status, hacia, actor);
    return this.aplicar(pedido, hacia);
  }

  async cancelarPorComprador(usuario: UsuarioAutenticado, id: string): Promise<PedidoCompleto> {
    const pedido = await this.exigirPedido(id);
    const actor = PoliticaPropiedadPedido.exigir(usuario, pedido);
    return this.cancelar(pedido, actor, 'Cancelado por el comprador');
  }

  /** "Se solicita el cobro": CREADO pasa a PENDIENTE_PAGO. Idempotente si ya estaba pendiente. */
  async marcarPendientePago(id: string): Promise<PedidoCompleto> {
    const pedido = await this.exigirPedido(id);
    if (pedido.status === OrderStatus.PENDIENTE_PAGO) return pedido;
    exigirTransicion(pedido.status, OrderStatus.PENDIENTE_PAGO, 'SISTEMA');
    return this.aplicar(pedido, OrderStatus.PENDIENTE_PAGO);
  }

  /**
   * Pago aprobado: PAGADO y reserva confirmada en la misma transacción.
   * Devuelve false si el pedido ya no admite el pago (por ejemplo, cancelado por vencimiento),
   * para que Pagos decida el reembolso.
   */
  async registrarPagoAprobado(id: string, referencia: string): Promise<boolean> {
    const pedido = await this.exigirPedido(id);
    if (pedido.status === OrderStatus.PAGADO) return true;
    if (!puedeTransicionar(pedido.status, OrderStatus.PAGADO, 'SISTEMA')) return false;

    const pagado = await this.uow.ejecutar(async () => {
      const actualizado = await this.pedidos.transicionar(id, pedido.status, OrderStatus.PAGADO, { paymentRef: referencia });
      if (actualizado) await this.inventario.confirmarReserva(id);
      return actualizado;
    });
    if (!pagado) return this.registrarPagoAprobado(id, referencia);

    this.bus.publicar<PedidoPagado>(EVENTOS.PEDIDO_PAGADO, {
      ...eventoBase(pagado),
      total: Number(pagado.total),
      lines: pagado.items.map((i) => ({
        productId: i.productId,
        sellerId: i.sellerId,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
      })),
    });
    return true;
  }

  async registrarPagoFallido(id: string, motivo: string): Promise<void> {
    const pedido = await this.exigirPedido(id);
    if (pedido.status === OrderStatus.CANCELADO) return;
    if (!puedeTransicionar(pedido.status, OrderStatus.CANCELADO, 'SISTEMA')) return;
    await this.cancelar(pedido, 'SISTEMA', motivo);
  }

  /** Liberador de reservas (RI-10): cancela pedidos impagos cuya reserva venció. */
  async cancelarPorVencimiento(id: string): Promise<boolean> {
    const pedido = await this.pedidos.porId(id);
    if (!pedido) return false;
    if (!puedeTransicionar(pedido.status, OrderStatus.CANCELADO, 'SISTEMA')) {
      // Pedido ya pagado o cerrado: solo queda liberar lo que siga activo.
      await this.inventario.liberarReserva(id);
      return false;
    }
    await this.cancelar(pedido, 'SISTEMA', 'Reserva de existencias vencida');
    return true;
  }

  /** Reembolso aceptado por el superadmin; Pagos ya devolvió el dinero en el proveedor. */
  async registrarReembolso(id: string): Promise<PedidoCompleto> {
    const pedido = await this.exigirPedido(id);
    exigirTransicion(pedido.status, OrderStatus.REEMBOLSADO, 'SISTEMA');
    const { actualizado, devueltos } = await this.uow.ejecutar(async () => ({
      actualizado: await this.transicionarOFallar(pedido, OrderStatus.REEMBOLSADO),
      devueltos: await this.inventario.reponerVendido(id),
    }));
    this.inventario.notificarCambio(devueltos);
    this.publicarCambio(pedido.status, actualizado);
    return actualizado;
  }

  async exigirPedido(id: string): Promise<PedidoCompleto> {
    const pedido = await this.pedidos.porId(id);
    if (!pedido) throw new NoEncontrado('pedido', id);
    return pedido;
  }

  private async cancelar(pedido: PedidoCompleto, actor: Actor, motivo: string): Promise<PedidoCompleto> {
    exigirTransicion(pedido.status, OrderStatus.CANCELADO, actor);
    const { cancelado, devueltos } = await this.uow.ejecutar(async () => {
      const c = await this.transicionarOFallar(pedido, OrderStatus.CANCELADO, { cancelReason: motivo });
      const d = await this.inventario.liberarReserva(pedido.id);
      if (pedido.couponId) await this.cupones.devolverUso(pedido.couponId);
      return { cancelado: c, devueltos: d };
    });
    this.inventario.notificarCambio(devueltos);
    this.bus.publicar<PedidoCancelado>(EVENTOS.PEDIDO_CANCELADO, { ...eventoBase(cancelado), motivo });
    this.logger.log({ orderId: pedido.id, motivo }, 'Pedido cancelado');
    return cancelado;
  }

  private async aplicar(pedido: PedidoCompleto, hacia: OrderStatus): Promise<PedidoCompleto> {
    const actualizado = await this.transicionarOFallar(pedido, hacia);
    this.publicarCambio(pedido.status, actualizado);
    return actualizado;
  }

  private async transicionarOFallar(
    pedido: PedidoCompleto,
    hacia: OrderStatus,
    extra?: { cancelReason?: string },
  ): Promise<PedidoCompleto> {
    const r = await this.pedidos.transicionar(pedido.id, pedido.status, hacia, extra);
    if (!r) {
      throw new Conflicto(CodigoError.INVALID_TRANSITION, 'El pedido cambió de estado mientras se procesaba; vuelve a intentarlo');
    }
    return r;
  }

  private publicarCambio(desde: OrderStatus, pedido: PedidoCompleto) {
    this.bus.publicar<EstadoPedidoCambiado>(EVENTOS.ESTADO_PEDIDO_CAMBIADO, {
      ...eventoBase(pedido),
      desde,
      hacia: pedido.status,
    });
  }
}
