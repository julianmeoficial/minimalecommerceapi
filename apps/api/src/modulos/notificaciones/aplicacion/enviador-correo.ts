export interface MensajeCorreo {
  para: string;
  asunto: string;
  texto: string;
}

export abstract class EnviadorCorreo {
  abstract enviar(mensaje: MensajeCorreo): Promise<void>;
}
