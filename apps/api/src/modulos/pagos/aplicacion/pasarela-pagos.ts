export type ResultadoIntento = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';

export interface IntentoPago {
  proveedor: string;
  externalId: string;
  clientSecret?: string;
  estado: ResultadoIntento;
}

export interface CrearIntentoEntrada {
  orderId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
}

export interface EventoWebhook {
  tipo: string;
  externalId: string;
  estado: ResultadoIntento;
  providerEventId: string;
}

/**
 * Puerto de pasarela. Adaptadores:
 * - `mock` — simulador universitario (activo ahora, también en production)
 * - `stripe` — opcional
 * - `wompi` — futuro (Colombia); aún no hay clase ni valor en Joi
 */
export abstract class PasarelaPagos {
  abstract crearIntento(entrada: CrearIntentoEntrada): Promise<IntentoPago>;
  abstract consultarIntento(externalId: string): Promise<IntentoPago>;
  abstract cancelarIntento(externalId: string): Promise<void>;
  abstract verificarWebhook(cuerpo: Buffer, firma: string | undefined): Promise<EventoWebhook>;
}
