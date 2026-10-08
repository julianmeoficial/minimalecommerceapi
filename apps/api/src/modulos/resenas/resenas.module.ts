import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { RegistroModulosModule } from '../registro-modulos/registro-modulos.module';
import { ResenasService } from './aplicacion/resenas.service';
import { RepositorioResenas, RepositorioResenasPrisma } from './datos/repositorio-resenas';
import { ResenasCatalogoController, ResenasController } from './exposicion/resenas.controller';

@Module({
  imports: [CatalogoModule, PedidosModule, RegistroModulosModule],
  controllers: [ResenasController, ResenasCatalogoController],
  providers: [ResenasService, { provide: RepositorioResenas, useClass: RepositorioResenasPrisma }],
})
export class ResenasModule {}
