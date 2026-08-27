import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { AuthUser, CurrentUser } from '../../shared/auth/current-user.decorator';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { UserRole } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

@ApiTags('orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  mine(@CurrentUser() user: AuthUser, @Query('page') page?: number, @Query('size') size?: number) {
    return this.orders.mine(user.userId, page, size);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
  @Get('sold')
  sold(@CurrentUser() user: AuthUser, @Query('page') page?: number, @Query('size') size?: number) {
    return this.orders.sold(user.userId, page, size);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.get(user, id);
  }

  @Put(':id/status')
  status(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.orders.updateStatus(user, id, dto.status);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.cancel(user, id);
  }
}
