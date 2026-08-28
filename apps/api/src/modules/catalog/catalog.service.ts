import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CategoryDto, ProductDto } from './dto/catalog.dto';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/api-error';
import { AuthUser } from '../../shared/auth/current-user.decorator';
import { MEDIA_STORE } from '../../shared/media/media-store';
import type { MediaStore } from '../../shared/media/media-store';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @Inject(MEDIA_STORE) private readonly media: MediaStore,
  ) {}

  private mapProduct(p: any) {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      stock: p.stock,
      imageUrl: p.imageUrl,
      categoryId: p.categoryId,
      categoryName: p.category?.name,
      sellerId: p.sellerId,
      sellerName: p.seller?.name,
      preorder: p.preorder,
      active: p.active,
    };
  }

  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async createCategory(dto: CategoryDto) {
    const exists = await this.prisma.category.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictError('CATEGORY_EXISTS', 'Ya existe una categoría con ese nombre');
    return this.prisma.category.create({ data: dto });
  }

  async search(params: {
    name?: string; categoryId?: string; sellerId?: string;
    minPrice?: number; maxPrice?: number; preorder?: boolean;
    page?: number; size?: number;
  }) {
    const page = params.page ?? 0;
    const size = params.size ?? 20;
    const where: Prisma.ProductWhereInput = { active: true };
    if (params.name) where.name = { contains: params.name, mode: 'insensitive' };
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.sellerId) where.sellerId = params.sellerId;
    if (params.preorder) where.preorder = true;
    if (params.minPrice != null || params.maxPrice != null) {
      where.price = {};
      if (params.minPrice != null) where.price.gte = params.minPrice;
      if (params.maxPrice != null) where.price.lte = params.maxPrice;
    }
    const cacheKey = `catalog:${JSON.stringify({ where, page, size })}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const [totalElements, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: { category: true, seller: true },
        skip: page * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const result = {
      content: rows.map((p) => this.mapProduct(p)),
      page,
      size,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
    };
    await this.cache.set(cacheKey, result, 30_000);
    return result;
  }

  async get(id: string) {
    const p = await this.prisma.product.findFirst({
      where: { id, active: true },
      include: { category: true, seller: true },
    });
    if (!p) throw new NotFoundError('producto', id);
    return this.mapProduct(p);
  }

  private requireSeller(user: AuthUser) {
    if (user.role !== 'VENDEDOR' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenError('Solo un vendedor puede gestionar el catálogo');
    }
  }

  async create(user: AuthUser, dto: ProductDto) {
    this.requireSeller(user);
    await this.prisma.category.findUniqueOrThrow({ where: { id: dto.categoryId } }).catch(() => {
      throw new NotFoundError('categoría', dto.categoryId);
    });
    const p = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        categoryId: dto.categoryId,
        sellerId: user.userId,
        preorder: !!dto.preorder,
      },
      include: { category: true, seller: true },
    });
    await this.invalidateCatalogCache();
    return this.mapProduct(p);
  }

  async update(user: AuthUser, id: string, dto: ProductDto) {
    this.requireSeller(user);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('producto', id);
    if (existing.sellerId !== user.userId && user.role !== 'SUPERADMIN') {
      throw new ForbiddenError('Solo el vendedor dueño puede modificar este producto');
    }
    const p = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        categoryId: dto.categoryId,
        preorder: !!dto.preorder,
      },
      include: { category: true, seller: true },
    });
    await this.invalidateCatalogCache();
    return this.mapProduct(p);
  }

  async attachImage(user: AuthUser, id: string, file: Express.Multer.File) {
    this.requireSeller(user);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('producto', id);
    if (existing.sellerId !== user.userId && user.role !== 'SUPERADMIN') {
      throw new ForbiddenError();
    }
    if (existing.imageUrl) await this.media.delete(existing.imageUrl);
    const url = await this.media.store(file.buffer, file.originalname, file.mimetype);
    const p = await this.prisma.product.update({
      where: { id },
      data: { imageUrl: url },
      include: { category: true, seller: true },
    });
    await this.invalidateCatalogCache();
    return this.mapProduct(p);
  }

  async deactivate(user: AuthUser, id: string) {
    this.requireSeller(user);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('producto', id);
    if (existing.sellerId !== user.userId && user.role !== 'SUPERADMIN') {
      throw new ForbiddenError();
    }
    await this.prisma.product.update({ where: { id }, data: { active: false } });
    await this.invalidateCatalogCache();
  }

  private async invalidateCatalogCache() {
    const maybeClear = (this.cache as Cache & { clear?: () => Promise<void> }).clear;
    if (typeof maybeClear === 'function') {
      await maybeClear.call(this.cache);
    }
  }
}
