import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../../compartido/prisma/prisma.service';

export interface NuevoUsuario {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
}

export abstract class RepositorioUsuarios {
  abstract porEmail(email: string): Promise<User | null>;
  abstract porId(id: string): Promise<User | null>;
  abstract crear(datos: NuevoUsuario): Promise<User>;
  abstract actualizar(id: string, datos: Partial<Pick<User, 'name' | 'phone' | 'role' | 'active'>>): Promise<User>;
  abstract listar(filtro: { role?: UserRole; q?: string }, skip: number, take: number): Promise<[User[], number]>;
  abstract porIds(ids: string[]): Promise<User[]>;
  abstract idsPorRol(role: UserRole): Promise<string[]>;
}

@Injectable()
export class RepositorioUsuariosPrisma extends RepositorioUsuarios {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  porEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  porId(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  crear(datos: NuevoUsuario) {
    return this.prisma.user.create({ data: datos });
  }

  actualizar(id: string, datos: Partial<Pick<User, 'name' | 'phone' | 'role' | 'active'>>) {
    return this.prisma.user.update({ where: { id }, data: datos });
  }

  async listar(filtro: { role?: UserRole; q?: string }, skip: number, take: number): Promise<[User[], number]> {
    const where: Prisma.UserWhereInput = {
      role: filtro.role,
      ...(filtro.q
        ? {
            OR: [
              { name: { contains: filtro.q, mode: 'insensitive' } },
              { email: { contains: filtro.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return this.prisma.$transaction([
      this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.user.count({ where }),
    ]);
  }

  porIds(ids: string[]) {
    return this.prisma.user.findMany({ where: { id: { in: ids } } });
  }

  async idsPorRol(role: UserRole) {
    return (await this.prisma.user.findMany({ where: { role, active: true }, select: { id: true } })).map((u) => u.id);
  }
}
