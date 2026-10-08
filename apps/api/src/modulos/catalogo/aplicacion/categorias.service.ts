import { Injectable } from '@nestjs/common';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, NoEncontrado } from '../../../compartido/errores/error-api';
import { RepositorioCategorias } from '../datos/repositorio-categorias';
import { CacheCatalogo } from './cache-catalogo';

/** CU-11 (catálogos globales): solo el superadmin crea, renombra o elimina categorías. */
@Injectable()
export class CategoriasService {
  constructor(
    private readonly categorias: RepositorioCategorias,
    private readonly cache: CacheCatalogo,
  ) {}

  listar() {
    return this.categorias.listar();
  }

  async crear(datos: { name: string; description?: string }) {
    if (await this.categorias.porNombre(datos.name)) {
      throw new Conflicto(CodigoError.CATEGORY_EXISTS, 'Ya existe una categoría con ese nombre');
    }
    return this.categorias.crear(datos);
  }

  async actualizar(id: string, datos: { name?: string; description?: string }) {
    if (!(await this.categorias.porId(id))) throw new NoEncontrado('categoría', id);
    if (datos.name) {
      const otra = await this.categorias.porNombre(datos.name);
      if (otra && otra.id !== id) throw new Conflicto(CodigoError.CATEGORY_EXISTS, 'Ya existe una categoría con ese nombre');
    }
    const c = await this.categorias.actualizar(id, datos);
    await this.cache.invalidarTodo();
    return c;
  }

  async eliminar(id: string) {
    if (!(await this.categorias.porId(id))) throw new NoEncontrado('categoría', id);
    if ((await this.categorias.contarProductos(id)) > 0) {
      throw new Conflicto(CodigoError.CATEGORY_IN_USE, 'La categoría tiene productos asociados');
    }
    await this.categorias.eliminar(id);
  }
}
