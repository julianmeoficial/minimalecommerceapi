export interface CreatePaymentIntentInput {
  orderId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  provider: string;
  externalId: string;
  clientSecret?: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
}

export interface PaymentGateway {
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  confirmPayment(externalId: string): Promise<PaymentIntentResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
