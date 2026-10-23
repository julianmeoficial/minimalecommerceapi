import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PedidosModule } from '../pedidos/pedidos.module';
import { InventarioModule } from '../inventario/inventario.module';
import { CobrosService } from './aplicacion/cobros.service';
import { MantenimientoPagosService } from './aplicacion/mantenimiento-pagos.service';
import { PasarelaResiliente } from './aplicacion/pasarela-resiliente';
import { PasarelaPagos } from './aplicacion/pasarela-pagos';
import { SimuladaPasarela } from './aplicacion/simulada-pasarela';
import { StripePasarela } from './aplicacion/stripe-pasarela';
import { RepositorioPagos, RepositorioPagosPrisma } from './datos/repositorio-pagos';
import { PagosController } from './exposicion/pagos.controller';
import { SimuladorPagosController } from './exposicion/simulador-pagos.controller';
import { WebhookPagosController } from './exposicion/webhook-pagos.controller';

@Module({
  imports: [PedidosModule, InventarioModule],
  controllers: [PagosController, WebhookPagosController, SimuladorPagosController],
  providers: [
    CobrosService,
    MantenimientoPagosService,
    SimuladaPasarela,
    StripePasarela,
    {
      provide: PasarelaPagos,
      inject: [ConfigService, SimuladaPasarela, StripePasarela],
      useFactory: (config: ConfigService, mock: SimuladaPasarela, stripe: StripePasarela) => {
        const proveedor = config.get<string>('PAYMENT_PROVIDER') ?? 'mock';
        const base = seleccionarPasarela(proveedor, mock, stripe);
        return new PasarelaResiliente(base, config);
      },
    },
    { provide: RepositorioPagos, useClass: RepositorioPagosPrisma },
  ],
  exports: [CobrosService],
})
export class PagosModule {}

/** CobrosService solo depende de PasarelaPagos. Wompi: nuevo case + clase, sin tocar el servicio. */
function seleccionarPasarela(
  proveedor: string,
  mock: SimuladaPasarela,
  stripe: StripePasarela,
): SimuladaPasarela | StripePasarela {
  switch (proveedor) {
    case 'stripe':
      return stripe;
    case 'mock':
    default:
      return mock;
  }
}
