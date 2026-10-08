import { Injectable } from '@nestjs/common';
import { Order, OrderItem, OrderStatus, Prisma } from '@prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

export type PedidoCompleto = Order & { items: OrderItem[] };

export interface NuevoPedido {
  id: string;
  buyerId: string;
  placedAt: Date;
  subtotal: number;
  discount: number;
  total: number;
  shippingAddress: string;
  couponId?: string;
  couponCode?: string;
  idempotencyKey: string;
  items: { productId: string; sellerId: string; productName: string; quantity: number; unitPrice: number }[];
}

export abstract class RepositorioPedidos {
  abstract crear(p: NuevoPedido): Promise<PedidoCompleto>;
  abstract porId(id: string): Promise<PedidoCompleto | null>;
  abstract porIdempotencia(buyerId: string, key: string): Promise<PedidoCompleto | null>;
  /** Bloqueo optimista: solo actualiza si el estado sigue siendo `desde`. */
  abstract transicionar(
    id: string,
    desde: OrderStatus,
    hacia: OrderStatus,
    extra?: { paymentRef?: string; cancelReason?: string },
  ): Promise<PedidoCompleto | null>;
  abstract deComprador(buyerId: string, skip: number, take: number): Promise<[PedidoCompleto[], number]>;
  abstract deVendedor(sellerId: string, estado: OrderStatus | undefined, skip: number, take: number): Promise<[PedidoCompleto[], number]>;
  abstract compradoYEntregado(buyerId: string, productId: string): Promise<boolean>;
}

@Injectable()
export class RepositorioPedidosPrisma extends RepositorioPedidos {
  constructor(private readonly host: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.host.tx;
  }

  crear(p: NuevoPedido) {
    const { items, ...pedido } = p;
    return this.db.order.create({
      data: { ...pedido, status: OrderStatus.CREADO, items: { create: items } },
      include: { items: true },
    });
  }

  porId(id: string) {
    return this.db.order.findUnique({ where: { id }, include: { items: true } });
  }

  porIdempotencia(buyerId: string, key: string) {
    return this.db.order.findUnique({
      where: { buyerId_idempotencyKey: { buyerId, idempotencyKey: key } },
      include: { items: true },
    });
  }

  async transicionar(id: string, desde: OrderStatus, hacia: OrderStatus, extra: { paymentRef?: string; cancelReason?: string } = {}) {
    const r = await this.db.order.updateMany({ where: { id, status: desde }, data: { status: hacia, ...extra } });
    return r.count === 1 ? this.porId(id) : null;
  }

  deComprador(buyerId: string, skip: number, take: number): Promise<[PedidoCompleto[], number]> {
    return Promise.all([
      this.db.order.findMany({ where: { buyerId }, include: { items: true }, orderBy: { placedAt: 'desc' }, skip, take }),
      this.db.order.count({ where: { buyerId } }),
    ]);
  }

  deVendedor(sellerId: string, estado: OrderStatus | undefined, skip: number, take: number): Promise<[PedidoCompleto[], number]> {
    const where: Prisma.OrderWhereInput = { items: { some: { sellerId } }, status: estado };
    return Promise.all([
      this.db.order.findMany({ where, include: { items: true }, orderBy: { placedAt: 'desc' }, skip, take }),
      this.db.order.count({ where }),
    ]);
  }

  async compradoYEntregado(buyerId: string, productId: string) {
    const n = await this.db.order.count({
      where: { buyerId, status: OrderStatus.ENTREGADO, items: { some: { productId } } },
    });
    return n > 0;
  }
}
