import { Injectable } from '@nestjs/common';
import { Prisma, SellerMetric } from '@prisma/client';
import { PrismaService } from '../../../compartido/prisma/prisma.service';

export abstract class RepositorioMetricas {
  abstract upsertVenta(sellerId: string, fecha: Date, unidades: number, total: number): Promise<void>;
  abstract deVendedor(sellerId: string, desde: Date, hasta: Date): Promise<SellerMetric[]>;
  abstract resumenPlataforma(): Promise<{ productosActivos: number; pedidosPagados: number }>;
}

@Injectable()
export class RepositorioMetricasPrisma extends RepositorioMetricas {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async upsertVenta(sellerId: string, fecha: Date, unidades: number, total: number) {
    const metricDate = new Date(fecha.toISOString().slice(0, 10));
    await this.prisma.sellerMetric.upsert({
      where: { sellerId_metricDate: { sellerId, metricDate } },
      create: {
        sellerId,
        metricDate,
        unitsSold: unidades,
        salesTotal: new Prisma.Decimal(total),
        ordersCompleted: 1,
      },
      update: {
        unitsSold: { increment: unidades },
        salesTotal: { increment: total },
        ordersCompleted: { increment: 1 },
      },
    });
  }

  deVendedor(sellerId: string, desde: Date, hasta: Date) {
    return this.prisma.sellerMetric.findMany({
      where: { sellerId, metricDate: { gte: desde, lte: hasta } },
      orderBy: { metricDate: 'asc' },
    });
  }

  async resumenPlataforma() {
    const [productosActivos, pedidosPagados] = await Promise.all([
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.order.count({ where: { status: { in: ['PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO'] } } }),
    ]);
    return { productosActivos, pedidosPagados };
  }
}
