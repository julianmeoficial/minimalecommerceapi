import {
  BadRequestException,
  Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CategoryDto, ProductDto } from './dto/catalog.dto';
import { Public } from '../../shared/auth/public.decorator';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../shared/auth/current-user.decorator';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { NotFoundError } from '../../shared/errors/api-error';
import { imageUploadOptions } from '../../shared/media/image-upload';

@ApiTags('catalog')
@Controller({ path: '', version: '1' })
export class CatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('categories')
  categories() {
    return this.catalog.listCategories();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
  @Post('categories')
  createCategory(@Body() dto: CategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Public()
  @Get('products')
  search(
    @Query('name') name?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sellerId') sellerId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('preorder') preorder?: boolean,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    return this.catalog.search({ name, categoryId, sellerId, minPrice, maxPrice, preorder, page, size });
  }

  @Public()
  @Get('products/:id')
  get(@Param('id') id: string) {
    return this.catalog.get(id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
  @Post('products')
  create(@CurrentUser() user: AuthUser, @Body() dto: ProductDto) {
    return this.catalog.create(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
  @Put('products/:id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ProductDto) {
    return this.catalog.update(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
  @Post('products/:id/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  image(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Falta el archivo de imagen');
    }
    return this.catalog.attachImage(user, id, file);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDEDOR, UserRole.SUPERADMIN)
  @Delete('products/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.catalog.deactivate(user, id);
  }

  @Public()
  @Get('media/:filename')
  async media(@Param('filename') filename: string) {
    const root = path.resolve(this.config.get<string>('UPLOAD_DIR') || './uploads');
    const file = path.join(root, path.basename(filename));
    try {
      return await fs.readFile(file);
    } catch {
      throw new NotFoundError('archivo', filename);
    }
  }
}
