import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { RegistroModulosModule } from '../registro-modulos/registro-modulos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { EnviadorConsola } from './aplicacion/enviador-consola';
import { EnviadorCorreo } from './aplicacion/enviador-correo';
import { EnviadorSmtp } from './aplicacion/enviador-smtp';
import { COLA_NOTIFICACIONES, NotificacionesService } from './aplicacion/notificaciones.service';
import { NotificacionesProcessor } from './aplicacion/notificaciones.processor';
import { RepositorioNotificaciones, RepositorioNotificacionesPrisma } from './datos/repositorio-notificaciones';
import { NotificacionesController } from './exposicion/notificaciones.controller';

@Module({
  imports: [BullModule.registerQueue({ name: COLA_NOTIFICACIONES }), RegistroModulosModule, UsuariosModule],
  controllers: [NotificacionesController],
  providers: [
    NotificacionesService,
    NotificacionesProcessor,
    EnviadorConsola,
    EnviadorSmtp,
    { provide: EnviadorCorreo, useExisting: EnviadorSmtp },
    { provide: RepositorioNotificaciones, useClass: RepositorioNotificacionesPrisma },
  ],
})
export class NotificacionesModule {}
