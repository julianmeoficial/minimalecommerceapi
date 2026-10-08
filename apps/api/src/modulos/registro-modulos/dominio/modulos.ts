/** Módulos complementarios que el superadmin puede activar o desactivar en operación (CU-12). */
export const MODULOS_ACTIVABLES = ['cupones', 'resenas', 'favoritos', 'contenido', 'notificaciones'] as const;

export type ClaveModulo = (typeof MODULOS_ACTIVABLES)[number];

export const esClaveModulo = (v: string): v is ClaveModulo =>
  (MODULOS_ACTIVABLES as readonly string[]).includes(v);
