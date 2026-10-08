import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { NoEncontrado } from '../../../compartido/errores/error-api';
import { EVENTOS } from '../../../compartido/eventos/eventos-pedido';
import type { ExistenciasCambiadas } from '../../../compartido/eventos/eventos-pedido';
import { AlmacenMedios } from '../../../compartido/media/almacen-medios';
import { validarImagen } from '../../../compartido/media/validar-imagen';
import { RepositorioCategorias } from '../datos/repositorio-categorias';
import { DatosProducto, RepositorioProductos } from '../datos/repositorio-productos';
import { ProductoVista } from '../dominio/catalogo';
import { CacheCatalogo } from './cache-catalogo';
import { PoliticaPropiedadProducto } from './politica-propiedad-producto';
import { ConstructorVistaProducto } from './vista-producto';

/** CU-08 Publicar y editar productos. */
@Injectable()
export class GestionProductosService {
  constructor(
    private readonly productos: RepositorioProductos,
    private readonly categorias: RepositorioCategorias,
    private readonly medios: AlmacenMedios,
    private readonly cache: CacheCatalogo,
    private readonly vista: ConstructorVistaProducto,
  ) {}

  async misProductos(usuario: UsuarioAutenticado, pagina: number, tamano: number): Promise<[ProductoVista[], number]> {
    const [filas, total] = await this.productos.deVendedor(usuario.userId, pagina * tamano, tamano);
    return [await this.vista.construirVarios(filas), total];
  }

  async crear(usuario: UsuarioAutenticado, datos: DatosProducto & { stock: number }): Promise<ProductoVista> {
    await this.exigirCategoria(datos.categoryId);
    const p = await this.productos.crear(usuario.userId, datos);
    await this.cache.invalidarProducto(p.id);
    return this.vista.construir(p);
  }

  async actualizar(usuario: UsuarioAutenticado, id: string, datos: Partial<DatosProducto>): Promise<ProductoVista> {
    await this.propio(usuario, id);
    if (datos.categoryId) await this.exigirCategoria(datos.categoryId);
    const p = await this.productos.actualizar(id, datos);
    await this.cache.invalidarProducto(id);
    return this.vista.construir(p);
  }

  async cambiarPublicacion(usuario: UsuarioAutenticado, id: string, activo: boolean): Promise<ProductoVista> {
    await this.propio(usuario, id);
    const p = await this.productos.actualizar(id, { active: activo });
    await this.cache.invalidarProducto(id);
    return this.vista.construir(p);
  }

  async adjuntarImagen(usuario: UsuarioAutenticado, id: string, buffer: Buffer | undefined): Promise<ProductoVista> {
    const actual = await this.propio(usuario, id);
    const { mime, extension } = validarImagen(buffer);
    const clave = await this.medios.guardar(buffer!, extension, mime);
    const p = await this.productos.actualizar(id, { imageKey: clave });
    if (actual.imageKey) await this.medios.eliminar(actual.imageKey).catch(() => undefined);
    await this.cache.invalidarProducto(id);
    return this.vista.construir(p);
  }

  @OnEvent(EVENTOS.EXISTENCIAS_CAMBIADAS)
  async alCambiarExistencias(evento: ExistenciasCambiadas) {
    await this.cache.invalidarDetalles(evento.productIds);
  }

  private async propio(usuario: UsuarioAutenticado, id: string) {
    const p = await this.productos.porId(id);
    if (!p) throw new NoEncontrado('producto', id);
    PoliticaPropiedadProducto.exigir(usuario, p);
    return p;
  }

  private async exigirCategoria(id: string) {
    if (!(await this.categorias.porId(id))) throw new NoEncontrado('categoría', id);
  }
}
