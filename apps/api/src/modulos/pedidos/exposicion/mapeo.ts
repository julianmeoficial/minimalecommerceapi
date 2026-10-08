import { OrderStatus } from '@prisma/client';
import { PedidoCompleto } from '../datos/repositorio-pedidos';
import { Actor, ESTADOS_POR_PAGAR, siguientesEstados } from '../dominio/maquina-estados';
import { PedidoDto } from './dto/pedidos.dto';

/**
 * `soloVendedor` limita los ítems a los del vendedor que consulta: en un pedido con
 * varios vendedores, ninguno ve lo que compraron a los demás.
 */
export function aPedidoDto(p: PedidoCompleto, actor: Actor, pagarAntesDe: Date | null, soloVendedor?: string): PedidoDto {
  const items = soloVendedor ? p.items.filter((i) => i.sellerId === soloVendedor) : p.items;
  return {
    id: p.id,
    estado: p.status,
    subtotal: Number(p.subtotal),
    descuento: Number(p.discount),
    total: Number(p.total),
    direccionEnvio: p.shippingAddress,
    cupon: p.couponCode,
    referenciaPago: p.paymentRef,
    motivoCancelacion: p.cancelReason,
    pagarAntesDe: ESTADOS_POR_PAGAR.includes(p.status) && pagarAntesDe ? pagarAntesDe.toISOString() : null,
    accionesDisponibles: siguientesEstados(p.status, actor).filter((e) => e !== OrderStatus.REEMBOLSADO),
    creadoEn: p.placedAt.toISOString(),
    actualizadoEn: p.updatedAt.toISOString(),
    items: items.map((i) => ({
      productoId: i.productId,
      vendedorId: i.sellerId,
      nombre: i.productName,
      cantidad: i.quantity,
      precioUnitario: Number(i.unitPrice),
      subtotal: Math.round(Number(i.unitPrice) * i.quantity * 100) / 100,
    })),
  };
}
