import { Injectable, Logger } from '@nestjs/common';
import { EnviadorCorreo, MensajeCorreo } from './enviador-correo';

@Injectable()
export class EnviadorConsola extends EnviadorCorreo {
  private readonly logger = new Logger(EnviadorConsola.name);

  async enviar(mensaje: MensajeCorreo): Promise<void> {
    this.logger.log(`[correo] ${mensaje.para} — ${mensaje.asunto}: ${mensaje.texto}`);
  }
}
