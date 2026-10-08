import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { Prohibido } from '../../../compartido/errores/error-api';
import { RepositorioContenido } from '../datos/repositorio-contenido';

@Injectable()
export class ContenidoService {
  constructor(private readonly repo: RepositorioContenido) {}

  publicaciones(pagina: number, tamano: number) {
    return this.repo.publicaciones(pagina * tamano, tamano);
  }

  eventos(pagina: number, tamano: number) {
    return this.repo.eventosActivos(pagina * tamano, tamano);
  }

  crearPublicacion(usuario: UsuarioAutenticado, datos: { titulo: string; resumen?: string; cuerpo?: string }) {
    this.exigirEditor(usuario);
    return this.repo.crearPublicacion({
      authorId: usuario.userId,
      categoryId: null,
      title: datos.titulo,
      summary: datos.resumen ?? null,
      body: datos.cuerpo ?? null,
      imageUrl: null,
      published: true,
      publishedAt: new Date(),
    });
  }

  crearEvento(
    usuario: UsuarioAutenticado,
    datos: { titulo: string; descripcion?: string; iniciaEn: Date; terminaEn?: Date; ubicacion?: string },
  ) {
    this.exigirEditor(usuario);
    return this.repo.crearEvento({
      organizerId: usuario.userId,
      title: datos.titulo,
      description: datos.descripcion ?? null,
      startsAt: datos.iniciaEn,
      endsAt: datos.terminaEn ?? null,
      location: datos.ubicacion ?? null,
      imageUrl: null,
      active: true,
    });
  }

  private exigirEditor(u: UsuarioAutenticado) {
    if (u.role !== UserRole.VENDEDOR && u.role !== UserRole.SUPERADMIN) {
      throw new Prohibido('Solo vendedores o administradores pueden publicar contenido');
    }
  }
}
