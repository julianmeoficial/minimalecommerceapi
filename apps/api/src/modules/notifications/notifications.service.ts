import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OrderPlacedEvent } from '../../shared/events/order-placed.event';

export const NOTIFICATIONS_QUEUE = 'notifications';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  @OnEvent('order.placed')
  async onOrderPlaced(event: OrderPlacedEvent) {
    await this.queue.add(
      'order-placed',
      {
        orderId: event.orderId,
        buyerId: event.buyerId,
        total: event.total,
      },
      { removeOnComplete: 100, attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
    );
    this.logger.log(`Enqueued notification for order ${event.orderId}`);
  }

  async persistOrderPlaced(data: { orderId: string; buyerId: string; total: string }) {
    await this.prisma.notification.create({
      data: {
        userId: data.buyerId,
        type: NotificationType.PEDIDO,
        title: 'Pedido recibido',
        message: `Tu pedido ${data.orderId} por ${data.total} fue registrado.`,
      },
    });
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }
}
