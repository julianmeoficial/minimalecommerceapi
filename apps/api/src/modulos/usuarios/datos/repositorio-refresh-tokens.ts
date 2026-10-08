import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

export abstract class RepositorioRefreshTokens {
  abstract crear(datos: {
    id: string;
    userId: string;
    family: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken>;
  abstract porId(id: string): Promise<RefreshToken | null>;
  /** Revoca solo si sigue vigente; devuelve false si otra petición ya lo rotó. */
  abstract revocarSiVigente(id: string, reemplazadoPor?: string): Promise<boolean>;
  abstract revocarFamilia(family: string): Promise<void>;
  abstract revocarDeUsuario(userId: string): Promise<void>;
}

@Injectable()
export class RepositorioRefreshTokensPrisma extends RepositorioRefreshTokens {
  constructor(private readonly host: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.host.tx;
  }

  crear(datos: { id: string; userId: string; family: string; tokenHash: string; expiresAt: Date }) {
    return this.db.refreshToken.create({ data: datos });
  }

  porId(id: string) {
    return this.db.refreshToken.findUnique({ where: { id } });
  }

  async revocarSiVigente(id: string, reemplazadoPor?: string) {
    const r = await this.db.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date(), replacedById: reemplazadoPor },
    });
    return r.count === 1;
  }

  async revocarFamilia(family: string) {
    await this.db.refreshToken.updateMany({ where: { family, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async revocarDeUsuario(userId: string) {
    await this.db.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
