import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConflictError, NotFoundError } from '../../shared/errors/api-error';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async requireActive(productId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    const product = await db.product.findFirst({ where: { id: productId, active: true } });
    if (!product) throw new NotFoundError('producto', productId);
    return product;
  }

  async decrementIfAvailable(productId: string, quantity: number, tx: Prisma.TransactionClient) {
    const updated = await tx.product.updateMany({
      where: { id: productId, active: true, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (updated.count === 0) {
      throw new ConflictError('STOCK_INSUFFICIENT', `Stock insuficiente para el producto ${productId}`);
    }
  }

  async restore(productId: string, quantity: number, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    await db.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });
  }
}
