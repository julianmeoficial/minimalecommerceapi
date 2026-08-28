import { ConfigService } from '@nestjs/config';
import { StripePaymentGateway } from './stripe.gateway';
import { ApiException } from '../../shared/errors/api-error';

describe('StripePaymentGateway mock', () => {
  it('permite mock fuera de producción sin STRIPE_SECRET_KEY', async () => {
    const gw = new StripePaymentGateway({
      get: (key: string) => (key === 'NODE_ENV' ? 'test' : undefined),
    } as unknown as ConfigService);
    const intent = await gw.createPaymentIntent({ orderId: 'o1', amount: 10 });
    expect(intent.provider).toBe('stripe-mock');
    expect(intent.status).toBe('PENDING');
    const confirmed = await gw.confirmPayment(intent.externalId);
    expect(confirmed.status).toBe('SUCCEEDED');
  });

  it('falla cerrado en producción sin STRIPE_SECRET_KEY', async () => {
    const gw = new StripePaymentGateway({
      get: (key: string) => (key === 'NODE_ENV' ? 'production' : undefined),
    } as unknown as ConfigService);
    await expect(gw.createPaymentIntent({ orderId: 'o1', amount: 10 })).rejects.toBeInstanceOf(
      ApiException,
    );
    await expect(gw.confirmPayment('pi_x')).rejects.toBeInstanceOf(ApiException);
  });
});
