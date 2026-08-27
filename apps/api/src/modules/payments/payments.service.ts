import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ApiException, ForbiddenError, NotFoundError } from '../../shared/errors/api-error';
import { AuthUser } from '../../shared/auth/current-user.decorator';
import { PAYMENT_GATEWAY } from './payment-gateway';
import type { PaymentGateway } from './payment-gateway';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  async createIntent(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundError('pedido', orderId);
    if (order.buyerId !== user.userId && user.role !== 'SUPERADMIN') {
      throw new ForbiddenError();
    }
    if (order.status === OrderStatus.PAGADO) {
      throw new ApiException('ALREADY_PAID', 'El pedido ya está pagado');
    }
    if (order.payment?.status === PaymentStatus.SUCCEEDED) {
      throw new ApiException('ALREADY_PAID', 'El pago ya fue confirmado');
    }

    const intent = await this.gateway.createPaymentIntent({
      orderId: order.id,
      amount: Number(order.total),
    });

    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: intent.provider,
        externalId: intent.externalId,
        amount: order.total,
        status: PaymentStatus.PENDING,
      },
      update: {
        provider: intent.provider,
        externalId: intent.externalId,
        amount: order.total,
        status: PaymentStatus.PENDING,
      },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: intent.externalId },
    });

    return {
      paymentId: payment.id,
      orderId: order.id,
      amount: Number(order.total),
      provider: intent.provider,
      externalId: intent.externalId,
      clientSecret: intent.clientSecret,
      status: payment.status,
    };
  }

  async confirm(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundError('pedido', orderId);
    if (order.buyerId !== user.userId && user.role !== 'SUPERADMIN') {
      throw new ForbiddenError();
    }
    if (!order.payment?.externalId) {
      throw new ApiException('NO_PAYMENT', 'No hay intento de pago para este pedido');
    }

    const result = await this.gateway.confirmPayment(order.payment.externalId);
    const status =
      result.status === 'SUCCEEDED'
        ? PaymentStatus.SUCCEEDED
        : result.status === 'CANCELED'
          ? PaymentStatus.CANCELED
          : result.status === 'FAILED'
            ? PaymentStatus.FAILED
            : PaymentStatus.PENDING;

    const payment = await this.prisma.payment.update({
      where: { orderId },
      data: { status },
    });

    if (status === PaymentStatus.SUCCEEDED) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAGADO, paymentRef: result.externalId },
      });
    }

    return {
      paymentId: payment.id,
      orderId,
      status: payment.status,
      externalId: result.externalId,
    };
  }
}
