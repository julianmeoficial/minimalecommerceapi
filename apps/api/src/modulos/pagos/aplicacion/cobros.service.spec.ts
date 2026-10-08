import { PaymentStatus, UserRole } from '@prisma/client';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { CobrosService } from './cobros.service';
import { PasarelaPagos } from './pasarela-pagos';

describe('CobrosService', () => {
  const comprador = Object.assign(new UsuarioAutenticado(), {
    userId: 'buyer-1',
    email: 'b@test.com',
    role: UserRole.COMPRADOR,
  });

  const pedido = {
    id: 'order-1',
    buyerId: 'buyer-1',
    status: 'CREADO',
    total: 50,
    placedAt: new Date(),
    items: [],
  } as never;

  it('inicia cobro y marca pendiente de pago', async () => {
    const pasarela: PasarelaPagos = {
      crearIntento: jest.fn().mockResolvedValue({
        proveedor: 'mock',
        externalId: 'pi_1',
        estado: 'PENDING',
      }),
      consultarIntento: jest.fn(),
      cancelarIntento: jest.fn(),
      verificarWebhook: jest.fn(),
    };
    const pagos = {
      upsertPendiente: jest.fn().mockResolvedValue({
        id: 'pay-1',
        orderId: 'order-1',
        amount: 50,
        provider: 'mock',
        externalId: 'pi_1',
        status: PaymentStatus.PENDING,
      }),
      porOrderId: jest.fn(),
      porExternalId: jest.fn(),
      actualizarEstado: jest.fn(),
      pendientesParaConciliar: jest.fn(),
      registrarEventoProveedor: jest.fn(),
    };
    const compra = {
      consultaPedido: jest.fn().mockResolvedValue(pedido),
      exigirPagable: jest.fn().mockResolvedValue(undefined),
    };
    const ciclo = { marcarPendientePago: jest.fn().mockResolvedValue(pedido) };
    const uow = { ejecutar: jest.fn((fn: () => Promise<unknown>) => fn()) };
    const config = { get: jest.fn().mockReturnValue('usd') };

    const svc = new CobrosService(
      pasarela,
      pagos as never,
      compra as never,
      ciclo as never,
      uow as never,
      config as never,
    );

    const r = await svc.iniciarCobro(comprador, 'order-1');
    expect(r.externalId).toBe('pi_1');
    expect(ciclo.marcarPendientePago).toHaveBeenCalledWith('order-1');
  });
});
