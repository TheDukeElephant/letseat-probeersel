import { Args, Mutation, Parent, Query, ResolveField, Resolver, Field, InputType } from '@nestjs/graphql';
import { GroupsService } from './groups.service';
import { GroupModel } from './models/group.model';
import { PrismaService } from '../prisma/prisma.service';
import { UserModel } from '../users/models/user.model';

@InputType()
class CreateGroupInput {
  @Field(() => String)
  name: string;
  @Field(() => String, { nullable: true }) billingName?: string | null;
  @Field(() => String, { nullable: true }) billingEmail?: string | null;
  @Field(() => String, { nullable: true }) billingAddress?: string | null;
  @Field(() => String, { nullable: true }) billingPostalCode?: string | null;
  @Field(() => String, { nullable: true }) billingCity?: string | null;
  @Field(() => String, { nullable: true }) billingCountry?: string | null;
  @Field(() => String, { nullable: true }) vatNumber?: string | null;
  @Field(() => String, { nullable: true }) companyNumber?: string | null;
  @Field(() => String, { nullable: true }) iban?: string | null;
  @Field(() => String, { nullable: true }) bic?: string | null;
}

@InputType()
class UpdateGroupInput {
  @Field(() => String, { nullable: true }) name?: string;
  @Field(() => String, { nullable: true }) billingName?: string | null;
  @Field(() => String, { nullable: true }) billingEmail?: string | null;
  @Field(() => String, { nullable: true }) billingAddress?: string | null;
  @Field(() => String, { nullable: true }) billingPostalCode?: string | null;
  @Field(() => String, { nullable: true }) billingCity?: string | null;
  @Field(() => String, { nullable: true }) billingCountry?: string | null;
  @Field(() => String, { nullable: true }) vatNumber?: string | null;
  @Field(() => String, { nullable: true }) companyNumber?: string | null;
  @Field(() => String, { nullable: true }) iban?: string | null;
  @Field(() => String, { nullable: true }) bic?: string | null;
}

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
  createGroup(@Args('input') input: CreateGroupInput) {
    return this.groups.create(input);
  }

  @Mutation(() => Boolean)
  deleteGroup(@Args('id') id: string) {
    return this.groups.delete(id);
  }

  @Mutation(() => GroupModel)
  updateGroup(@Args('id') id: string, @Args('input') input: UpdateGroupInput) {
    return this.groups.update(id, input);
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
    // Enforce invariants inside a transaction so checks and creation are atomic.
    await this.prisma.$transaction(async (tx) => {
      // 1. Ensure the user is already a member of the group.
      const membership = await tx.group.findFirst({
        where: { id: groupId, users: { some: { id: userId } } },
        select: { id: true },
      });
      if (!membership) {
        throw new Error('User must be a member of the group before becoming an admin');
      }

      // 2. Get current counts.
      const [memberCount, adminCount] = await Promise.all([
        tx.user.count({ where: { groups: { some: { id: groupId } } } }),
        tx.groupAdmin.count({ where: { groupId } }),
      ]);

      // 3. Prevent more admins than members (strictly greater not allowed; equality allowed if every member an admin).
      if (adminCount >= memberCount) {
        throw new Error('Cannot add admin: admin count would exceed member count');
      }

      // 4. Upsert the admin record (idempotent promote).
      await tx.groupAdmin.upsert({
        where: { userId_groupId: { userId, groupId } },
        update: {},
        create: { groupId, userId },
      });
    });
    return this.groups.findOne(groupId);
  }

  @Mutation(() => GroupModel)
  async removeGroupAdmin(@Args('groupId') groupId: string, @Args('userId') userId: string) {
    // Transaction: remove admin; if now zero admins but members remain, promote a random member.
    await this.prisma.$transaction(async (tx) => {
      await tx.groupAdmin.delete({ where: { userId_groupId: { userId, groupId } } }).catch(() => {});
      const remainingAdmins = await tx.groupAdmin.count({ where: { groupId } });
      if (remainingAdmins === 0) {
        const members = await tx.user.findMany({ where: { groups: { some: { id: groupId } } }, select: { id: true } });
        if (members.length > 0) {
          const random = members[Math.floor(Math.random() * members.length)];
            // Only create if not already (defensive) – but we know remainingAdmins === 0
          await tx.groupAdmin.create({ data: { groupId, userId: random.id } });
        }
      }
    });
    return this.groups.findOne(groupId);
  }

  // One-off / maintenance mutation to clean historical data inconsistencies.
  // In production this should be protected (auth/role) – exposed here for admin tooling.
  @Mutation(() => Number)
  async enforceGroupAdminInvariants() {
    return this.groups.enforceAdminInvariants();
  }
}
