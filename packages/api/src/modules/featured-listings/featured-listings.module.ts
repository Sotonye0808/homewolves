import { Module } from '@nestjs/common';
import { FeaturedListingsController } from './featured-listings.controller';
import { FeaturedListingsService } from './featured-listings.service';
import { PlatformConfigModule } from '../platform-config/platform-config.module';

@Module({
  imports: [PlatformConfigModule],
  controllers: [FeaturedListingsController],
  providers: [FeaturedListingsService],
  exports: [FeaturedListingsService],
})
export class FeaturedListingsModule {}
