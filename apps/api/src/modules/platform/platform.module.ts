import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
