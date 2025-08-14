import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { GroupsModule } from '../src/groups/groups.module';
import { GroupsService } from '../src/groups/groups.service';

// NOTE: These tests operate against the configured database. In CI you may want to point DATABASE_URL to a test schema.
// They create and clean up their own data.

describe('Group Admin Invariants', () => {
  let prisma: PrismaService;
  let groups: GroupsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [GroupsModule] }).compile();
    prisma = moduleRef.get(PrismaService);
    groups = moduleRef.get(GroupsService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function randomName(prefix: string) { return prefix + Math.random().toString(36).slice(2,8); }

  it('removes all admins if group loses all members', async () => {
    // Create users
    const u1 = await prisma.user.create({ data: { email: randomName('a')+'@test.dev', name: 'User1', password: 'x' } });
    const u2 = await prisma.user.create({ data: { email: randomName('b')+'@test.dev', name: 'User2', password: 'x' } });
    const g = await prisma.group.create({ data: { name: randomName('grp') , users: { connect: [{ id: u1.id }, { id: u2.id }] } } });
    // Promote both to admin
    await prisma.groupAdmin.createMany({ data: [{ groupId: g.id, userId: u1.id }, { groupId: g.id, userId: u2.id }] });
    // Remove both members (simulate stale admins)
    await prisma.group.update({ where: { id: g.id }, data: { users: { set: [] } } });
    const deleted = await groups.enforceAdminInvariants();
    expect(deleted).toBeGreaterThanOrEqual(2);
    const remaining = await prisma.groupAdmin.count({ where: { groupId: g.id } });
    expect(remaining).toBe(0);
  });

  it('trims admins beyond member count', async () => {
    const u1 = await prisma.user.create({ data: { email: randomName('c')+'@test.dev', name: 'U1', password: 'x' } });
    const u2 = await prisma.user.create({ data: { email: randomName('d')+'@test.dev', name: 'U2', password: 'x' } });
    const u3 = await prisma.user.create({ data: { email: randomName('e')+'@test.dev', name: 'U3', password: 'x' } });
    const g = await prisma.group.create({ data: { name: randomName('grp'), users: { connect: [{ id: u1.id }, { id: u2.id }] } } });
    // Add three admins while only two members exist
    await prisma.groupAdmin.createMany({ data: [u1,u2,u3].map(u => ({ groupId: g.id, userId: u.id })) });
    const deleted = await groups.enforceAdminInvariants();
    expect(deleted).toBeGreaterThanOrEqual(1);
    const counts = await Promise.all([
      prisma.groupAdmin.count({ where: { groupId: g.id } }),
      prisma.user.count({ where: { groups: { some: { id: g.id } } } }),
    ]);
    const [adminCount, memberCount] = counts;
    expect(adminCount).toBeLessThanOrEqual(memberCount);
  });

  it('removes orphan admins whose users are no longer members', async () => {
    const member = await prisma.user.create({ data: { email: randomName('m')+'@test.dev', name: 'Member', password: 'x' } });
    const nonMember = await prisma.user.create({ data: { email: randomName('n')+'@test.dev', name: 'NonMember', password: 'x' } });
    const g = await prisma.group.create({ data: { name: randomName('grp'), users: { connect: [{ id: member.id }] } } });
    // Create admin rows for both users (second is orphan)
    await prisma.groupAdmin.createMany({ data: [member, nonMember].map(u => ({ groupId: g.id, userId: u.id })) });
    const beforeCounts = await prisma.groupAdmin.count({ where: { groupId: g.id } });
    expect(beforeCounts).toBe(2);
    const deleted = await groups.enforceAdminInvariants();
    expect(deleted).toBeGreaterThanOrEqual(1);
    const afterAdmins = await prisma.groupAdmin.findMany({ where: { groupId: g.id } });
    // Only the member should remain an admin.
    expect(afterAdmins.length).toBe(1);
    expect(afterAdmins[0].userId).toBe(member.id);
  });

  it('deletes a group that has admins (including orphan admins) without FK errors', async () => {
    const m1 = await prisma.user.create({ data: { email: randomName('dg')+'@test.dev', name: 'DG1', password: 'x' } });
    const orphan = await prisma.user.create({ data: { email: randomName('dg')+'@test.dev', name: 'Orphan', password: 'x' } });
    const g = await prisma.group.create({ data: { name: randomName('grp'), users: { connect: [{ id: m1.id }] } } });
    // Valid admin
    await prisma.groupAdmin.create({ data: { groupId: g.id, userId: m1.id } });
    // Orphan admin (user not a member)
    await prisma.groupAdmin.create({ data: { groupId: g.id, userId: orphan.id } });
    // Delete via service
    const result = await groups.delete(g.id);
    expect(result).toBe(true);
    const still = await prisma.group.findUnique({ where: { id: g.id } });
    expect(still).toBeNull();
    const leftoverAdmins = await prisma.groupAdmin.count({ where: { groupId: g.id } });
    expect(leftoverAdmins).toBe(0);
  });
});
