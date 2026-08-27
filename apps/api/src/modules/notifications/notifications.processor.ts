import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATIONS_QUEUE, NotificationsService } from './notifications.service';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  async process(job: Job<{ orderId: string; buyerId: string; total: string }>): Promise<void> {
    this.logger.log(`Processing notification job ${job.name} for order ${job.data.orderId}`);
    if (job.name === 'order-placed') {
      await this.notifications.persistOrderPlaced(job.data);
    }
  }
}
