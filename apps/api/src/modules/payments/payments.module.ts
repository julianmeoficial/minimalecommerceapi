import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PAYMENT_GATEWAY } from './payment-gateway';
import { StripePaymentGateway } from './stripe.gateway';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripePaymentGateway,
    { provide: PAYMENT_GATEWAY, useExisting: StripePaymentGateway },
  ],
  exports: [PaymentsService, PAYMENT_GATEWAY],
})
export class PaymentsModule {}
