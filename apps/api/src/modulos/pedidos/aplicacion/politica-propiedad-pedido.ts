import { UserRole } from '@prisma/client';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { Prohibido } from '../../../compartido/errores/error-api';
import { Actor } from '../dominio/maquina-estados';

interface PedidoConItems {
  buyerId: string;
  items: { sellerId: string }[];
}

/**
 * Propiedad del pedido (RI-07): el comprador solo ve los suyos y el vendedor solo los
 * que contienen productos propios. Devuelve el actor con el que se evalúan las transiciones.
 */
export const PoliticaPropiedadPedido = {
  actorPara(usuario: UsuarioAutenticado, pedido: PedidoConItems): Actor | null {
    if (usuario.role === UserRole.SUPERADMIN) return 'SUPERADMIN';
    if (usuario.role === UserRole.COMPRADOR && pedido.buyerId === usuario.userId) return 'COMPRADOR';
    if (usuario.role === UserRole.VENDEDOR && pedido.items.some((i) => i.sellerId === usuario.userId)) return 'VENDEDOR';
    return null;
  },

  exigir(usuario: UsuarioAutenticado, pedido: PedidoConItems): Actor {
    const actor = this.actorPara(usuario, pedido);
    if (!actor) throw new Prohibido('El pedido no te pertenece');
    return actor;
  },
};
