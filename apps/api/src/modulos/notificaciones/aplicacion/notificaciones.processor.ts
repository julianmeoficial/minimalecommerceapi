import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EnviadorConsola } from './enviador-consola';
import { EnviadorCorreo } from './enviador-correo';
import { EnviadorSmtp } from './enviador-smtp';
import { COLA_NOTIFICACIONES, NotificacionesService, TRABAJO_CORREO } from './notificaciones.service';

@Processor(COLA_NOTIFICACIONES)
export class NotificacionesProcessor extends WorkerHost {
  constructor(
    private readonly notificaciones: NotificacionesService,
    private readonly smtp: EnviadorSmtp,
    private readonly consola: EnviadorConsola,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === TRABAJO_CORREO) {
      return this.notificaciones.procesarTrabajo(job.data as { tipo: string; evento: never });
    }
    if (job.name === 'enviar-correo') {
      const mensaje = job.data as { para: string; asunto: string; texto: string };
      try {
        await this.smtp.enviar(mensaje);
      } catch {
        await this.consola.enviar(mensaje);
      }
    }
  }
}
