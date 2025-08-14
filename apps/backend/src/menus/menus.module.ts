import { Module } from '@nestjs/common';
import { MenusResolver } from './menus.resolver';
import { MenusService } from './menus.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [MenusResolver, MenusService, PrismaService],
  exports: [MenusService],
})
export class MenusModule {}
