import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../shared/auth/current-user.decorator';
import { Public } from '../../shared/auth/public.decorator';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@ApiTags('coupons')
@Controller({ path: 'coupons', version: '1' })
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.VENDEDOR)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCouponDto) {
    return this.coupons.create(user.userId, dto);
  }

  @Public()
  @Get(':code')
  get(@Param('code') code: string) {
    return this.coupons.getByCode(code);
  }
}
