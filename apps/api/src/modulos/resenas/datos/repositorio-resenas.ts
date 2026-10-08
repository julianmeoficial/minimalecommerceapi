import { Injectable } from '@nestjs/common';
import { Review } from '@prisma/client';
import { PrismaService } from '../../../compartido/prisma/prisma.service';

export abstract class RepositorioResenas {
  abstract deProducto(productId: string, skip: number, take: number): Promise<[Review[], number]>;
  abstract crear(datos: { authorId: string; productId: string; sellerId: string; rating: number; comment?: string; verified: boolean }): Promise<Review>;
  abstract porId(id: string): Promise<Review | null>;
  abstract eliminar(id: string): Promise<void>;
  abstract existe(authorId: string, productId: string): Promise<boolean>;
}

@Injectable()
export class RepositorioResenasPrisma extends RepositorioResenas {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  deProducto(productId: string, skip: number, take: number) {
    const where = { productId };
    return Promise.all([
      this.prisma.review.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.review.count({ where }),
    ]);
  }

  crear(datos: { authorId: string; productId: string; sellerId: string; rating: number; comment?: string; verified: boolean }) {
    return this.prisma.review.create({ data: datos });
  }

  porId(id: string) {
    return this.prisma.review.findUnique({ where: { id } });
  }

  async eliminar(id: string) {
    await this.prisma.review.delete({ where: { id } });
  }

  existe(authorId: string, productId: string) {
    return this.prisma.review
      .findUnique({ where: { authorId_productId: { authorId, productId } } })
      .then((r) => !!r);
  }
}
