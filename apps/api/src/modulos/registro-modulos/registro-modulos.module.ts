import { Global, Module } from '@nestjs/common';
import { RegistroModulosService } from './aplicacion/registro-modulos.service';
import { RepositorioModulos, RepositorioModulosPrisma } from './datos/repositorio-modulos';
import { ModulosController } from './exposicion/modulos.controller';
import { ModuloActivoGuard } from './exposicion/requiere-modulo';

@Global()
@Module({
  controllers: [ModulosController],
  providers: [
    RegistroModulosService,
    ModuloActivoGuard,
    { provide: RepositorioModulos, useClass: RepositorioModulosPrisma },
  ],
  exports: [RegistroModulosService, ModuloActivoGuard],
})
export class RegistroModulosModule {}
