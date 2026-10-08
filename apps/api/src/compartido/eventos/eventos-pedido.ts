/**
 * Contratos del bus de eventos internos. Los emite Pedidos y los consumen
 * Notificaciones y Reportes sin dependencia directa entre módulos.
 */
export const EVENTOS = {
  PEDIDO_CREADO: 'pedido.creado',
  PEDIDO_PAGADO: 'pedido.pagado',
  PEDIDO_CANCELADO: 'pedido.cancelado',
  ESTADO_PEDIDO_CAMBIADO: 'pedido.estado-cambiado',
  EXISTENCIAS_CAMBIADAS: 'inventario.existencias-cambiadas',
} as const;

export interface LineaEvento {
  productId: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
}

interface EventoBase {
  orderId: string;
  buyerId: string;
  sellerIds: string[];
  correlationId?: string;
  ocurridoEn: string;
}

export interface PedidoCreado extends EventoBase {
  total: number;
}

export interface PedidoPagado extends EventoBase {
  total: number;
  lines: LineaEvento[];
}

export interface PedidoCancelado extends EventoBase {
  motivo: string;
}

export interface EstadoPedidoCambiado extends EventoBase {
  desde: string;
  hacia: string;
}

export interface ExistenciasCambiadas {
  productIds: string[];
}
