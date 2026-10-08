import { Module } from '@nestjs/common';
import { CarritoModule } from '../carrito/carrito.module';
import { ComplementariosModule } from '../complementarios/complementarios.module';
import { InventarioModule } from '../inventario/inventario.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CicloVidaPedidoService } from './aplicacion/ciclo-vida-pedido.service';
import { CompraPedidoService } from './aplicacion/compra-pedido.service';
import { RepositorioPedidos, RepositorioPedidosPrisma } from './datos/repositorio-pedidos';
import { PedidosController } from './exposicion/pedidos.controller';
import { VendedorPedidosController } from './exposicion/vendedor-pedidos.controller';

@Module({
  imports: [CarritoModule, InventarioModule, UsuariosModule, ComplementariosModule],
  controllers: [PedidosController, VendedorPedidosController],
  providers: [
    CompraPedidoService,
    CicloVidaPedidoService,
    { provide: RepositorioPedidos, useClass: RepositorioPedidosPrisma },
  ],
  exports: [CompraPedidoService, CicloVidaPedidoService],
})
export class PedidosModule {}
