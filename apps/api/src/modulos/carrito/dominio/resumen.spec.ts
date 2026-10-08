import { calcularResumen } from './resumen';

describe('calcularResumen carrito', () => {
  it('marca comprable solo si hay ítems disponibles', () => {
    const r = calcularResumen([
      {
        productoId: 'a',
        vendedorId: 'v',
        nombre: 'X',
        precioUnitario: 10,
        cantidad: 1,
        subtotal: 10,
        existencias: 5,
        activo: true,
        disponible: true,
      },
    ]);
    expect(r.comprable).toBe(true);
    expect(r.subtotal).toBe(10);
  });
});
