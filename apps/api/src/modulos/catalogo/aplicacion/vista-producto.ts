import { Injectable } from '@nestjs/common';
import { AlmacenMedios } from '../../../compartido/media/almacen-medios';
import { ProductoCompleto } from '../datos/repositorio-productos';
import { ProductoVista } from '../dominio/catalogo';

/** Construye el modelo de lectura publicado; nunca se expone la fila de persistencia. */
@Injectable()
export class ConstructorVistaProducto {
  constructor(private readonly medios: AlmacenMedios) {}

  async construir(p: ProductoCompleto): Promise<ProductoVista> {
    return {
      id: p.id,
      nombre: p.name,
      descripcion: p.description,
      precio: Number(p.price),
      existencias: p.stock,
      disponible: p.stock > 0,
      imagenUrl: p.imageKey ? await this.medios.urlLectura(p.imageKey) : null,
      categoria: { id: p.category.id, nombre: p.category.name },
      vendedor: { id: p.seller.id, nombre: p.seller.name },
      preventa: p.preorder,
      activo: p.active,
      creadoEn: p.createdAt.toISOString(),
    };
  }

  construirVarios(ps: ProductoCompleto[]): Promise<ProductoVista[]> {
    return Promise.all(ps.map((p) => this.construir(p)));
  }
}
