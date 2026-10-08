import { Global, Module } from '@nestjs/common';
import { BusEventos } from './bus-eventos';

@Global()
@Module({
  providers: [BusEventos],
  exports: [BusEventos],
})
export class EventosModule {}
