import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotFoundError } from '../../shared/errors/api-error';
import { FeatureFlagsService } from './feature-flags.service';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FeatureFlagsService,
  ) {}

  async add(userId: string, productId: string) {
    await this.flags.requireEnabled('favorites');
    const product = await this.prisma.product.findFirst({
      where: { id: productId, active: true },
    });
    if (!product) throw new NotFoundError('producto', productId);
    await this.prisma.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
    return { productId };
  }

  async remove(userId: string, productId: string) {
    await this.flags.requireEnabled('favorites');
    await this.prisma.favorite.deleteMany({ where: { userId, productId } });
  }

  async list(userId: string) {
    await this.flags.requireEnabled('favorites');
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
