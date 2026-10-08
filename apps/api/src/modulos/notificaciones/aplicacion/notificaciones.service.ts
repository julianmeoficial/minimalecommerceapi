import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationType } from '@prisma/client';
import { EVENTOS } from '../../../compartido/eventos/eventos-pedido';
import type {
  EstadoPedidoCambiado,
  PedidoCancelado,
  PedidoCreado,
  PedidoPagado,
} from '../../../compartido/eventos/eventos-pedido';
import { RegistroModulosService } from '../../registro-modulos/aplicacion/registro-modulos.service';
import { ConsultaUsuariosService } from '../../usuarios/aplicacion/consulta-usuarios.service';
import { RepositorioNotificaciones } from '../datos/repositorio-notificaciones';

export const COLA_NOTIFICACIONES = 'notificaciones';
export const TRABAJO_CORREO = 'correo-pedido';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly registro: RegistroModulosService,
    private readonly repo: RepositorioNotificaciones,
    private readonly usuarios: ConsultaUsuariosService,
    @InjectQueue(COLA_NOTIFICACIONES) private readonly cola: Queue,
  ) {}

  private async activo(): Promise<boolean> {
    if (!(await this.registro.estaActivo('notificaciones'))) {
      this.logger.debug('Módulo notificaciones desactivado; evento descartado (RI-06)');
      return false;
    }
    return true;
  }

  @OnEvent(EVENTOS.PEDIDO_CREADO)
  async onCreado(e: PedidoCreado & { correlationId?: string }) {
    if (!(await this.activo())) return;
    await this.cola.add(TRABAJO_CORREO, { tipo: 'creado', evento: e });
  }

  @OnEvent(EVENTOS.PEDIDO_PAGADO)
  async onPagado(e: PedidoPagado & { correlationId?: string }) {
    if (!(await this.activo())) return;
    await this.cola.add(TRABAJO_CORREO, { tipo: 'pagado', evento: e });
  }

  @OnEvent(EVENTOS.PEDIDO_CANCELADO)
  async onCancelado(e: PedidoCancelado & { correlationId?: string }) {
    if (!(await this.activo())) return;
    await this.cola.add(TRABAJO_CORREO, { tipo: 'cancelado', evento: e });
  }

  @OnEvent(EVENTOS.ESTADO_PEDIDO_CAMBIADO)
  async onEstado(e: EstadoPedidoCambiado & { correlationId?: string }) {
    if (!(await this.activo())) return;
    await this.cola.add(TRABAJO_CORREO, { tipo: 'estado', evento: e });
  }

  async procesarTrabajo(datos: { tipo: string; evento: PedidoCreado | PedidoPagado | PedidoCancelado | EstadoPedidoCambiado }) {
    const { evento } = datos;
    const contactos = await this.usuarios.contactos([evento.buyerId, ...evento.sellerIds]);
    const comprador = contactos.find((c) => c.id === evento.buyerId);
    const titulo =
      datos.tipo === 'pagado'
        ? 'Pago confirmado'
        : datos.tipo === 'cancelado'
          ? 'Pedido cancelado'
          : datos.tipo === 'estado'
            ? `Pedido ${(evento as EstadoPedidoCambiado).hacia}`
            : 'Pedido registrado';
    const mensaje = `Pedido ${evento.orderId}`;
    await this.repo.crear(evento.buyerId, NotificationType.PEDIDO, titulo, mensaje);
    for (const sellerId of evento.sellerIds) {
      await this.repo.crear(sellerId, NotificationType.PEDIDO, titulo, mensaje);
    }
    if (comprador?.email) {
      await this.cola.add(
        'enviar-correo',
        { para: comprador.email, asunto: titulo, texto: mensaje, correlationId: (evento as { correlationId?: string }).correlationId },
        { attempts: 3 },
      );
    }
  }

  listar(userId: string, pagina: number, tamano: number) {
    return this.repo.listar(userId, pagina * tamano, tamano);
  }

  marcarLeida(userId: string, id: string) {
    return this.repo.marcarLeida(userId, id);
  }
}
