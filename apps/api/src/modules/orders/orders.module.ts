import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutService } from './checkout.service';
import { OrdersController } from './orders.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { ComplementsModule } from '../complements/complements.module';

@Module({
  imports: [InventoryModule, forwardRef(() => ComplementsModule)],
  controllers: [OrdersController],
  providers: [OrdersService, CheckoutService],
  exports: [OrdersService, CheckoutService],
})
export class OrdersModule {}
