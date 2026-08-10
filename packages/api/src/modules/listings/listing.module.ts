import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingsModule {}
