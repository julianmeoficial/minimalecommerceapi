import { OrderStatus } from '@prisma/client';
import { exigirTransicion, puedeTransicionar, siguientesEstados } from './maquina-estados';

describe('maquina-estados pedido', () => {
  it('permite al comprador cancelar en CREADO', () => {
    expect(puedeTransicionar(OrderStatus.CREADO, OrderStatus.CANCELADO, 'COMPRADOR')).toBe(true);
  });

  it('permite al sistema marcar pagado desde PENDIENTE_PAGO', () => {
    expect(puedeTransicionar(OrderStatus.PENDIENTE_PAGO, OrderStatus.PAGADO, 'SISTEMA')).toBe(true);
  });

  it('no permite al comprador enviar el pedido', () => {
    expect(puedeTransicionar(OrderStatus.EN_PREPARACION, OrderStatus.ENVIADO, 'COMPRADOR')).toBe(false);
  });

  it('lista acciones del vendedor tras el pago', () => {
    expect(siguientesEstados(OrderStatus.PAGADO, 'VENDEDOR')).toContain(OrderStatus.EN_PREPARACION);
  });

  it('exigirTransicion lanza si el actor no puede', () => {
    expect(() => exigirTransicion(OrderStatus.PAGADO, OrderStatus.ENVIADO, 'COMPRADOR')).toThrow();
  });
});
