import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { ErrorApi } from '../../../compartido/errores/error-api';
import { CrearIntentoEntrada, EventoWebhook, IntentoPago, PasarelaPagos, ResultadoIntento } from './pasarela-pagos';

@Injectable()
export class StripePasarela extends PasarelaPagos {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(config: ConfigService) {
    super();
    const key = config.get<string>('STRIPE_SECRET_KEY') || 'sk_test_placeholder';
    this.stripe = new Stripe(key);
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
  }

  async crearIntento(entrada: CrearIntentoEntrada): Promise<IntentoPago> {
    const intent = await this.stripe.paymentIntents.create(
      {
        amount: Math.round(entrada.amount * 100),
        currency: entrada.currency,
        metadata: { orderId: entrada.orderId },
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: entrada.idempotencyKey },
    );
    return {
      proveedor: 'stripe',
      externalId: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      estado: this.mapear(intent.status),
    };
  }

  async consultarIntento(externalId: string): Promise<IntentoPago> {
    const intent = await this.stripe.paymentIntents.retrieve(externalId);
    return {
      proveedor: 'stripe',
      externalId: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      estado: this.mapear(intent.status),
    };
  }

  async cancelarIntento(externalId: string): Promise<void> {
    await this.stripe.paymentIntents.cancel(externalId).catch(() => undefined);
  }

  async verificarWebhook(cuerpo: Buffer, firma: string | undefined): Promise<EventoWebhook> {
    if (!firma || !this.webhookSecret) {
      throw new ErrorApi(CodigoError.INVALID_SIGNATURE, 'Firma de webhook inválida', 400);
    }
    const evento = this.stripe.webhooks.constructEvent(cuerpo, firma, this.webhookSecret);
    if (evento.type !== 'payment_intent.succeeded' && evento.type !== 'payment_intent.payment_failed' && evento.type !== 'payment_intent.canceled') {
      throw new ErrorApi(CodigoError.VALIDATION_ERROR, `Evento no soportado: ${evento.type}`, 400);
    }
    const intent = evento.data.object as Stripe.PaymentIntent;
    return {
      tipo: evento.type,
      externalId: intent.id,
      estado: this.mapear(intent.status),
      providerEventId: evento.id,
    };
  }

  private mapear(status: string): ResultadoIntento {
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
