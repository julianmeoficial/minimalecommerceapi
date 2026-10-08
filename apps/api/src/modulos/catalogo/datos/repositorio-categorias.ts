import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../../../compartido/prisma/prisma.service';

export abstract class RepositorioCategorias {
  abstract listar(): Promise<Category[]>;
  abstract porId(id: string): Promise<Category | null>;
  abstract porNombre(nombre: string): Promise<Category | null>;
  abstract crear(datos: { name: string; description?: string }): Promise<Category>;
  abstract actualizar(id: string, datos: { name?: string; description?: string }): Promise<Category>;
  abstract eliminar(id: string): Promise<void>;
  abstract contarProductos(id: string): Promise<number>;
}

@Injectable()
export class RepositorioCategoriasPrisma extends RepositorioCategorias {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  listar() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  porId(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  porNombre(nombre: string) {
    return this.prisma.category.findFirst({ where: { name: { equals: nombre, mode: 'insensitive' } } });
  }

  crear(datos: { name: string; description?: string }) {
    return this.prisma.category.create({ data: datos });
  }

  actualizar(id: string, datos: { name?: string; description?: string }) {
    return this.prisma.category.update({ where: { id }, data: datos });
  }

  async eliminar(id: string) {
    await this.prisma.category.delete({ where: { id } });
  }

  contarProductos(id: string) {
    return this.prisma.product.count({ where: { categoryId: id } });
  }
}
