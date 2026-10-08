export interface LineaPedido {
  precioUnitario: number;
  cantidad: number;
}

export interface Totales {
  subtotal: number;
  descuento: number;
  total: number;
}

const centavos = (n: number) => Math.round(n * 100);

/** Cálculo en centavos enteros para evitar errores de coma flotante en montos. */
export function calcularTotales(lineas: LineaPedido[], descuento = 0): Totales {
  const subtotal = lineas.reduce((a, l) => a + centavos(l.precioUnitario) * l.cantidad, 0);
  const desc = Math.min(subtotal, Math.max(0, centavos(descuento)));
  return { subtotal: subtotal / 100, descuento: desc / 100, total: (subtotal - desc) / 100 };
}
