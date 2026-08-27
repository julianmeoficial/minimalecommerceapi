import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CheckoutService } from '../orders/checkout.service';
import { AddCartItemDto, CheckoutDto, UpdateCartItemDto } from './dto/cart.dto';
import { AuthUser, CurrentUser } from '../../shared/auth/current-user.decorator';

@ApiTags('cart')
@ApiBearerAuth()
@Controller({ path: 'cart', version: '1' })
export class CartController {
  constructor(
    private readonly cart: CartService,
    private readonly checkoutService: CheckoutService,
  ) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.cart.get(user.userId);
  }

  @Post('items')
  add(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto) {
    return this.cart.add(user.userId, dto);
  }

  @Put('items/:itemId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateQuantity(user.userId, itemId, dto.quantity);
  }

  @Delete('items/:itemId')
  remove(@CurrentUser() user: AuthUser, @Param('itemId') itemId: string) {
    return this.cart.remove(user.userId, itemId);
  }

  @Delete()
  clear(@CurrentUser() user: AuthUser) {
    return this.cart.clear(user.userId);
  }

  @Post('checkout')
  checkout(
    @CurrentUser() user: AuthUser,
    @Body() dto: CheckoutDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.checkoutService.checkout(user.userId, dto, idempotencyKey);
  }
}
