import { CouponType } from '@prisma/client';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto } from '../../../compartido/errores/error-api';

export interface DatosCupon {
  type: CouponType;
  value: number;
  startsAt: Date;
  expiresAt: Date;
  maxUses: number;
  currentUses: number;
  active: boolean;
}

export const normalizarCodigo = (codigo: string) => codigo.trim().toUpperCase();

export function exigirVigente(c: DatosCupon, ahora = new Date()): void {
  if (!c.active || c.startsAt > ahora || c.expiresAt < ahora) {
    throw new Conflicto(CodigoError.COUPON_EXPIRED, 'El cupón no está vigente');
  }
  if (c.currentUses >= c.maxUses) {
    throw new Conflicto(CodigoError.COUPON_EXHAUSTED, 'El cupón agotó sus usos');
  }
}

/** Descuento en moneda, redondeado a centavos y nunca mayor que el subtotal. */
export function calcularDescuento(tipo: CouponType, valor: number, subtotal: number): number {
  const bruto = tipo === CouponType.PORCENTAJE ? (subtotal * Math.min(valor, 100)) / 100 : valor;
  return Math.round(Math.max(0, Math.min(subtotal, bruto)) * 100) / 100;
}
