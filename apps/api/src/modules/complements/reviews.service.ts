import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConflictError, NotFoundError } from '../../shared/errors/api-error';
import { CreateReviewDto } from './dto/create-review.dto';
import { FeatureFlagsService } from './feature-flags.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FeatureFlagsService,
  ) {}

  async create(authorId: string, dto: CreateReviewDto) {
    await this.flags.requireEnabled('reviews');
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, active: true },
    });
    if (!product) throw new NotFoundError('producto', dto.productId);

    try {
      return await this.prisma.review.create({
        data: {
          productId: dto.productId,
          authorId,
          sellerId: product.sellerId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
    } catch {
      throw new ConflictError('REVIEW_EXISTS', 'Ya existe una reseña para este producto');
    }
  }

  listByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
