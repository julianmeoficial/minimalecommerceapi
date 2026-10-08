import { Injectable } from '@nestjs/common';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, NoEncontrado } from '../../../compartido/errores/error-api';
import { ConsultaProductosService } from '../../catalogo/aplicacion/consulta-productos.service';
import { RepositorioCarrito } from '../datos/repositorio-carrito';
import { calcularResumen, LineaCarrito, ResumenCarrito } from '../dominio/resumen';

/** CU-02 Gestionar carrito. El precio siempre se toma del catálogo vigente, nunca del cliente. */
@Injectable()
export class CarritoService {
  constructor(
    private readonly repo: RepositorioCarrito,
    private readonly productos: ConsultaProductosService,
  ) {}

  async resumen(userId: string): Promise<ResumenCarrito> {
    return calcularResumen(await this.lineas(userId));
  }

  async agregar(userId: string, productoId: string, cantidad: number): Promise<ResumenCarrito> {
    const actual = await this.repo.item(userId, productoId);
    return this.fijar(userId, productoId, (actual?.quantity ?? 0) + cantidad);
  }

  async cambiarCantidad(userId: string, productoId: string, cantidad: number): Promise<ResumenCarrito> {
    if (!(await this.repo.item(userId, productoId))) throw new NoEncontrado('ítem de carrito', productoId);
    return this.fijar(userId, productoId, cantidad);
  }

  async quitar(userId: string, productoId: string): Promise<ResumenCarrito> {
    if (!(await this.repo.eliminar(userId, productoId))) throw new NoEncontrado('ítem de carrito', productoId);
    return this.resumen(userId);
  }

  /** Interfaz publicada para Pedidos: participa en la transacción del checkout. */
  async lineas(userId: string): Promise<LineaCarrito[]> {
    const items = await this.repo.itemsDe(userId);
    const productos = await this.productos.paraCompra(items.map((i) => i.productId));
    return items.map((i) => {
      const p = productos.get(i.productId);
      return {
        productoId: i.productId,
        vendedorId: p?.vendedorId ?? '',
        nombre: p?.nombre ?? 'Producto no disponible',
        precioUnitario: p?.precio ?? Number(i.unitPrice),
        cantidad: i.quantity,
        existencias: p?.existencias ?? 0,
        activo: p?.activo ?? false,
      };
    });
  }

  vaciar(userId: string): Promise<void> {
    return this.repo.vaciar(userId);
  }

  private async fijar(userId: string, productoId: string, cantidad: number): Promise<ResumenCarrito> {
    const p = await this.productos.uno(productoId);
    if (!p?.activo) throw new NoEncontrado('producto', productoId);
    if (p.existencias < cantidad) {
      throw new Conflicto(CodigoError.STOCK_INSUFFICIENT, `Solo hay ${p.existencias} unidades disponibles`);
    }
    await this.repo.guardar(userId, productoId, cantidad, p.precio);
    return this.resumen(userId);
  }
}
