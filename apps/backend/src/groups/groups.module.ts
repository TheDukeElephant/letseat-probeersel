import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsResolver } from './groups.resolver';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [GroupsService, GroupsResolver, PrismaService],
  exports: [GroupsService],
})
export class GroupsModule {}
