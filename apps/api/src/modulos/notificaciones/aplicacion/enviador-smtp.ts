import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { EnviadorCorreo, MensajeCorreo } from './enviador-correo';

@Injectable()
export class EnviadorSmtp extends EnviadorCorreo {
  private readonly transport: Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    super();
    const host = config.get<string>('SMTP_HOST');
    this.from = config.get<string>('SMTP_FROM') ?? 'MinimalShop <no-reply@minimalshop.local>';
    this.transport = host
      ? nodemailer.createTransport({
          host,
          port: Number(config.get('SMTP_PORT') ?? 1025),
          auth: config.get('SMTP_USER')
            ? { user: config.get<string>('SMTP_USER'), pass: config.get<string>('SMTP_PASSWORD') }
            : undefined,
        })
      : null;
  }

  async enviar(mensaje: MensajeCorreo): Promise<void> {
    if (!this.transport) return;
    await this.transport.sendMail({ from: this.from, to: mensaje.para, subject: mensaje.asunto, text: mensaje.texto });
  }
}
