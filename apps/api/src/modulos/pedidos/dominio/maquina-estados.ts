import { OrderStatus } from '@prisma/client';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, Prohibido } from '../../../compartido/errores/error-api';

export type Actor = 'COMPRADOR' | 'VENDEDOR' | 'SUPERADMIN' | 'SISTEMA';

const { CREADO, PENDIENTE_PAGO, PAGADO, EN_PREPARACION, ENVIADO, ENTREGADO, CANCELADO, REEMBOLSADO } = OrderStatus;

/** Ciclo de vida del pedido (TCC 8.4) con el actor autorizado para cada transición. */
export const TRANSICIONES: Record<OrderStatus, Partial<Record<OrderStatus, Actor[]>>> = {
  [CREADO]: {
    [PENDIENTE_PAGO]: ['SISTEMA'],
    [CANCELADO]: ['COMPRADOR', 'SISTEMA', 'SUPERADMIN'],
  },
  [PENDIENTE_PAGO]: {
    [PAGADO]: ['SISTEMA'],
    [CANCELADO]: ['COMPRADOR', 'SISTEMA', 'SUPERADMIN'],
  },
  [PAGADO]: {
    [EN_PREPARACION]: ['VENDEDOR', 'SUPERADMIN'],
    [REEMBOLSADO]: ['SUPERADMIN', 'SISTEMA'],
  },
  [EN_PREPARACION]: {
    [ENVIADO]: ['VENDEDOR', 'SUPERADMIN'],
    [REEMBOLSADO]: ['SUPERADMIN', 'SISTEMA'],
  },
  [ENVIADO]: {
    [ENTREGADO]: ['COMPRADOR', 'VENDEDOR', 'SUPERADMIN'],
  },
  [ENTREGADO]: {},
  [CANCELADO]: {},
  [REEMBOLSADO]: {},
};

export const ESTADOS_FINALES: OrderStatus[] = [ENTREGADO, CANCELADO, REEMBOLSADO];
export const ESTADOS_POR_PAGAR: OrderStatus[] = [CREADO, PENDIENTE_PAGO];

export function puedeTransicionar(desde: OrderStatus, hacia: OrderStatus, actor: Actor): boolean {
  return TRANSICIONES[desde][hacia]?.includes(actor) ?? false;
}

export function exigirTransicion(desde: OrderStatus, hacia: OrderStatus, actor: Actor): void {
  const actores = TRANSICIONES[desde][hacia];
  if (!actores) {
    throw new Conflicto(CodigoError.INVALID_TRANSITION, `No se puede pasar de ${desde} a ${hacia}`);
  }
  if (!actores.includes(actor)) {
    throw new Prohibido(`El rol ${actor} no puede pasar el pedido de ${desde} a ${hacia}`);
  }
}

export function siguientesEstados(desde: OrderStatus, actor: Actor): OrderStatus[] {
  return (Object.entries(TRANSICIONES[desde]) as [OrderStatus, Actor[]][])
    .filter(([, actores]) => actores.includes(actor))
    .map(([estado]) => estado);
}
