import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CategoryDto {
  @ApiProperty() @IsString() @MaxLength(50) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class ProductDto {
  @ApiProperty() @IsString() @MaxLength(150) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0.01) price!: number;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) stock!: number;
  @ApiProperty() @IsUUID() categoryId!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() preorder?: boolean;
}
