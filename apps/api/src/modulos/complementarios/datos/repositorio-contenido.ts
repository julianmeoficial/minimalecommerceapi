import { Injectable } from '@nestjs/common';
import { BlogPost, Event } from '@prisma/client';
import { PrismaService } from '../../../compartido/prisma/prisma.service';

export abstract class RepositorioContenido {
  abstract publicaciones(skip: number, take: number): Promise<[BlogPost[], number]>;
  abstract eventosActivos(skip: number, take: number): Promise<[Event[], number]>;
  abstract crearPublicacion(datos: Omit<BlogPost, 'id' | 'createdAt'>): Promise<BlogPost>;
  abstract crearEvento(datos: Omit<Event, 'id' | 'createdAt'>): Promise<Event>;
}

@Injectable()
export class RepositorioContenidoPrisma extends RepositorioContenido {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  publicaciones(skip: number, take: number): Promise<[BlogPost[], number]> {
    const where = { published: true };
    return Promise.all([
      this.prisma.blogPost.findMany({ where, orderBy: { publishedAt: 'desc' }, skip, take }),
      this.prisma.blogPost.count({ where }),
    ]);
  }

  eventosActivos(skip: number, take: number): Promise<[Event[], number]> {
    const where = { active: true, startsAt: { gte: new Date() } };
    return Promise.all([
      this.prisma.event.findMany({ where, orderBy: { startsAt: 'asc' }, skip, take }),
      this.prisma.event.count({ where }),
    ]);
  }

  crearPublicacion(datos: Omit<BlogPost, 'id' | 'createdAt'>) {
    return this.prisma.blogPost.create({ data: datos });
  }

  crearEvento(datos: Omit<Event, 'id' | 'createdAt'>) {
    return this.prisma.event.create({ data: datos });
  }
}
