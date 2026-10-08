import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Pagina } from '../../../compartido/paginacion/paginacion';
import { ProductoVista } from '../dominio/catalogo';

const CLAVE_VERSION = 'catalogo:version';
const TTL_LISTA_MS = 30_000;
const TTL_DETALLE_MS = 60_000;

/**
 * Política de invalidación (RI-02): los listados se guardan bajo un espacio de nombres
 * versionado. Al publicar, editar o despublicar un producto se cambia la versión y todas
 * las páginas anteriores quedan inalcanzables (expiran solas por TTL), sin recorrer claves.
 * El detalle de cada producto tiene su propia clave y se borra puntualmente.
 */
@Injectable()
export class CacheCatalogo {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  private async version(): Promise<string> {
    return (await this.cache.get<string>(CLAVE_VERSION)) ?? '0';
  }

  async obtenerLista(clave: string): Promise<Pagina<ProductoVista> | undefined> {
    return (await this.cache.get<Pagina<ProductoVista>>(`catalogo:v${await this.version()}:lista:${clave}`)) ?? undefined;
  }

  async guardarLista(clave: string, pagina: Pagina<ProductoVista>): Promise<void> {
    await this.cache.set(`catalogo:v${await this.version()}:lista:${clave}`, pagina, TTL_LISTA_MS);
  }

  async obtenerDetalle(id: string): Promise<ProductoVista | undefined> {
    return (await this.cache.get<ProductoVista>(`catalogo:producto:${id}`)) ?? undefined;
  }

  async guardarDetalle(p: ProductoVista): Promise<void> {
    await this.cache.set(`catalogo:producto:${p.id}`, p, TTL_DETALLE_MS);
  }

  /** Cambio en los datos publicados: nueva versión de listados y fuera el detalle. */
  async invalidarProducto(id: string): Promise<void> {
    await Promise.all([
      this.cache.set(CLAVE_VERSION, `${Date.now()}`),
      this.cache.del(`catalogo:producto:${id}`),
    ]);
  }

  /** Cambio solo de existencias: los listados toleran 30 s de desfase, el detalle no. */
  async invalidarDetalles(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.cache.del(`catalogo:producto:${id}`)));
  }

  async invalidarTodo(): Promise<void> {
    await this.cache.set(CLAVE_VERSION, `${Date.now()}`);
  }
}
