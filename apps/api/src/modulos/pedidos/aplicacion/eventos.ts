import { PedidoCompleto } from '../datos/repositorio-pedidos';

export function eventoBase(p: PedidoCompleto) {
  return {
    orderId: p.id,
    buyerId: p.buyerId,
    sellerIds: [...new Set(p.items.map((i) => i.sellerId))],
    ocurridoEn: new Date().toISOString(),
  };
}
