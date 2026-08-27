import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { AddCartItemDto } from './dto/cart.dto';
import { ApiException, NotFoundError } from '../../shared/errors/api-error';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async get(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { addedAt: 'asc' },
    });
    const mapped = items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.unitPrice) * i.quantity,
      availableStock: i.product.stock,
    }));
    const subtotal = mapped.reduce((a, b) => a + b.subtotal, 0);
    return { items: mapped, itemCount: mapped.length, subtotal };
  }

  async add(userId: string, dto: AddCartItemDto) {
    const product = await this.inventory.requireActive(dto.productId);
    if (product.stock < dto.quantity) {
      throw new ApiException('STOCK_INSUFFICIENT', 'No hay stock suficiente');
    }
    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
    });
    const nextQty = (existing?.quantity ?? 0) + dto.quantity;
    if (product.stock < nextQty) {
      throw new ApiException('STOCK_INSUFFICIENT', 'No hay stock suficiente');
    }
    await this.prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId: product.id } },
      create: {
        userId,
        productId: product.id,
        quantity: dto.quantity,
        unitPrice: product.price,
      },
      update: {
        quantity: nextQty,
        unitPrice: product.price,
      },
    });
    return this.get(userId);
  }

  async updateQuantity(userId: string, itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
      include: { product: true },
    });
    if (!item) throw new NotFoundError('ítem de carrito', itemId);
    if (item.product.stock < quantity) {
      throw new ApiException('STOCK_INSUFFICIENT', 'No hay stock suficiente');
    }
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return this.get(userId);
  }

  async remove(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, userId } });
    if (!item) throw new NotFoundError('ítem de carrito', itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.get(userId);
  }

  async clear(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
  }
}
