/** True si la clave de imagen es una URL absoluta (p. ej. Unsplash en seed), no una clave de storage. */
export function esUrlExterna(clave: string): boolean {
  return /^https?:\/\//i.test(clave);
}
