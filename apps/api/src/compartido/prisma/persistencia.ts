import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

export type HostTransaccional = TransactionHost<TransactionalAdapterPrisma>;

/**
 * Puerto de unidad de trabajo: los casos de uso agrupan escrituras de varios
 * repositorios sin conocer Prisma. Los repositorios usan `host.tx`, que apunta a la
 * transacción activa o al cliente base si no hay ninguna.
 */
export abstract class UnidadDeTrabajo {
  abstract ejecutar<T>(fn: () => Promise<T>): Promise<T>;
}

@Injectable()
export class UnidadDeTrabajoPrisma extends UnidadDeTrabajo {
  constructor(private readonly host: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  ejecutar<T>(fn: () => Promise<T>): Promise<T> {
    return this.host.withTransaction(fn);
  }
}
