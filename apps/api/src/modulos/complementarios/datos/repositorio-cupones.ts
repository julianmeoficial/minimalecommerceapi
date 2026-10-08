import { Injectable } from '@nestjs/common';
import { Coupon, CouponType } from '@prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

export interface NuevoCupon {
  code: string;
  type: CouponType;
  value: number;
  description?: string;
  startsAt: Date;
  expiresAt: Date;
  maxUses: number;
  active: boolean;
  creatorId: string;
}

export abstract class RepositorioCupones {
  abstract porCodigo(code: string): Promise<Coupon | null>;
  abstract crear(datos: NuevoCupon): Promise<Coupon>;
  abstract deCreador(creatorId: string, skip: number, take: number): Promise<[Coupon[], number]>;
  /** Incremento condicionado al cupo para que dos checkouts simultáneos no excedan maxUses. */
  abstract consumirUso(id: string): Promise<boolean>;
  abstract devolverUso(id: string): Promise<void>;
}

@Injectable()
export class RepositorioCuponesPrisma extends RepositorioCupones {
  constructor(private readonly host: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.host.tx;
  }

  porCodigo(code: string) {
    return this.db.coupon.findUnique({ where: { code } });
  }

  crear(datos: NuevoCupon) {
    return this.db.coupon.create({ data: datos });
  }

  deCreador(creatorId: string, skip: number, take: number): Promise<[Coupon[], number]> {
    return Promise.all([
      this.db.coupon.findMany({ where: { creatorId }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.db.coupon.count({ where: { creatorId } }),
    ]);
  }

  async consumirUso(id: string) {
    const actual = await this.db.coupon.findUnique({ where: { id }, select: { maxUses: true } });
    if (!actual) return false;
    const r = await this.db.coupon.updateMany({
      where: { id, active: true, currentUses: { lt: actual.maxUses } },
      data: { currentUses: { increment: 1 } },
    });
    return r.count === 1;
  }

  async devolverUso(id: string) {
    await this.db.coupon.updateMany({ where: { id, currentUses: { gt: 0 } }, data: { currentUses: { decrement: 1 } } });
  }
}
