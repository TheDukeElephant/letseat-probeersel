import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { GroupsService } from './groups.service';
import { GroupModel } from './models/group.model';
import { PrismaService } from '../prisma/prisma.service';

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
}
