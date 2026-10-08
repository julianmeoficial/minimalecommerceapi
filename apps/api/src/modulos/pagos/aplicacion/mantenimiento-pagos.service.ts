import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InventarioService } from '../../inventario/aplicacion/inventario.service';
import { CicloVidaPedidoService } from '../../pedidos/aplicacion/ciclo-vida-pedido.service';
import { RepositorioPagos } from '../datos/repositorio-pagos';
import { CobrosService } from './cobros.service';
import { PasarelaPagos } from './pasarela-pagos';

@Injectable()
export class MantenimientoPagosService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MantenimientoPagosService.name);
  private readonly programados: boolean;
  private readonly minutosConciliacion: number;
  private timers: NodeJS.Timeout[] = [];

  constructor(
    private readonly inventario: InventarioService,
    private readonly ciclo: CicloVidaPedidoService,
    private readonly cobros: CobrosService,
    private readonly pagos: RepositorioPagos,
    private readonly pasarela: PasarelaPagos,
    config: ConfigService,
  ) {
    this.programados = config.get<boolean>('TRABAJOS_PROGRAMADOS') ?? true;
    this.minutosConciliacion = Number(config.get('CONCILIACION_MINUTOS') ?? 10);
  }

  onModuleInit() {
    if (!this.programados) return;
    this.timers.push(
      setInterval(() => void this.liberarReservasVencidas().catch((e) => this.logger.error(e)), 60_000),
      setInterval(() => void this.conciliarPagosPendientes().catch((e) => this.logger.error(e)), 300_000),
    );
    this.logger.log('Mantenimiento de pagos y reservas programado (intervalos locales)');
  }

  onModuleDestroy() {
    for (const t of this.timers) clearInterval(t);
  }

  async liberarReservasVencidas() {
    const pedidos = await this.inventario.pedidosConReservasVencidas(50);
    for (const orderId of pedidos) {
      const pago = await this.pagos.porOrderId(orderId);
      if (pago?.externalId) {
        try {
          await this.pasarela.cancelarIntento(pago.externalId);
        } catch {
          /* intento ya cerrado en el proveedor */
        }
      }
      await this.ciclo.cancelarPorVencimiento(orderId);
    }
  }

  async conciliarPagosPendientes() {
    const limite = new Date(Date.now() - this.minutosConciliacion * 60_000);
    const pendientes = await this.pagos.pendientesParaConciliar(limite, 30);
    for (const p of pendientes) {
      await this.cobros.conciliarPago(p.orderId);
    }
  }
}
