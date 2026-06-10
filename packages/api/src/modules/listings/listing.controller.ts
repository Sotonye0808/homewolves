import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ListingService } from './listing.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto, UpdateListingStatusDto } from './dto/update-listing.dto';

@Controller('listings')
export class ListingController {
  constructor(private listingService: ListingService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() dto: CreateListingDto, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.listingService.create(dto, req.user.sub, actor);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('category') category?: string,
    @Query('propertyType') propertyType?: string,
    @Query('status') status?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
    @Query('ownerId') ownerId?: string,
    @Query('featured') featured?: string,
  ) {
    return this.listingService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      category,
      propertyType,
      status,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
      ownerId,
      featured: featured != null ? featured === 'true' : undefined,
    });
  }

  @Get('featured')
  getFeatured() {
    return this.listingService.getFeatured();
  }

  @Get('admin/pending')
  @UseGuards(JwtGuard)
  getPendingModeration() {
    return this.listingService.getPendingModeration();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() dto: UpdateListingDto, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.listingService.update(id, dto, req.user.sub, actor);
  }

  @Put(':id/status')
  @UseGuards(JwtGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateListingStatusDto, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.listingService.updateStatus(id, dto, req.user.sub, actor);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.listingService.delete(id, req.user.sub, actor);
  }

  @Post('media/upload-url')
  @UseGuards(JwtGuard)
  getUploadUrl(@Body() body: { filename: string; contentType: string }) {
    return this.listingService.uploadMediaUrl(body.filename, body.contentType);
  }

  @Post(':id/media')
  @UseGuards(JwtGuard)
  attachMedia(
    @Param('id') id: string,
    @Body() body: { media: { url: string; type: string; isPrimary?: boolean; altText?: string }[] },
    @Req() req: any,
  ) {
    return this.listingService.attachMedia(id, body.media, req.user.sub);
  }

  @Post(':id/view')
  incrementView(@Param('id') id: string) {
    return this.listingService.incrementView(id);
  }

  @Put(':id/moderate')
  @UseGuards(JwtGuard)
  moderate(@Param('id') id: string, @Body() body: { action: 'approve' | 'reject' }, @Req() req: any) {
    const actor = { id: req.user.sub, role: req.user.role, name: req.user.email };
    return this.listingService.moderateListing(id, body.action, actor);
  }
}
