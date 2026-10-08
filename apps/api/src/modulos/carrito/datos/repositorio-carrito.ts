import { Injectable } from '@nestjs/common';
import { CartItem } from '@prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

export abstract class RepositorioCarrito {
  abstract itemsDe(userId: string): Promise<CartItem[]>;
  abstract item(userId: string, productId: string): Promise<CartItem | null>;
  abstract guardar(userId: string, productId: string, cantidad: number, precio: number): Promise<void>;
  abstract eliminar(userId: string, productId: string): Promise<boolean>;
  abstract vaciar(userId: string): Promise<void>;
}

@Injectable()
export class RepositorioCarritoPrisma extends RepositorioCarrito {
  constructor(private readonly host: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.host.tx;
  }

  itemsDe(userId: string) {
    return this.db.cartItem.findMany({ where: { userId }, orderBy: { addedAt: 'asc' } });
  }

  item(userId: string, productId: string) {
    return this.db.cartItem.findUnique({ where: { userId_productId: { userId, productId } } });
  }

  async guardar(userId: string, productId: string, cantidad: number, precio: number) {
    await this.db.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, quantity: cantidad, unitPrice: precio },
      update: { quantity: cantidad, unitPrice: precio },
    });
  }

  async eliminar(userId: string, productId: string) {
    return (await this.db.cartItem.deleteMany({ where: { userId, productId } })).count > 0;
  }

  async vaciar(userId: string) {
    await this.db.cartItem.deleteMany({ where: { userId } });
  }
}
