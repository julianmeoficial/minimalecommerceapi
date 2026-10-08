import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { ErrorApi } from '../../../compartido/errores/error-api';
import { CrearIntentoEntrada, EventoWebhook, IntentoPago, PasarelaPagos, ResultadoIntento } from './pasarela-pagos';

const estado = new Map<string, ResultadoIntento>();

@Injectable()
export class SimuladaPasarela extends PasarelaPagos {
  async crearIntento(entrada: CrearIntentoEntrada): Promise<IntentoPago> {
    const externalId = `pi_mock_${entrada.orderId}`;
    estado.set(externalId, 'PENDING');
    return {
      proveedor: 'mock',
      externalId,
      clientSecret: `secret_mock_${randomUUID()}`,
      estado: 'PENDING',
    };
  }

  consultarIntento(externalId: string): Promise<IntentoPago> {
    return Promise.resolve({
      proveedor: 'mock',
      externalId,
      estado: estado.get(externalId) ?? 'PENDING',
    });
  }

  cancelarIntento(externalId: string): Promise<void> {
    estado.set(externalId, 'CANCELED');
    return Promise.resolve();
  }

  verificarWebhook(): Promise<EventoWebhook> {
    throw new ErrorApi(CodigoError.INVALID_SIGNATURE, 'El simulador no recibe webhooks', 400);
  }

  /** Solo para el endpoint de simulación en desarrollo. */
  fijarEstado(externalId: string, resultado: ResultadoIntento) {
    estado.set(externalId, resultado);
  }

  eventoSimulado(externalId: string, resultado: ResultadoIntento): EventoWebhook {
    const tipo =
      resultado === 'SUCCEEDED'
        ? 'payment_intent.succeeded'
        : resultado === 'CANCELED'
          ? 'payment_intent.canceled'
          : 'payment_intent.payment_failed';
    return { tipo, externalId, estado: resultado, providerEventId: `evt_mock_${randomUUID()}` };
  }
}
