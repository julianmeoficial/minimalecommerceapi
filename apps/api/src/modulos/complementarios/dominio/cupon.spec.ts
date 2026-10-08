import { CouponType } from '@prisma/client';
import { calcularDescuento } from './cupon';

describe('calcularDescuento', () => {
  it('limita porcentaje al subtotal', () => {
    expect(calcularDescuento(CouponType.PORCENTAJE, 10, 50)).toBe(5);
  });

  it('limita monto fijo al subtotal', () => {
    expect(calcularDescuento(CouponType.MONTO_FIJO, 100, 30)).toBe(30);
  });
});
