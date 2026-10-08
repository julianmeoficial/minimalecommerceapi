import { Injectable } from '@nestjs/common';
import { ConsultaCatalogoService } from '../../catalogo/aplicacion/consulta-catalogo.service';
import { ConsultaProductosService } from '../../catalogo/aplicacion/consulta-productos.service';
import { NoEncontrado } from '../../../compartido/errores/error-api';
import { RepositorioFavoritos } from '../datos/repositorio-favoritos';

@Injectable()
export class FavoritosService {
  constructor(
    private readonly repo: RepositorioFavoritos,
    private readonly productos: ConsultaProductosService,
    private readonly catalogo: ConsultaCatalogoService,
  ) {}

  async listar(userId: string) {
    const favs = await this.repo.listar(userId);
    const vistas = [];
    for (const f of favs) {
      try {
        vistas.push(await this.catalogo.detalle(f.productId));
      } catch {
        /* producto despublicado o eliminado */
      }
    }
    return vistas;
  }

  async agregar(userId: string, productId: string) {
    if (!(await this.productos.uno(productId))) throw new NoEncontrado('producto', productId);
    await this.repo.agregar(userId, productId);
    return { productoId: productId };
  }

  quitar(userId: string, productId: string) {
    return this.repo.quitar(userId, productId);
  }
}
