import { esSuperadmin, UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { Prohibido } from '../../../compartido/errores/error-api';

/**
 * Verificación de propiedad del recurso (RI-07): tener el rol VENDEDOR no basta,
 * el producto debe pertenecer al vendedor autenticado. El superadmin queda exento.
 */
export const PoliticaPropiedadProducto = {
  exigir(usuario: UsuarioAutenticado, producto: { sellerId: string }): void {
    if (producto.sellerId !== usuario.userId && !esSuperadmin(usuario)) {
      throw new Prohibido('El producto pertenece a otro vendedor');
    }
  },
};
