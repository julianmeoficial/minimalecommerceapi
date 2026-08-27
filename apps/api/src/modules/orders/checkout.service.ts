import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CouponsService } from '../complements/coupons.service';
import { CheckoutDto } from '../cart/dto/cart.dto';
import { ApiException, NotFoundError } from '../../shared/errors/api-error';
import { OrderPlacedEvent } from '../../shared/events/order-placed.event';
import { OrdersService } from './orders.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly coupons: CouponsService,
    private readonly orders: OrdersService,
    private readonly events: EventEmitter2,
  ) {}

  async checkout(buyerId: string, dto: CheckoutDto, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { buyerId_idempotencyKey: { buyerId, idempotencyKey } },
        include: { items: true },
      });
      if (existing) return this.orders.mapOrder(existing);
    }

    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId: buyerId },
      include: { product: { include: { seller: true } } },
      orderBy: { addedAt: 'asc' },
    });
    if (!cartItems.length) throw new ApiException('EMPTY_CART', 'El carrito está vacío');

    const shipping = await this.resolveShipping(buyerId, dto);

    const order = await this.prisma.$transaction(async (tx) => {
      const drafts = cartItems.map((i) => ({
        productId: i.productId,
        sellerId: i.product.sellerId,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }));

      let subtotal = 0;
      for (const d of drafts) {
        await this.inventory.requireActive(d.productId, tx);
        await this.inventory.decrementIfAvailable(d.productId, d.quantity, tx);
        subtotal += Number(d.unitPrice) * d.quantity;
      }

      let discount = 0;
      let couponId: string | undefined;
      let couponCode: string | undefined;
      if (dto.couponCode) {
        const redeemed = await this.coupons.redeem(dto.couponCode, subtotal, tx);
        discount = redeemed.discount;
        couponId = redeemed.id;
        couponCode = redeemed.code;
      }

      let total = subtotal - discount;
      if (total < 0) total = 0;

      const created = await tx.order.create({
        data: {
          buyerId,
          subtotal,
          discount,
          total,
          status: OrderStatus.PENDIENTE_PAGO,
          shippingAddress: shipping,
          couponId,
          couponCode,
          idempotencyKey: idempotencyKey || undefined,
          items: {
            create: drafts.map((d) => ({
              productId: d.productId,
              sellerId: d.sellerId,
              productName: d.productName,
              quantity: d.quantity,
              unitPrice: d.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { userId: buyerId } });
      return created;
    });

    this.events.emit(
      'order.placed',
      new OrderPlacedEvent(
        order.id,
        buyerId,
        String(order.total),
        order.couponCode,
        order.items.map((i) => ({
          productId: i.productId,
          sellerId: i.sellerId,
          quantity: i.quantity,
          unitPrice: String(i.unitPrice),
        })),
      ),
    );

    return this.orders.mapOrder(order);
  }

  private async resolveShipping(buyerId: string, dto: CheckoutDto) {
    if (dto.addressId) {
      const address = await this.prisma.address.findFirst({
        where: { id: dto.addressId, userId: buyerId, active: true },
      });
      if (!address) throw new NotFoundError('dirección', dto.addressId);
      return [address.fullAddress, address.city, address.postalCode].filter(Boolean).join(', ');
    }
    if (dto.shippingAddress?.trim()) return dto.shippingAddress.trim();
    throw new ApiException('ADDRESS_REQUIRED', 'Indica una dirección de entrega');
  }
}
