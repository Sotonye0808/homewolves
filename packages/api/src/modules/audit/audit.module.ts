import { Global, Module, DynamicModule } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({})
export class AuditModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: AuditModule,
      imports: [PrismaModule],
      controllers: [AuditController],
      providers: [AuditService],
      exports: [AuditService],
    };
  }
}
