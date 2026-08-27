import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../shared/auth/current-user.decorator';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller({ path: 'favorites', version: '1' })
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Roles(UserRole.COMPRADOR, UserRole.SUPERADMIN)
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.favorites.list(user.userId);
  }

  @Roles(UserRole.COMPRADOR, UserRole.SUPERADMIN)
  @Post(':productId')
  add(
    @CurrentUser() user: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.favorites.add(user.userId, productId);
  }

  @Roles(UserRole.COMPRADOR, UserRole.SUPERADMIN)
  @Delete(':productId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.favorites.remove(user.userId, productId);
  }
}
