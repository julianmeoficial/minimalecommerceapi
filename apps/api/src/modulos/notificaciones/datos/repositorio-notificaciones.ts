import { Injectable } from '@nestjs/common';
import { Notification, NotificationType } from '@prisma/client';
import { PrismaService } from '../../../compartido/prisma/prisma.service';

export abstract class RepositorioNotificaciones {
  abstract crear(userId: string, tipo: NotificationType, titulo: string, mensaje?: string): Promise<Notification>;
  abstract listar(userId: string, skip: number, take: number): Promise<[Notification[], number]>;
  abstract marcarLeida(userId: string, id: string): Promise<boolean>;
}

@Injectable()
export class RepositorioNotificacionesPrisma extends RepositorioNotificaciones {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  crear(userId: string, tipo: NotificationType, titulo: string, mensaje?: string) {
    return this.prisma.notification.create({ data: { userId, type: tipo, title: titulo, message: mensaje } });
  }

  listar(userId: string, skip: number, take: number) {
    return Promise.all([
      this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
  }

  async marcarLeida(userId: string, id: string) {
    const r = await this.prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
    return r.count === 1;
  }
}
