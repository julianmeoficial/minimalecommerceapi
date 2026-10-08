import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { CarritoService } from './aplicacion/carrito.service';
import { RepositorioCarrito, RepositorioCarritoPrisma } from './datos/repositorio-carrito';
import { CarritoController } from './exposicion/carrito.controller';

@Module({
  imports: [CatalogoModule],
  controllers: [CarritoController],
  providers: [CarritoService, { provide: RepositorioCarrito, useClass: RepositorioCarritoPrisma }],
  exports: [CarritoService],
})
export class CarritoModule {}
