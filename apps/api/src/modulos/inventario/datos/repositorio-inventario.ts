import { Injectable } from '@nestjs/common';
import { ReservationStatus, StockReservation } from '@prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

export abstract class RepositorioInventario {
  /** Descuento atómico condicionado: devuelve false si no hay existencias suficientes. */
  abstract descontarSiDisponible(productId: string, cantidad: number): Promise<boolean>;
  abstract reponer(productId: string, cantidad: number): Promise<void>;
  abstract fijarExistencias(productId: string, cantidad: number): Promise<number>;
  abstract existencias(productId: string): Promise<number | null>;
  abstract crearReservas(orderId: string, items: { productId: string; quantity: number }[], venceEn: Date): Promise<void>;
  abstract reservasDe(orderId: string, estado: ReservationStatus): Promise<StockReservation[]>;
  /** Transición condicional: solo cambia si la reserva sigue en `desde` (idempotente entre instancias). */
  abstract transicionarReserva(id: string, desde: ReservationStatus, hacia: ReservationStatus): Promise<boolean>;
  abstract pedidosConReservasVencidas(ahora: Date, limite: number): Promise<string[]>;
}

@Injectable()
export class RepositorioInventarioPrisma extends RepositorioInventario {
  constructor(private readonly host: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.host.tx;
  }

  async descontarSiDisponible(productId: string, cantidad: number) {
    const r = await this.db.product.updateMany({
      where: { id: productId, active: true, stock: { gte: cantidad } },
      data: { stock: { decrement: cantidad } },
    });
    return r.count === 1;
  }

  async reponer(productId: string, cantidad: number) {
    await this.db.product.update({ where: { id: productId }, data: { stock: { increment: cantidad } } });
  }

  async fijarExistencias(productId: string, cantidad: number) {
    return (await this.db.product.update({ where: { id: productId }, data: { stock: cantidad } })).stock;
  }

  async existencias(productId: string) {
    return (await this.db.product.findUnique({ where: { id: productId }, select: { stock: true } }))?.stock ?? null;
  }

  async crearReservas(orderId: string, items: { productId: string; quantity: number }[], venceEn: Date) {
    await this.db.stockReservation.createMany({
      data: items.map((i) => ({ orderId, productId: i.productId, quantity: i.quantity, expiresAt: venceEn })),
    });
  }

  reservasDe(orderId: string, estado: ReservationStatus) {
    return this.db.stockReservation.findMany({ where: { orderId, status: estado } });
  }

  async transicionarReserva(id: string, desde: ReservationStatus, hacia: ReservationStatus) {
    const r = await this.db.stockReservation.updateMany({ where: { id, status: desde }, data: { status: hacia } });
    return r.count === 1;
  }

  async pedidosConReservasVencidas(ahora: Date, limite: number) {
    const filas = await this.db.stockReservation.findMany({
      where: { status: ReservationStatus.ACTIVA, expiresAt: { lt: ahora } },
      select: { orderId: true },
      distinct: ['orderId'],
      orderBy: { orderId: 'asc' },
      take: limite,
    });
    return filas.map((f) => f.orderId);
  }
}
