import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest, toActor } from '../../common/types/request.types';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  createBlogPostSchema,
  updateBlogPostSchema,
} from './dto/blog-post.dto';

@Controller('blog')
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body(new ZodValidationPipe(createBlogPostSchema)) dto: CreateBlogPostDto, @Req() req: AuthenticatedRequest) {
    return this.blogService.create({ ...dto, authorId: req.user.sub }, toActor(req));
  }

  @Get()
  findAll(
    @Query('published') published?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('featured') featured?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.blogService.findAll({
      published: published != null ? published === 'true' : true,
      category,
      tag,
      featured: featured != null ? featured === 'true' : undefined,
      page: page ? Math.max(parseInt(page) || 1, 1) : undefined,
      limit: limit ? Math.min(parseInt(limit) || 12, 50) : undefined,
    });
  }

  @Get('categories')
  getCategories() {
    return this.blogService.getCategories();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Put(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateBlogPostSchema)) dto: UpdateBlogPostDto, @Req() req: AuthenticatedRequest) {
    return this.blogService.update(id, dto, toActor(req));
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.blogService.delete(id, toActor(req));
  }
}
