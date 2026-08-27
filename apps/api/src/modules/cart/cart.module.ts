import { Module, forwardRef } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [InventoryModule, forwardRef(() => OrdersModule)],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
