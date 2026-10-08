export interface LineaCarrito {
  productoId: string;
  vendedorId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  existencias: number;
  activo: boolean;
}

export interface ResumenCarrito {
  items: (LineaCarrito & { subtotal: number; disponible: boolean })[];
  cantidadItems: number;
  unidades: number;
  subtotal: number;
  /** false si algún ítem ya no se puede comprar; el checkout lo rechazaría. */
  comprable: boolean;
}

export const redondear = (n: number) => Math.round(n * 100) / 100;

export function calcularResumen(lineas: LineaCarrito[]): ResumenCarrito {
  const items = lineas.map((l) => ({
    ...l,
    subtotal: redondear(l.precioUnitario * l.cantidad),
    disponible: l.activo && l.existencias >= l.cantidad,
  }));
  return {
    items,
    cantidadItems: items.length,
    unidades: items.reduce((a, i) => a + i.cantidad, 0),
    subtotal: redondear(items.reduce((a, i) => a + i.subtotal, 0)),
    comprable: items.length > 0 && items.every((i) => i.disponible),
  };
}
