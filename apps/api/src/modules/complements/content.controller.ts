import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../shared/auth/current-user.decorator';
import { Public } from '../../shared/auth/public.decorator';
import { Roles } from '../../shared/auth/roles.decorator';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { ContentService } from './content.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { CreateEventDto } from './dto/create-event.dto';

@ApiTags('content')
@Controller({ version: '1' })
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Public()
  @Get('blog/posts')
  listPosts() {
    return this.content.listPosts();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.VENDEDOR)
  @Post('blog/posts')
  createPost(@CurrentUser() user: AuthUser, @Body() dto: CreateBlogPostDto) {
    return this.content.createPost(user.userId, dto);
  }

  @Public()
  @Get('events')
  listEvents() {
    return this.content.listEvents();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Post('events')
  createEvent(@CurrentUser() user: AuthUser, @Body() dto: CreateEventDto) {
    return this.content.createEvent(user.userId, dto);
  }
}
