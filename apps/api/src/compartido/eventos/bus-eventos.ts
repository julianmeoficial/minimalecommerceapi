import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';

/** Publica eventos internos adjuntando el identificador de correlación de la petición o del trabajo en curso. */
@Injectable()
export class BusEventos {
  constructor(
    private readonly emitter: EventEmitter2,
    private readonly cls: ClsService,
  ) {}

  publicar<T extends object>(nombre: string, evento: T): void {
    const correlationId = this.cls.isActive() ? this.cls.getId() : undefined;
    this.emitter.emit(nombre, { correlationId, ...evento });
  }
}
