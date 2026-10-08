import { Injectable } from '@nestjs/common';
import { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

export abstract class RepositorioPagos {
  abstract porOrderId(orderId: string): Promise<Payment | null>;
  abstract porExternalId(externalId: string): Promise<Payment | null>;
  abstract upsertPendiente(datos: {
    orderId: string;
    provider: string;
    externalId: string;
    amount: number;
    currency: string;
  }): Promise<Payment>;
  abstract actualizarEstado(orderId: string, status: PaymentStatus, reconciliado?: boolean): Promise<Payment>;
  abstract pendientesParaConciliar(antesDe: Date, limite: number): Promise<Payment[]>;
  abstract registrarEventoProveedor(provider: string, providerEventId: string, type: string): Promise<boolean>;
}

@Injectable()
export class RepositorioPagosPrisma extends RepositorioPagos {
  constructor(private readonly host: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.host.tx;
  }

  porOrderId(orderId: string) {
    return this.db.payment.findUnique({ where: { orderId } });
  }

  porExternalId(externalId: string) {
    return this.db.payment.findUnique({ where: { externalId } });
  }

  upsertPendiente(datos: {
    orderId: string;
    provider: string;
    externalId: string;
    amount: number;
    currency: string;
  }) {
    const amount = new Prisma.Decimal(datos.amount);
    return this.db.payment.upsert({
      where: { orderId: datos.orderId },
      create: {
        orderId: datos.orderId,
        provider: datos.provider,
        externalId: datos.externalId,
        amount,
        currency: datos.currency,
        status: PaymentStatus.PENDING,
      },
      update: {
        provider: datos.provider,
        externalId: datos.externalId,
        amount,
        currency: datos.currency,
        status: PaymentStatus.PENDING,
      },
    });
  }

  actualizarEstado(orderId: string, status: PaymentStatus, reconciliado = false) {
    return this.db.payment.update({
      where: { orderId },
      data: {
        status,
        ...(reconciliado ? { lastReconciledAt: new Date() } : {}),
      },
    });
  }

  pendientesParaConciliar(antesDe: Date, limite: number) {
    return this.db.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        externalId: { not: null },
        createdAt: { lt: antesDe },
      },
      orderBy: { createdAt: 'asc' },
      take: limite,
    });
  }

  async registrarEventoProveedor(provider: string, providerEventId: string, type: string) {
    try {
      await this.db.paymentEvent.create({ data: { provider, providerEventId, type } });
      return true;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return false;
      throw e;
    }
  }
}
