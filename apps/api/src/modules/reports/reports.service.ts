import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OrderPlacedEvent } from '../../shared/events/order-placed.event';
import { ForbiddenError } from '../../shared/errors/api-error';
import { AuthUser } from '../../shared/auth/current-user.decorator';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('order.placed')
  async onOrderPlaced(event: OrderPlacedEvent) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const bySeller = new Map<string, { units: number; sales: number }>();
    for (const line of event.lines) {
      const prev = bySeller.get(line.sellerId) ?? { units: 0, sales: 0 };
      prev.units += line.quantity;
      prev.sales += Number(line.unitPrice) * line.quantity;
      bySeller.set(line.sellerId, prev);
    }

    for (const [sellerId, agg] of bySeller) {
      await this.prisma.sellerMetric.upsert({
        where: { sellerId_metricDate: { sellerId, metricDate: today } },
        create: {
          sellerId,
          metricDate: today,
          unitsSold: agg.units,
          salesTotal: new Prisma.Decimal(agg.sales.toFixed(2)),
          ordersCompleted: 1,
        },
        update: {
          unitsSold: { increment: agg.units },
          salesTotal: { increment: new Prisma.Decimal(agg.sales.toFixed(2)) },
          ordersCompleted: { increment: 1 },
        },
      });
    }
    this.logger.log(`Updated seller metrics for order ${event.orderId}`);
  }

  async sellerSummary(user: AuthUser, sellerId?: string) {
    const target =
      user.role === 'SUPERADMIN' && sellerId ? sellerId : user.userId;
    if (user.role !== 'VENDEDOR' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenError();
    }
    if (user.role === 'VENDEDOR' && sellerId && sellerId !== user.userId) {
      throw new ForbiddenError();
    }

    const rows = await this.prisma.sellerMetric.findMany({
      where: { sellerId: target },
      orderBy: { metricDate: 'desc' },
      take: 90,
    });

    const totals = rows.reduce(
      (acc, r) => {
        acc.unitsSold += r.unitsSold;
        acc.salesTotal += Number(r.salesTotal);
        acc.ordersCompleted += r.ordersCompleted;
        return acc;
      },
      { unitsSold: 0, salesTotal: 0, ordersCompleted: 0 },
    );

    return {
      sellerId: target,
      totals,
      daily: rows.map((r) => ({
        date: r.metricDate,
        unitsSold: r.unitsSold,
        salesTotal: Number(r.salesTotal),
        ordersCompleted: r.ordersCompleted,
      })),
    };
  }

  async platformOverview(user: AuthUser) {
    if (user.role !== 'SUPERADMIN') throw new ForbiddenError();
    const [users, products, orders, revenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { total: true } }),
    ]);
    return {
      users,
      products,
      orders,
      revenue: Number(revenue._sum.total ?? 0),
    };
  }
}
