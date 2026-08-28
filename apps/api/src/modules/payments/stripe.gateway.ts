import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import {
  CreatePaymentIntentInput,
  PaymentGateway,
  PaymentIntentResult,
} from './payment-gateway';
import { ApiException } from '../../shared/errors/api-error';

@Injectable()
export class StripePaymentGateway implements PaymentGateway {
  private readonly stripe: Stripe | null;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? new Stripe(key) : null;
  }

  private assertMockAllowed() {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ApiException(
        'PAYMENTS_UNAVAILABLE',
        'Los pagos no están configurados',
        503,
      );
    }
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      this.assertMockAllowed();
      // Sandbox local sin Stripe: simula intent pendiente
      return {
        provider: 'stripe-mock',
        externalId: `pi_mock_${randomUUID()}`,
        clientSecret: `secret_mock_${randomUUID()}`,
        status: 'PENDING',
      };
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency ?? 'usd',
      metadata: { orderId: input.orderId, ...(input.metadata ?? {}) },
      automatic_payment_methods: { enabled: true },
    });

    return {
      provider: 'stripe',
      externalId: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      status: this.mapStatus(intent.status),
    };
  }

  async confirmPayment(externalId: string): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      this.assertMockAllowed();
      return {
        provider: 'stripe-mock',
        externalId,
        status: 'SUCCEEDED',
      };
    }
    const intent = await this.stripe.paymentIntents.retrieve(externalId);
    return {
      provider: 'stripe',
      externalId: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      status: this.mapStatus(intent.status),
    };
  }

  private mapStatus(status: string): PaymentIntentResult['status'] {
    switch (status) {
      case 'succeeded':
        return 'SUCCEEDED';
      case 'canceled':
        return 'CANCELED';
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
      case 'processing':
        return 'PENDING';
      default:
        return 'FAILED';
    }
  }
}
