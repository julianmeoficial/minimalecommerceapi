import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MEDIA_STORE } from './media-store';
import { LocalMediaStore } from './local-media.store';
import { SupabaseMediaStore } from './supabase-media.store';

@Global()
@Module({
  providers: [
    {
      provide: MEDIA_STORE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const driver = config.get<string>('MEDIA_DRIVER') || 'local';
        return driver === 'supabase'
          ? new SupabaseMediaStore(config)
          : new LocalMediaStore(config);
      },
    },
  ],
  exports: [MEDIA_STORE],
})
export class MediaModule {}
