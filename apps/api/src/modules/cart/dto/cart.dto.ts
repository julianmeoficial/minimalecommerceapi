import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity!: number;
}

export class UpdateCartItemDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity!: number;
}

export class CheckoutDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() addressId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) shippingAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) couponCode?: string;
}
