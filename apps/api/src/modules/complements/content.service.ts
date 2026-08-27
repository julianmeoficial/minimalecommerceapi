import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { FeatureFlagsService } from './feature-flags.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FeatureFlagsService,
  ) {}

  async createPost(authorId: string, dto: CreateBlogPostDto) {
    await this.flags.requireEnabled('blog');
    return this.prisma.blogPost.create({
      data: {
        title: dto.title,
        summary: dto.summary,
        body: dto.body,
        categoryId: dto.categoryId,
        published: dto.published ?? false,
        publishedAt: dto.published ? new Date() : null,
        authorId,
      },
    });
  }

  async listPosts() {
    await this.flags.requireEnabled('blog');
    return this.prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEvent(organizerId: string, dto: CreateEventDto) {
    await this.flags.requireEnabled('events');
    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        location: dto.location,
        organizerId,
      },
    });
  }

  async listEvents() {
    await this.flags.requireEnabled('events');
    return this.prisma.event.findMany({
      where: { active: true },
      orderBy: { startsAt: 'asc' },
    });
  }
}
