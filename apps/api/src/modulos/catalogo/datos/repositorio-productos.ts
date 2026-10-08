import { Injectable } from '@nestjs/common';
import { Category, Prisma, Product, User } from '@prisma/client';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { CriteriosCatalogo, OrdenCatalogo } from '../dominio/catalogo';

export type ProductoCompleto = Product & { category: Category; seller: Pick<User, 'id' | 'name'> };

export interface DatosProducto {
  name: string;
  description?: string | null;
  price: number;
  categoryId: string;
  preorder: boolean;
}

export abstract class RepositorioProductos {
  abstract buscar(c: CriteriosCatalogo): Promise<[ProductoCompleto[], number]>;
  abstract porId(id: string): Promise<ProductoCompleto | null>;
  abstract deVendedor(sellerId: string, skip: number, take: number): Promise<[ProductoCompleto[], number]>;
  abstract crear(sellerId: string, datos: DatosProducto & { stock: number }): Promise<ProductoCompleto>;
  abstract actualizar(id: string, datos: Partial<DatosProducto & { active: boolean; imageKey: string | null }>): Promise<ProductoCompleto>;
  abstract porIds(ids: string[]): Promise<Product[]>;
  abstract contarActivos(): Promise<number>;
}

const INCLUIR = { category: true, seller: { select: { id: true, name: true } } } as const;

const ORDEN: Record<OrdenCatalogo, Prisma.ProductOrderByWithRelationInput[]> = {
  [OrdenCatalogo.RECIENTES]: [{ createdAt: 'desc' }, { id: 'asc' }],
  [OrdenCatalogo.PRECIO_ASC]: [{ price: 'asc' }, { id: 'asc' }],
  [OrdenCatalogo.PRECIO_DESC]: [{ price: 'desc' }, { id: 'asc' }],
  [OrdenCatalogo.NOMBRE]: [{ name: 'asc' }, { id: 'asc' }],
};

@Injectable()
export class RepositorioProductosPrisma extends RepositorioProductos {
  constructor(private readonly host: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.host.tx;
  }

  /** Consulta paginada que aprovecha los índices (active, category_id, price), (active, created_at) y trigramas sobre name. */
  async buscar(c: CriteriosCatalogo): Promise<[ProductoCompleto[], number]> {
    const where: Prisma.ProductWhereInput = { active: true };
    if (c.q) where.name = { contains: c.q.trim(), mode: 'insensitive' };
    if (c.categoriaId) where.categoryId = c.categoriaId;
    if (c.vendedorId) where.sellerId = c.vendedorId;
    if (c.preventa !== undefined) where.preorder = c.preventa;
    if (c.disponible === true) where.stock = { gt: 0 };
    if (c.disponible === false) where.stock = { lte: 0 };
    if (c.precioMin !== undefined || c.precioMax !== undefined) {
      where.price = { gte: c.precioMin, lte: c.precioMax };
    }
    const [filas, total] = await Promise.all([
      this.db.product.findMany({
        where,
        include: INCLUIR,
        orderBy: ORDEN[c.orden],
        skip: c.pagina * c.tamano,
        take: c.tamano,
      }),
      this.db.product.count({ where }),
    ]);
    return [filas, total];
  }

  porId(id: string) {
    return this.db.product.findUnique({ where: { id }, include: INCLUIR });
  }

  async deVendedor(sellerId: string, skip: number, take: number): Promise<[ProductoCompleto[], number]> {
    return Promise.all([
      this.db.product.findMany({ where: { sellerId }, include: INCLUIR, orderBy: { createdAt: 'desc' }, skip, take }),
      this.db.product.count({ where: { sellerId } }),
    ]);
  }

  crear(sellerId: string, datos: DatosProducto & { stock: number }) {
    return this.db.product.create({ data: { ...datos, sellerId }, include: INCLUIR });
  }

  actualizar(id: string, datos: Partial<DatosProducto & { active: boolean; imageKey: string | null }>) {
    return this.db.product.update({ where: { id }, data: datos, include: INCLUIR });
  }

  porIds(ids: string[]) {
    return this.db.product.findMany({ where: { id: { in: ids } } });
  }

  contarActivos() {
    return this.db.product.count({ where: { active: true } });
  }
}
