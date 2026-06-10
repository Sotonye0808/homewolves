import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('blog')
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() dto: any, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.blogService.create({ ...dto, authorId: req.user.sub }, actor);
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
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
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
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.blogService.update(id, dto, actor);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.blogService.delete(id, actor);
  }
}
