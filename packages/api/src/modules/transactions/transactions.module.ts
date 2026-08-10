import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { ActivityModule } from '../activity/activity.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [ActivityModule, ReferralsModule, AnalyticsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
