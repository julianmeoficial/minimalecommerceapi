import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlmacenLocal } from './almacen-local';
import { AlmacenMedios } from './almacen-medios';
import { AlmacenSupabase } from './almacen-supabase';
import { MediosController } from './medios.controller';

@Global()
@Module({
  controllers: [MediosController],
  providers: [
    AlmacenLocal,
    {
      provide: AlmacenMedios,
      inject: [ConfigService, AlmacenLocal],
      useFactory: (config: ConfigService, local: AlmacenLocal) =>
        config.get<string>('MEDIA_DRIVER') === 'supabase' ? new AlmacenSupabase(config) : local,
    },
  ],
  exports: [AlmacenMedios],
})
export class MediaModule {}
