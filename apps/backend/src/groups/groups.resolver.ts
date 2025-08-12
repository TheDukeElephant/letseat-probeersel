import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { GroupsService } from './groups.service';
import { GroupModel } from './models/group.model';
import { PrismaService } from '../prisma/prisma.service';
import { UserModel } from '../users/models/user.model';

@Resolver(() => GroupModel)
export class GroupsResolver {
  constructor(private groups: GroupsService, private prisma: PrismaService) {}

  @Query(() => [GroupModel], { name: 'groups' })
  groupsAll() {
    return this.groups.findAll();
  }

  @Query(() => GroupModel, { nullable: true })
  group(@Args('id') id: string) {
    return this.groups.findOne(id);
  }

  @Mutation(() => GroupModel)
  createGroup(@Args('name') name: string) {
    return this.groups.create(name);
  }

  @Mutation(() => Boolean)
  deleteGroup(@Args('id') id: string) {
    return this.groups.delete(id);
  }

  @Mutation(() => GroupModel)
  updateGroup(@Args('id') id: string, @Args('name') name: string) {
    return this.groups.update(id, name);
  }

  @Mutation(() => GroupModel)
  addUserToGroup(@Args('groupId') groupId: string, @Args('userId') userId: string) {
    return this.groups.addUser(groupId, userId);
  }

  @Mutation(() => GroupModel)
  removeUserFromGroup(@Args('groupId') groupId: string, @Args('userId') userId: string) {
    return this.groups.removeUser(groupId, userId);
  }

  @ResolveField(() => Number)
  userCount(@Parent() group: any) {
    if (group._count?.users != null) return group._count.users;
    return this.prisma.user.count({ where: { groups: { some: { id: group.id } } } });
  }

  @ResolveField()
  users(@Parent() group: any) {
    if (group.users) return group.users;
    return this.prisma.user.findMany({ where: { groups: { some: { id: group.id } } }, orderBy: { createdAt: 'desc' } });
  }

  @ResolveField(() => [UserModel], { name: 'admins' })
  async admins(@Parent() group: any) {
    const admins = await this.prisma.groupAdmin.findMany({ where: { groupId: group.id }, include: { user: true } });
    return admins.map((ga) => ga.user);
  }

  @ResolveField(() => Number)
  async adminCount(@Parent() group: any) {
    return this.prisma.groupAdmin.count({ where: { groupId: group.id } });
  }

  @Mutation(() => GroupModel)
  async addGroupAdmin(@Args('groupId') groupId: string, @Args('userId') userId: string) {
    await this.prisma.groupAdmin.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: {},
      create: { groupId, userId },
    });
    return this.groups.findOne(groupId);
  }

  @Mutation(() => GroupModel)
  async removeGroupAdmin(@Args('groupId') groupId: string, @Args('userId') userId: string) {
    const [adminCount, membersCount] = await Promise.all([
      this.prisma.groupAdmin.count({ where: { groupId } }),
      this.prisma.user.count({ where: { groups: { some: { id: groupId } } } }),
    ]);
    const isAdmin = await this.prisma.groupAdmin.findUnique({ where: { userId_groupId: { groupId, userId } } });
    if (isAdmin && adminCount <= 1 && membersCount > 0) {
      throw new Error('Cannot remove the last group admin while members remain');
    }
    await this.prisma.groupAdmin.delete({ where: { userId_groupId: { userId, groupId } } }).catch(() => {});
    return this.groups.findOne(groupId);
  }
}
