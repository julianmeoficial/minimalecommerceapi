import { calcularTotales } from './totales';

describe('calcularTotales', () => {
  it('suma líneas y aplica descuento sin pasarse del subtotal', () => {
    const r = calcularTotales([{ precioUnitario: 10.5, cantidad: 2 }], 5);
    expect(r.subtotal).toBe(21);
    expect(r.descuento).toBe(5);
    expect(r.total).toBe(16);
  });
});
