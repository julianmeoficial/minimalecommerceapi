import { UserRole } from '@prisma/client';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { PoliticaPropiedadPedido } from './politica-propiedad-pedido';

const u = (role: UserRole, id: string): UsuarioAutenticado =>
  Object.assign(new UsuarioAutenticado(), { userId: id, email: 'x@test.com', role });

describe('PoliticaPropiedadPedido', () => {
  const pedido = { buyerId: 'buyer-1', items: [{ sellerId: 'seller-1' }, { sellerId: 'seller-2' }] };

  it('identifica al comprador', () => {
    expect(PoliticaPropiedadPedido.actorPara(u(UserRole.COMPRADOR, 'buyer-1'), pedido)).toBe('COMPRADOR');
  });

  it('identifica al vendedor con ítems propios', () => {
    expect(PoliticaPropiedadPedido.actorPara(u(UserRole.VENDEDOR, 'seller-2'), pedido)).toBe('VENDEDOR');
  });

  it('rechaza vendedor sin ítems en el pedido', () => {
    expect(PoliticaPropiedadPedido.actorPara(u(UserRole.VENDEDOR, 'otro'), pedido)).toBeNull();
  });
});
