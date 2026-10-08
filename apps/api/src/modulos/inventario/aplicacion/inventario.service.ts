import { Injectable } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, NoEncontrado } from '../../../compartido/errores/error-api';
import { BusEventos } from '../../../compartido/eventos/bus-eventos';
import { EVENTOS } from '../../../compartido/eventos/eventos-pedido';
import { UnidadDeTrabajo } from '../../../compartido/prisma/persistencia';
import { PoliticaPropiedadProducto } from '../../catalogo/aplicacion/politica-propiedad-producto';
import { ConsultaProductosService } from '../../catalogo/aplicacion/consulta-productos.service';
import { RepositorioInventario } from '../datos/repositorio-inventario';

export interface ItemReserva {
  productId: string;
  quantity: number;
}

/** ServicioInventario del TCC: disponibilidad y reserva de existencias con vigencia (RI-10). */
@Injectable()
export class InventarioService {
  constructor(
    private readonly repo: RepositorioInventario,
    private readonly productos: ConsultaProductosService,
    private readonly uow: UnidadDeTrabajo,
    private readonly bus: BusEventos,
  ) {}

  /**
   * Descuenta y registra la reserva. Debe ejecutarse dentro de la transacción del checkout:
   * si un ítem falla, la transacción revierte también los descuentos previos.
   */
  async reservaExistencias(orderId: string, items: ItemReserva[], venceEn: Date): Promise<void> {
    const ordenados = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
    for (const item of ordenados) {
      if (!(await this.repo.descontarSiDisponible(item.productId, item.quantity))) {
        throw new Conflicto(CodigoError.STOCK_INSUFFICIENT, `Existencias insuficientes para el producto ${item.productId}`);
      }
    }
    await this.repo.crearReservas(orderId, ordenados, venceEn);
  }

  /** Pago aprobado: las existencias quedan vendidas definitivamente. */
  async confirmarReserva(orderId: string): Promise<void> {
    for (const r of await this.repo.reservasDe(orderId, ReservationStatus.ACTIVA)) {
      await this.repo.transicionarReserva(r.id, ReservationStatus.ACTIVA, ReservationStatus.CONFIRMADA);
    }
  }

  /** Pago rechazado, cancelación o vencimiento: devuelve al stock solo lo que siga reservado. */
  async liberarReserva(orderId: string): Promise<string[]> {
    return this.devolver(orderId, ReservationStatus.ACTIVA);
  }

  /** Reembolso de un pedido pagado: devuelve lo ya confirmado. */
  async reponerVendido(orderId: string): Promise<string[]> {
    return this.devolver(orderId, ReservationStatus.CONFIRMADA);
  }

  async consultaDisponibilidad(productId: string): Promise<number> {
    const stock = await this.repo.existencias(productId);
    if (stock === null) throw new NoEncontrado('producto', productId);
    return stock;
  }

  pedidosConReservasVencidas(limite = 50): Promise<string[]> {
    return this.repo.pedidosConReservasVencidas(new Date(), limite);
  }

  /** CU-09 Gestionar inventario: el vendedor fija las existencias de sus productos. */
  async ajustarExistencias(usuario: UsuarioAutenticado, productId: string, cantidad: number): Promise<number> {
    const producto = await this.productos.uno(productId);
    if (!producto) throw new NoEncontrado('producto', productId);
    PoliticaPropiedadProducto.exigir(usuario, { sellerId: producto.vendedorId });
    const stock = await this.repo.fijarExistencias(productId, cantidad);
    this.notificarCambio([productId]);
    return stock;
  }

  notificarCambio(productIds: string[]): void {
    if (productIds.length) this.bus.publicar(EVENTOS.EXISTENCIAS_CAMBIADAS, { productIds });
  }

  private devolver(orderId: string, desde: ReservationStatus): Promise<string[]> {
    return this.uow.ejecutar(async () => {
      const devueltos: string[] = [];
      for (const r of await this.repo.reservasDe(orderId, desde)) {
        if (await this.repo.transicionarReserva(r.id, desde, ReservationStatus.LIBERADA)) {
          await this.repo.reponer(r.productId, r.quantity);
          devueltos.push(r.productId);
        }
      }
      return devueltos;
    });
  }
}
