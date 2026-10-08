import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RepositorioUsuarios } from '../datos/repositorio-usuarios';

export interface Contacto {
  id: string;
  nombre: string;
  email: string;
}

/** Interfaz publicada del módulo para que otros módulos lean datos de contacto sin acceder a su tabla. */
@Injectable()
export class ConsultaUsuariosService {
  constructor(private readonly usuarios: RepositorioUsuarios) {}

  async contactos(ids: string[]): Promise<Contacto[]> {
    if (!ids.length) return [];
    return (await this.usuarios.porIds([...new Set(ids)])).map((u) => ({ id: u.id, nombre: u.name, email: u.email }));
  }

  idsSuperadmin(): Promise<string[]> {
    return this.usuarios.idsPorRol(UserRole.SUPERADMIN);
  }

  async contarPorRol(): Promise<Record<UserRole, number>> {
    const conteo = { COMPRADOR: 0, VENDEDOR: 0, SUPERADMIN: 0 } as Record<UserRole, number>;
    for (const rol of Object.values(UserRole)) {
      const [, total] = await this.usuarios.listar({ role: rol }, 0, 1);
      conteo[rol] = total;
    }
    return conteo;
  }
}
