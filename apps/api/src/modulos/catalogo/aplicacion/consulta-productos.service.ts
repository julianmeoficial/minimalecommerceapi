import { Injectable } from '@nestjs/common';
import { RepositorioProductos } from '../datos/repositorio-productos';

export interface ProductoParaCompra {
  id: string;
  nombre: string;
  precio: number;
  existencias: number;
  activo: boolean;
  preventa: boolean;
  vendedorId: string;
}

/** Interfaz publicada del Catálogo para Carrito, Pedidos y Reseñas. */
@Injectable()
export class ConsultaProductosService {
  constructor(private readonly productos: RepositorioProductos) {}

  async paraCompra(ids: string[]): Promise<Map<string, ProductoParaCompra>> {
    if (!ids.length) return new Map();
    const filas = await this.productos.porIds([...new Set(ids)]);
    return new Map(
      filas.map((p) => [
        p.id,
        {
          id: p.id,
          nombre: p.name,
          precio: Number(p.price),
          existencias: p.stock,
          activo: p.active,
          preventa: p.preorder,
          vendedorId: p.sellerId,
        },
      ]),
    );
  }

  async uno(id: string): Promise<ProductoParaCompra | undefined> {
    return (await this.paraCompra([id])).get(id);
  }

  contarActivos() {
    return this.productos.contarActivos();
  }
}
