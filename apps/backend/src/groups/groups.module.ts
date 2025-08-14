import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsResolver } from './groups.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { GroupInvariantStartupRunner } from './startup-invariant-runner.provider';

@Module({
  providers: [GroupsService, GroupsResolver, PrismaService, GroupInvariantStartupRunner],
  exports: [GroupsService],
})
export class GroupsModule {}
