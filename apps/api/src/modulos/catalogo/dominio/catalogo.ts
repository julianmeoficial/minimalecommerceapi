export enum OrdenCatalogo {
  RECIENTES = 'recientes',
  PRECIO_ASC = 'precio_asc',
  PRECIO_DESC = 'precio_desc',
  NOMBRE = 'nombre',
}

export interface CriteriosCatalogo {
  q?: string;
  categoriaId?: string;
  vendedorId?: string;
  precioMin?: number;
  precioMax?: number;
  disponible?: boolean;
  preventa?: boolean;
  orden: OrdenCatalogo;
  pagina: number;
  tamano: number;
}

export interface ProductoVista {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  existencias: number;
  disponible: boolean;
  imagenUrl: string | null;
  categoria: { id: string; nombre: string };
  vendedor: { id: string; nombre: string };
  preventa: boolean;
  activo: boolean;
  creadoEn: string;
}

/** Normaliza los criterios para que consultas equivalentes compartan la misma entrada de caché. */
export function claveCriterios(c: CriteriosCatalogo): string {
  const normal = {
    q: c.q?.trim().toLowerCase() || undefined,
    cat: c.categoriaId,
    ven: c.vendedorId,
    min: c.precioMin,
    max: c.precioMax,
    disp: c.disponible,
    pre: c.preventa,
    o: c.orden,
    p: c.pagina,
    t: c.tamano,
  };
  return JSON.stringify(normal);
}
