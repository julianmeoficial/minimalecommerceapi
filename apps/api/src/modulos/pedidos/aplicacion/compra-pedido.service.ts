import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, ErrorApi, NoEncontrado } from '../../../compartido/errores/error-api';
import { BusEventos } from '../../../compartido/eventos/bus-eventos';
import { EVENTOS, PedidoCreado } from '../../../compartido/eventos/eventos-pedido';
import { UnidadDeTrabajo } from '../../../compartido/prisma/persistencia';
import { CarritoService } from '../../carrito/aplicacion/carrito.service';
import { CuponesService } from '../../complementarios/aplicacion/cupones.service';
import { InventarioService } from '../../inventario/aplicacion/inventario.service';
import { PerfilService } from '../../usuarios/aplicacion/perfil.service';
import { PedidoCompleto, RepositorioPedidos } from '../datos/repositorio-pedidos';
import { calcularTotales } from '../dominio/totales';
import { eventoBase } from './eventos';
import { PoliticaPropiedadPedido } from './politica-propiedad-pedido';

export interface DatosCompra {
  direccionId?: string;
  direccionEnvio?: string;
  cupon?: string;
}

/** ServicioCompraPedido del TCC (CU-03 y CU-05). */
@Injectable()
export class CompraPedidoService {
  private readonly minutosReserva: number;

  constructor(
    private readonly pedidos: RepositorioPedidos,
    private readonly carrito: CarritoService,
    private readonly inventario: InventarioService,
    private readonly cupones: CuponesService,
    private readonly perfil: PerfilService,
    private readonly uow: UnidadDeTrabajo,
    private readonly bus: BusEventos,
    config: ConfigService,
  ) {
    this.minutosReserva = Number(config.get('RESERVA_MINUTOS') ?? 15);
  }

  /**
   * Convierte el carrito en un pedido CREADO con existencias reservadas durante
   * RESERVA_MINUTOS. Todo ocurre en una transacción: si falla el stock o el cupón,
   * no se descuenta nada y el carrito se conserva (EAC-07).
   * La misma Idempotency-Key devuelve el mismo pedido sin repetir efectos.
   */
  async creaPedido(compradorId: string, datos: DatosCompra, idempotencyKey: string): Promise<PedidoCompleto> {
    const repetido = await this.pedidos.porIdempotencia(compradorId, idempotencyKey);
    if (repetido) return repetido;

    const lineas = await this.carrito.lineas(compradorId);
    if (!lineas.length) throw new ErrorApi(CodigoError.EMPTY_CART, 'El carrito está vacío');
    const noDisponibles = lineas.filter((l) => !l.activo).map((l) => l.productoId);
    if (noDisponibles.length) {
      throw new ErrorApi(CodigoError.PRODUCT_UNAVAILABLE, 'Hay productos que ya no están a la venta', 409, noDisponibles);
    }
    const envio = await this.perfil.resolverEnvio(compradorId, datos.direccionId, datos.direccionEnvio);

    let pedido: PedidoCompleto;
    try {
      pedido = await this.uow.ejecutar(async () => {
        const id = randomUUID();
        const ahora = new Date();
        const base = calcularTotales(lineas);
        const cupon = datos.cupon ? await this.cupones.canjear(datos.cupon, base.subtotal) : undefined;
        const totales = calcularTotales(lineas, cupon?.descuento);

        const creado = await this.pedidos.crear({
          id,
          buyerId: compradorId,
          placedAt: ahora,
          subtotal: totales.subtotal,
          discount: totales.descuento,
          total: totales.total,
          shippingAddress: envio,
          couponId: cupon?.id,
          couponCode: cupon?.codigo,
          idempotencyKey,
          items: lineas.map((l) => ({
            productId: l.productoId,
            sellerId: l.vendedorId,
            productName: l.nombre,
            quantity: l.cantidad,
            unitPrice: l.precioUnitario,
          })),
        });
        await this.inventario.reservaExistencias(
          id,
          lineas.map((l) => ({ productId: l.productoId, quantity: l.cantidad })),
          this.vencimiento(ahora),
        );
        await this.carrito.vaciar(compradorId);
        return creado;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const ganador = await this.pedidos.porIdempotencia(compradorId, idempotencyKey);
        if (ganador) return ganador;
      }
      throw e;
    }

    this.inventario.notificarCambio(lineas.map((l) => l.productoId));
    this.bus.publicar<PedidoCreado>(EVENTOS.PEDIDO_CREADO, { ...eventoBase(pedido), total: Number(pedido.total) });
    return pedido;
  }

  async consultaPedido(usuario: UsuarioAutenticado, id: string): Promise<PedidoCompleto> {
    const pedido = await this.pedidos.porId(id);
    if (!pedido) throw new NoEncontrado('pedido', id);
    PoliticaPropiedadPedido.exigir(usuario, pedido);
    return pedido;
  }

  consultaHistorial(compradorId: string, pagina: number, tamano: number) {
    return this.pedidos.deComprador(compradorId, pagina * tamano, tamano);
  }

  pedidosDeVendedor(vendedorId: string, estado: PedidoCompleto['status'] | undefined, pagina: number, tamano: number) {
    return this.pedidos.deVendedor(vendedorId, estado, pagina * tamano, tamano);
  }

  /** Interfaz publicada para Reseñas. */
  compradoYEntregado(compradorId: string, productoId: string): Promise<boolean> {
    return this.pedidos.compradoYEntregado(compradorId, productoId);
  }

  vencimiento(creadoEn: Date): Date {
    return new Date(creadoEn.getTime() + this.minutosReserva * 60_000);
  }

  /** Pedidos que el comprador aún puede pagar (para Pagos). */
  async exigirPagable(pedido: PedidoCompleto): Promise<void> {
    if (pedido.status === 'PAGADO' || pedido.status === 'EN_PREPARACION') {
      throw new Conflicto(CodigoError.ALREADY_PAID, 'El pedido ya está pagado');
    }
    if (pedido.status !== 'CREADO' && pedido.status !== 'PENDIENTE_PAGO') {
      throw new Conflicto(CodigoError.ORDER_NOT_PAYABLE, `Un pedido en estado ${pedido.status} no se puede pagar`);
    }
    if (this.vencimiento(pedido.placedAt) < new Date()) {
      throw new Conflicto(CodigoError.RESERVATION_EXPIRED, 'La reserva de existencias venció; vuelve a crear el pedido');
    }
  }
}
