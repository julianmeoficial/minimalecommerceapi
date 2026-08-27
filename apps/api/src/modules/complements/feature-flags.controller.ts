import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsBoolean, IsString, MinLength } from 'class-validator';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { FeatureFlagsService } from './feature-flags.service';

class UpsertFlagDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  key!: string;

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}

@ApiTags('feature-flags')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.SUPERADMIN)
@Controller({ path: 'feature-flags', version: '1' })
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get()
  list() {
    return this.flags.list();
  }

  @Put()
  upsert(@Body() dto: UpsertFlagDto) {
    return this.flags.upsert(dto.key, dto.enabled);
  }
}
