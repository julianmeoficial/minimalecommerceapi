import { Injectable } from '@nestjs/common';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { ErrorApi, NoEncontrado } from '../../../compartido/errores/error-api';
import { UnidadDeTrabajo } from '../../../compartido/prisma/persistencia';
import { NuevaDireccion, RepositorioDirecciones } from '../datos/repositorio-direcciones';
import { RepositorioUsuarios } from '../datos/repositorio-usuarios';

@Injectable()
export class PerfilService {
  constructor(
    private readonly usuarios: RepositorioUsuarios,
    private readonly direcciones: RepositorioDirecciones,
    private readonly uow: UnidadDeTrabajo,
  ) {}

  async obtener(userId: string) {
    const u = await this.usuarios.porId(userId);
    if (!u?.active) throw new NoEncontrado('usuario', userId);
    return u;
  }

  actualizar(userId: string, datos: { nombre?: string; telefono?: string }) {
    return this.usuarios.actualizar(userId, { name: datos.nombre, phone: datos.telefono });
  }

  listarDirecciones(userId: string) {
    return this.direcciones.activasDe(userId);
  }

  crearDireccion(userId: string, datos: NuevaDireccion) {
    return this.uow.ejecutar(async () => {
      if (datos.primaryAddress) await this.direcciones.desmarcarPrincipal(userId);
      return this.direcciones.crear(userId, datos);
    });
  }

  async eliminarDireccion(userId: string, id: string) {
    const d = await this.direcciones.activaDe(userId, id);
    if (!d) throw new NoEncontrado('dirección', id);
    await this.direcciones.desactivar(id);
  }

  /** Usado por Pedidos en el checkout: solo acepta direcciones propias del comprador. */
  async resolverEnvio(userId: string, addressId?: string, texto?: string): Promise<string> {
    if (addressId) {
      const d = await this.direcciones.activaDe(userId, addressId);
      if (!d) throw new NoEncontrado('dirección', addressId);
      return [d.fullAddress, d.city, d.postalCode].filter(Boolean).join(', ');
    }
    if (texto?.trim()) return texto.trim();
    throw new ErrorApi(CodigoError.ADDRESS_REQUIRED, 'Indica una dirección de entrega', 400, ['direccionId', 'direccionEnvio']);
  }
}
