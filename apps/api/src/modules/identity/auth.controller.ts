import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AddressDto, LoginDto, RegisterDto, UpdateProfileDto } from './dto/auth.dto';
import { Public } from '../../shared/auth/public.decorator';
import { CurrentUser, AuthUser } from '../../shared/auth/current-user.decorator';

@ApiTags('auth')
@Controller({ path: '', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('auth/register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('auth/login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.userId);
  }

  @ApiBearerAuth()
  @Put('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.userId, dto);
  }

  @ApiBearerAuth()
  @Get('me/addresses')
  addresses(@CurrentUser() user: AuthUser) {
    return this.auth.listAddresses(user.userId);
  }

  @ApiBearerAuth()
  @Post('me/addresses')
  createAddress(@CurrentUser() user: AuthUser, @Body() dto: AddressDto) {
    return this.auth.createAddress(user.userId, dto);
  }

  @ApiBearerAuth()
  @Delete('me/addresses/:id')
  deleteAddress(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.auth.deleteAddress(user.userId, id);
  }
}
