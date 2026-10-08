import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../compartido/prisma/prisma.service';
import { ClaveModulo } from '../dominio/modulos';

export interface EstadoModulo {
  clave: string;
  activo: boolean;
  actualizadoEn: Date;
}

export abstract class RepositorioModulos {
  abstract buscar(clave: ClaveModulo): Promise<EstadoModulo | null>;
  abstract listar(): Promise<EstadoModulo[]>;
  abstract guardar(clave: ClaveModulo, activo: boolean): Promise<EstadoModulo>;
}

@Injectable()
export class RepositorioModulosPrisma extends RepositorioModulos {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private mapear(f: { key: string; enabled: boolean; updatedAt: Date }): EstadoModulo {
    return { clave: f.key, activo: f.enabled, actualizadoEn: f.updatedAt };
  }

  async buscar(clave: ClaveModulo) {
    const f = await this.prisma.featureFlag.findUnique({ where: { key: clave } });
    return f ? this.mapear(f) : null;
  }

  async listar() {
    return (await this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } })).map((f) => this.mapear(f));
  }

  async guardar(clave: ClaveModulo, activo: boolean) {
    const f = await this.prisma.featureFlag.upsert({
      where: { key: clave },
      create: { key: clave, enabled: activo },
      update: { enabled: activo },
    });
    return this.mapear(f);
  }
}
