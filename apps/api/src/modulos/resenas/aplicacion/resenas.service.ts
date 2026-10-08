import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsuarioAutenticado, esSuperadmin } from '../../../compartido/auth/usuario-autenticado';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, ErrorApi, NoEncontrado, Prohibido } from '../../../compartido/errores/error-api';
import { ConsultaProductosService } from '../../catalogo/aplicacion/consulta-productos.service';
import { CompraPedidoService } from '../../pedidos/aplicacion/compra-pedido.service';
import { RepositorioResenas } from '../datos/repositorio-resenas';

@Injectable()
export class ResenasService {
  constructor(
    private readonly repo: RepositorioResenas,
    private readonly productos: ConsultaProductosService,
    private readonly pedidos: CompraPedidoService,
  ) {}

  listarProducto(productId: string, pagina: number, tamano: number) {
    return this.repo.deProducto(productId, pagina * tamano, tamano);
  }

  async crear(usuario: UsuarioAutenticado, datos: { productoId: string; puntuacion: number; comentario?: string }) {
    if (usuario.role !== UserRole.COMPRADOR) throw new Prohibido('Solo compradores pueden reseñar');
    if (datos.puntuacion < 1 || datos.puntuacion > 5) {
      throw new ErrorApi(CodigoError.VALIDATION_ERROR, 'La puntuación debe estar entre 1 y 5');
    }
    const producto = await this.productos.uno(datos.productoId);
    if (!producto?.activo) throw new NoEncontrado('producto', datos.productoId);
    if (await this.repo.existe(usuario.userId, datos.productoId)) {
      throw new Conflicto(CodigoError.REVIEW_EXISTS, 'Ya reseñaste este producto');
    }
    const entregado = await this.pedidos.compradoYEntregado(usuario.userId, datos.productoId);
    if (!entregado) throw new Conflicto(CodigoError.REVIEW_NOT_ALLOWED, 'Solo puedes reseñar productos de pedidos entregados');

    return this.repo.crear({
      authorId: usuario.userId,
      productId: datos.productoId,
      sellerId: producto.vendedorId,
      rating: datos.puntuacion,
      comment: datos.comentario,
      verified: true,
    });
  }

  async eliminar(usuario: UsuarioAutenticado, id: string) {
    const resena = await this.repo.porId(id);
    if (!resena) throw new NoEncontrado('reseña', id);
    if (!esSuperadmin(usuario) && resena.authorId !== usuario.userId) {
      throw new Prohibido('No puedes eliminar esta reseña');
    }
    await this.repo.eliminar(id);
  }
}
