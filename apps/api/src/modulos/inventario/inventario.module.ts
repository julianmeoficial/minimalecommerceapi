import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { InventarioService } from './aplicacion/inventario.service';
import { RepositorioInventario, RepositorioInventarioPrisma } from './datos/repositorio-inventario';
import { InventarioController } from './exposicion/inventario.controller';

@Module({
  imports: [CatalogoModule],
  controllers: [InventarioController],
  providers: [InventarioService, { provide: RepositorioInventario, useClass: RepositorioInventarioPrisma }],
  exports: [InventarioService],
})
export class InventarioModule {}
