/** Puerto de almacenamiento de objetos (H-03): las imágenes viven fuera del proceso y del árbol de despliegue. */
export abstract class AlmacenMedios {
  /** Guarda el archivo y devuelve la clave interna (no una URL). */
  abstract guardar(buffer: Buffer, extension: string, contentType: string): Promise<string>;
  abstract eliminar(clave: string): Promise<void>;
  /** URL de lectura temporal para la clave (firmada cuando el proveedor lo permite). */
  abstract urlLectura(clave: string): Promise<string>;
}
