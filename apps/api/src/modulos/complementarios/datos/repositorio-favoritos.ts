import { Injectable } from '@nestjs/common';
import { Favorite } from '@prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

export abstract class RepositorioFavoritos {
  abstract listar(userId: string): Promise<Favorite[]>;
  abstract agregar(userId: string, productId: string): Promise<Favorite>;
  abstract quitar(userId: string, productId: string): Promise<boolean>;
}

@Injectable()
export class RepositorioFavoritosPrisma extends RepositorioFavoritos {
  constructor(private readonly host: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.host.tx;
  }

  listar(userId: string) {
    return this.db.favorite.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  agregar(userId: string, productId: string) {
    return this.db.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
  }

  async quitar(userId: string, productId: string) {
    const r = await this.db.favorite.deleteMany({ where: { userId, productId } });
    return r.count > 0;
  }
}
