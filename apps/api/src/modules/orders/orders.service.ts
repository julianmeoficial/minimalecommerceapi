import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { ApiException, ForbiddenError, NotFoundError } from '../../shared/errors/api-error';
import { AuthUser } from '../../shared/auth/current-user.decorator';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  mapOrder(order: any) {
    return {
      id: order.id,
      buyerId: order.buyerId,
      placedAt: order.placedAt,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      total: Number(order.total),
      status: order.status,
      shippingAddress: order.shippingAddress,
      couponCode: order.couponCode,
      paymentRef: order.paymentRef,
      items: (order.items || []).map((i: any) => ({
        productId: i.productId,
        sellerId: i.sellerId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.unitPrice) * i.quantity,
      })),
    };
  }

  async mine(buyerId: string, page = 0, size = 20) {
    const where = { buyerId };
    const [totalElements, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { placedAt: 'desc' },
        skip: page * size,
        take: size,
      }),
    ]);
    return {
      content: rows.map((o) => this.mapOrder(o)),
      page, size, totalElements,
      totalPages: Math.ceil(totalElements / size),
    };
  }

  async sold(sellerId: string, page = 0, size = 20) {
    const rows = await this.prisma.order.findMany({
      where: { items: { some: { sellerId } } },
      include: { items: true },
      orderBy: { placedAt: 'desc' },
      skip: page * size,
      take: size,
    });
    return {
      content: rows.map((o) => this.mapOrder(o)),
      page, size,
      totalElements: rows.length,
      totalPages: 1,
    };
  }

  async get(user: AuthUser, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundError('pedido', id);
    const buyer = order.buyerId === user.userId;
    const seller = order.items.some((i) => i.sellerId === user.userId);
    if (!buyer && !seller && user.role !== 'SUPERADMIN') throw new ForbiddenError();
    return this.mapOrder(order);
  }

  async updateStatus(user: AuthUser, id: string, status: OrderStatus) {
    if (user.role !== 'VENDEDOR' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenError('Solo el vendedor puede cambiar el estado');
    }
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundError('pedido', id);
    if (!order.items.some((i) => i.sellerId === user.userId) && user.role !== 'SUPERADMIN') {
      throw new ForbiddenError('Este pedido no contiene tus productos');
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return this.mapOrder(updated);
  }

  async cancel(user: AuthUser, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, buyerId: user.userId },
      include: { items: true },
    });
    if (!order) throw new NotFoundError('pedido', id);
    if (order.status === OrderStatus.ENTREGADO || order.status === OrderStatus.CANCELADO) {
      throw new ApiException('NOT_CANCELLABLE', 'El pedido ya no se puede cancelar');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await this.inventory.restore(item.productId, item.quantity, tx);
      }
      return tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELADO },
        include: { items: true },
      });
    });
    return this.mapOrder(updated);
  }
}
