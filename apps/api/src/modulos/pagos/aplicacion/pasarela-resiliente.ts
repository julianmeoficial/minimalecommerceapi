import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import CircuitBreaker from 'opossum';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { ServicioNoDisponible } from '../../../compartido/errores/error-api';
import { CrearIntentoEntrada, EventoWebhook, IntentoPago, PasarelaPagos } from './pasarela-pagos';

const reintentar = async <T>(fn: () => Promise<T>, intentos = 3): Promise<T> => {
  let ultimo: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = e;
      if (i < intentos - 1) await new Promise((r) => setTimeout(r, 100 * 2 ** i));
    }
  }
  throw ultimo;
};

/** Envuelve la pasarela con timeout, reintentos en lecturas idempotentes y cortacircuito (H-05). */
@Injectable()
export class PasarelaResiliente extends PasarelaPagos {
  private readonly logger = new Logger(PasarelaResiliente.name);
  private readonly interna: PasarelaPagos;
  private readonly breaker: CircuitBreaker<[() => Promise<unknown>], unknown>;

  constructor(interna: PasarelaPagos, config: ConfigService) {
    super();
    this.interna = interna;
    const timeout = Number(config.get('PAGOS_TIMEOUT_MS') ?? 5000);
    this.breaker = new CircuitBreaker(async (op: () => Promise<unknown>) => op(), {
      timeout,
      errorThresholdPercentage: 50,
      resetTimeout: 30_000,
    });
    this.breaker.on('open', () => this.logger.warn('Cortacircuito de pagos abierto'));
  }

  private async ejecutar<T>(op: () => Promise<T>): Promise<T> {
    try {
      return (await this.breaker.fire(op)) as T;
    } catch {
      if (this.breaker.opened) {
        throw new ServicioNoDisponible(CodigoError.PAYMENT_PROVIDER_UNAVAILABLE, 'El proveedor de pagos no está disponible');
      }
      throw new ServicioNoDisponible(CodigoError.PAYMENT_PROVIDER_UNAVAILABLE, 'Error al contactar el proveedor de pagos');
    }
  }

  crearIntento(entrada: CrearIntentoEntrada): Promise<IntentoPago> {
    return this.ejecutar(() => this.interna.crearIntento(entrada));
  }

  consultarIntento(externalId: string): Promise<IntentoPago> {
    return this.ejecutar(() => reintentar(() => this.interna.consultarIntento(externalId)));
  }

  cancelarIntento(externalId: string): Promise<void> {
    return this.ejecutar(() => reintentar(() => this.interna.cancelarIntento(externalId)));
  }

  verificarWebhook(cuerpo: Buffer, firma: string | undefined): Promise<EventoWebhook> {
    return this.interna.verificarWebhook(cuerpo, firma);
  }
}
