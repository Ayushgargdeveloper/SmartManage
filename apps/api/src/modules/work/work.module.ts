import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { WorkController } from './work.controller';
import { WorkService } from './work.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [WorkController],
  providers: [WorkService],
})
export class WorkModule {}
