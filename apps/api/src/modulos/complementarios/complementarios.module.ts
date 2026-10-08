import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { RegistroModulosModule } from '../registro-modulos/registro-modulos.module';
import { ContenidoService } from './aplicacion/contenido.service';
import { CuponesService } from './aplicacion/cupones.service';
import { FavoritosService } from './aplicacion/favoritos.service';
import { RepositorioContenido, RepositorioContenidoPrisma } from './datos/repositorio-contenido';
import { RepositorioCupones, RepositorioCuponesPrisma } from './datos/repositorio-cupones';
import { RepositorioFavoritos, RepositorioFavoritosPrisma } from './datos/repositorio-favoritos';
import { ContenidoController } from './exposicion/contenido.controller';
import { CuponesPublicoController } from './exposicion/cupones-publico.controller';
import { CuponesVendedorController } from './exposicion/cupones.controller';
import { FavoritosController } from './exposicion/favoritos.controller';

@Module({
  imports: [CatalogoModule, RegistroModulosModule],
  controllers: [CuponesVendedorController, CuponesPublicoController, FavoritosController, ContenidoController],
  providers: [
    CuponesService,
    FavoritosService,
    ContenidoService,
    { provide: RepositorioCupones, useClass: RepositorioCuponesPrisma },
    { provide: RepositorioFavoritos, useClass: RepositorioFavoritosPrisma },
    { provide: RepositorioContenido, useClass: RepositorioContenidoPrisma },
  ],
  exports: [CuponesService],
})
export class ComplementariosModule {}
