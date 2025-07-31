import { Module } from '@nestjs/common';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    PrismaModule,
  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [PrismaModule],
})
export class CommonModule {}
