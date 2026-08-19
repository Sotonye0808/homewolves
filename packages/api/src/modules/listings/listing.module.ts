import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { ActivityModule } from '../activity/activity.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [ActivityModule, AnalyticsModule],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingsModule {}
