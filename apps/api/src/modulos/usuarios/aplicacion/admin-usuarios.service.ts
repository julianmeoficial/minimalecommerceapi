import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, NoEncontrado } from '../../../compartido/errores/error-api';
import { UnidadDeTrabajo } from '../../../compartido/prisma/persistencia';
import { RepositorioRefreshTokens } from '../datos/repositorio-refresh-tokens';
import { RepositorioUsuarios } from '../datos/repositorio-usuarios';

@Injectable()
export class AdminUsuariosService {
  constructor(
    private readonly usuarios: RepositorioUsuarios,
    private readonly tokens: RepositorioRefreshTokens,
    private readonly uow: UnidadDeTrabajo,
  ) {}

  listar(filtro: { role?: UserRole; q?: string }, pagina: number, tamano: number) {
    return this.usuarios.listar(filtro, pagina * tamano, tamano);
  }

  async administrar(admin: UsuarioAutenticado, id: string, cambios: { rol?: UserRole; activo?: boolean }) {
    if (admin.userId === id) {
      throw new Conflicto(CodigoError.CONFLICT, 'No puedes cambiar tu propio rol ni desactivarte');
    }
    if (!(await this.usuarios.porId(id))) throw new NoEncontrado('usuario', id);
    return this.uow.ejecutar(async () => {
      const u = await this.usuarios.actualizar(id, { role: cambios.rol, active: cambios.activo });
      // Un cambio de rol o una baja invalida las sesiones abiertas para que el nuevo permiso aplique ya.
      await this.tokens.revocarDeUsuario(id);
      return u;
    });
  }
}
