import { Module } from '@nestjs/common';
import { CacheCatalogo } from './aplicacion/cache-catalogo';
import { CategoriasService } from './aplicacion/categorias.service';
import { ConsultaCatalogoService } from './aplicacion/consulta-catalogo.service';
import { ConsultaProductosService } from './aplicacion/consulta-productos.service';
import { GestionProductosService } from './aplicacion/gestion-productos.service';
import { ConstructorVistaProducto } from './aplicacion/vista-producto';
import { RepositorioCategorias, RepositorioCategoriasPrisma } from './datos/repositorio-categorias';
import { RepositorioProductos, RepositorioProductosPrisma } from './datos/repositorio-productos';
import { AdminCategoriasController } from './exposicion/admin-categorias.controller';
import { CatalogoController } from './exposicion/catalogo.controller';
import { VendedorProductosController } from './exposicion/vendedor-productos.controller';

@Module({
  controllers: [CatalogoController, VendedorProductosController, AdminCategoriasController],
  providers: [
    ConsultaCatalogoService,
    GestionProductosService,
    CategoriasService,
    ConsultaProductosService,
    CacheCatalogo,
    ConstructorVistaProducto,
    { provide: RepositorioProductos, useClass: RepositorioProductosPrisma },
    { provide: RepositorioCategorias, useClass: RepositorioCategoriasPrisma },
  ],
  exports: [ConsultaProductosService, ConsultaCatalogoService, CacheCatalogo],
})
export class CatalogoModule {}
