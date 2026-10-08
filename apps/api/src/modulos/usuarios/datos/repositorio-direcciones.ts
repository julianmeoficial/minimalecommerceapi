import { Injectable } from '@nestjs/common';
import { Address } from '@prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

export interface NuevaDireccion {
  label: string;
  fullAddress: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  primaryAddress: boolean;
}

export abstract class RepositorioDirecciones {
  abstract activasDe(userId: string): Promise<Address[]>;
  abstract activaDe(userId: string, id: string): Promise<Address | null>;
  abstract crear(userId: string, datos: NuevaDireccion): Promise<Address>;
  abstract desmarcarPrincipal(userId: string): Promise<void>;
  abstract desactivar(id: string): Promise<void>;
}

@Injectable()
export class RepositorioDireccionesPrisma extends RepositorioDirecciones {
  constructor(private readonly host: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.host.tx;
  }

  activasDe(userId: string) {
    return this.db.address.findMany({
      where: { userId, active: true },
      orderBy: [{ primaryAddress: 'desc' }, { createdAt: 'desc' }],
    });
  }

  activaDe(userId: string, id: string) {
    return this.db.address.findFirst({ where: { id, userId, active: true } });
  }

  crear(userId: string, datos: NuevaDireccion) {
    return this.db.address.create({ data: { ...datos, userId } });
  }

  async desmarcarPrincipal(userId: string) {
    await this.db.address.updateMany({ where: { userId, primaryAddress: true }, data: { primaryAddress: false } });
  }

  async desactivar(id: string) {
    await this.db.address.update({ where: { id }, data: { active: false, primaryAddress: false } });
  }
}
