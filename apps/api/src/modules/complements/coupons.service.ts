import { Injectable } from '@nestjs/common';
import { CouponType, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ApiException, ConflictError, NotFoundError } from '../../shared/errors/api-error';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  create(creatorId: string, dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        type: dto.type,
        value: dto.value,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        expiresAt: new Date(dto.expiresAt),
        maxUses: dto.maxUses,
        active: dto.active ?? true,
        creatorId,
      },
    });
  }

  /**
   * Valida y aplica el cupón dentro de una transacción de checkout.
   * Incrementa currentUses de forma atómica.
   */
  async redeem(
    code: string,
    subtotal: number,
    tx: Prisma.TransactionClient,
  ): Promise<{ id: string; code: string; discount: number }> {
    const normalized = code.trim().toUpperCase();
    const coupon = await tx.coupon.findUnique({ where: { code: normalized } });
    if (!coupon || !coupon.active) {
      throw new NotFoundError('cupón', normalized);
    }

    const now = new Date();
    if (coupon.startsAt > now || coupon.expiresAt < now) {
      throw new ConflictError('COUPON_EXPIRED', 'El cupón no está vigente');
    }
    if (coupon.currentUses >= coupon.maxUses) {
      throw new ConflictError('COUPON_EXHAUSTED', 'El cupón agotó sus usos');
    }

    let discount = 0;
    if (coupon.type === CouponType.PORCENTAJE) {
      discount = Number(((subtotal * Number(coupon.value)) / 100).toFixed(2));
    } else {
      discount = Math.min(subtotal, Number(coupon.value));
    }
    if (discount < 0) discount = 0;

    const updated = await tx.coupon.updateMany({
      where: {
        id: coupon.id,
        currentUses: { lt: coupon.maxUses },
        active: true,
      },
      data: { currentUses: { increment: 1 } },
    });
    if (updated.count === 0) {
      throw new ConflictError('COUPON_EXHAUSTED', 'El cupón agotó sus usos');
    }

    return { id: coupon.id, code: coupon.code, discount };
  }

  async getByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!coupon) throw new ApiException('NOT_FOUND', 'Cupón no encontrado', 404);
    return coupon;
  }
}
