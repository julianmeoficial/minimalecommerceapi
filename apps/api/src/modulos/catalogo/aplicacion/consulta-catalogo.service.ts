import { Injectable } from '@nestjs/common';
import { NoEncontrado } from '../../../compartido/errores/error-api';
import { construirPagina, Pagina } from '../../../compartido/paginacion/paginacion';
import { RepositorioProductos } from '../datos/repositorio-productos';
import { claveCriterios, CriteriosCatalogo, ProductoVista } from '../dominio/catalogo';
import { CacheCatalogo } from './cache-catalogo';
import { ConstructorVistaProducto } from './vista-producto';

/** ServicioConsultaCatalogo del TCC (CU-01): consulta paginada con caché de consultas. */
@Injectable()
export class ConsultaCatalogoService {
  constructor(
    private readonly productos: RepositorioProductos,
    private readonly cache: CacheCatalogo,
    private readonly vista: ConstructorVistaProducto,
  ) {}

  async consultaCatalogo(criterios: CriteriosCatalogo): Promise<Pagina<ProductoVista>> {
    const clave = claveCriterios(criterios);
    const cacheada = await this.cache.obtenerLista(clave);
    if (cacheada) return cacheada;

    const [filas, total] = await this.productos.buscar(criterios);
    const pagina = construirPagina(await this.vista.construirVarios(filas), total, criterios.pagina, criterios.tamano);
    await this.cache.guardarLista(clave, pagina);
    return pagina;
  }

  async detalle(id: string): Promise<ProductoVista> {
    const cacheado = await this.cache.obtenerDetalle(id);
    if (cacheado) return cacheado;
    const p = await this.productos.porId(id);
    if (!p?.active) throw new NoEncontrado('producto', id);
    const vista = await this.vista.construir(p);
    await this.cache.guardarDetalle(vista);
    return vista;
  }
}
