import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true } } },
    });
  }

  async findOne(id: string) {
    return this.prisma.group.findUnique({
      where: { id },
      include: { users: true, _count: { select: { users: true } } },
    });
  }

  async create(data: {
    name: string;
    billingName?: string | null;
    billingEmail?: string | null;
    billingAddress?: string | null;
    billingPostalCode?: string | null;
    billingCity?: string | null;
    billingCountry?: string | null;
    vatNumber?: string | null;
    companyNumber?: string | null;
    iban?: string | null;
    bic?: string | null;
  }) {
    return this.prisma.group.create({
      data: {
        name: data.name,
        billingName: data.billingName,
        billingEmail: data.billingEmail,
        billingAddress: data.billingAddress,
        billingPostalCode: data.billingPostalCode,
        billingCity: data.billingCity,
        billingCountry: data.billingCountry,
        vatNumber: data.vatNumber,
        companyNumber: data.companyNumber,
        iban: data.iban,
        bic: data.bic,
      },
    });
  }

  async delete(id: string) {
    // Ensure any admin rows referencing this group are removed first to avoid FK violations.
    await this.prisma.$transaction(async (tx) => {
      await tx.groupAdmin.deleteMany({ where: { groupId: id } });
      // Disconnect users not required explicitly (implicit m2m cleaned automatically), just delete group.
      await tx.group.delete({ where: { id } });
    });
    return true;
  }

  async update(id: string, data: {
    name?: string;
    billingName?: string | null;
    billingEmail?: string | null;
    billingAddress?: string | null;
    billingPostalCode?: string | null;
    billingCity?: string | null;
    billingCountry?: string | null;
    vatNumber?: string | null;
    companyNumber?: string | null;
    iban?: string | null;
    bic?: string | null;
  }) {
    return this.prisma.group.update({
      where: { id },
      data: {
        ...data,
      },
      include: { users: true, _count: { select: { users: true } } },
    });
  }

  async addUser(groupId: string, userId: string) {
    return this.prisma.group.update({
      where: { id: groupId },
      data: { users: { connect: { id: userId } } },
      include: { users: true, _count: { select: { users: true } } },
    });
  }

  async removeUser(groupId: string, userId: string) {
    // Remove admin role if present first (ignore if not found)
    await this.prisma.groupAdmin.delete({ where: { userId_groupId: { userId, groupId } } }).catch(() => {});

    // Disconnect the user from the group.
    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: { users: { disconnect: { id: userId } } },
      include: { users: true, _count: { select: { users: true } } },
    });

    // If the group now has zero members, purge any lingering admin records (defensive cleanup).
    if (updated._count?.users === 0) {
      await this.prisma.groupAdmin.deleteMany({ where: { groupId } });
    } else {
      // If members remain but there are no admins, promote a random member to admin to keep group enabled.
      const adminCount = await this.prisma.groupAdmin.count({ where: { groupId } });
      if (adminCount === 0 && updated.users?.length) {
        const random = updated.users[Math.floor(Math.random() * updated.users.length)];
        await this.prisma.groupAdmin.create({ data: { groupId, userId: random.id } });
      }
    }
    return updated;
  }

  /**
   * Enforce invariants across ALL existing groups:
   * - No admins when there are zero members.
   * - Admin count cannot exceed member count (trim extras by oldest first).
   * Returns number of admin records deleted.
   */
  async enforceAdminInvariants(): Promise<number> {
    let deleted = 0;
    // Fetch groups with counts only (efficient) then handle each needing adjustment.
    const groups = await this.prisma.group.findMany({
      select: { id: true, users: { select: { id: true } } },
    });
    for (const g of groups) {
      const memberIds = g.users.map(u => u.id);
      const memberCount = memberIds.length;
      // Get admins ordered by createdAt so we can deterministically trim.
      const admins = await this.prisma.groupAdmin.findMany({ where: { groupId: g.id }, orderBy: { createdAt: 'asc' } });
      if (admins.length === 0) {
        // If there are members but no admins, promote a random member to admin (auto-healing invariant)
        if (memberCount > 0) {
          const randomMemberId = memberIds[Math.floor(Math.random() * memberIds.length)];
          await this.prisma.groupAdmin.create({ data: { groupId: g.id, userId: randomMemberId } });
        }
        continue;
      }

      // First pass: remove any admins whose user is no longer a member (orphan admin rows).
      const orphanAdmins = admins.filter(a => !memberIds.includes(a.userId));
      if (orphanAdmins.length) {
        await this.prisma.groupAdmin.deleteMany({ where: { id: { in: orphanAdmins.map(a => a.id) } } });
        deleted += orphanAdmins.length;
      }
      // Refresh admins list (exclude deleted orphans) for subsequent logic.
      if (orphanAdmins.length) {
        const remaining = await this.prisma.groupAdmin.findMany({ where: { groupId: g.id }, orderBy: { createdAt: 'asc' } });
        admins.length = 0; // mutate existing reference not strictly needed, but keep pattern
        admins.push(...remaining);
      }
      if (memberCount === 0) {
        // Remove all admins (group has no members)
        await this.prisma.groupAdmin.deleteMany({ where: { groupId: g.id } });
        deleted += admins.length; // includes any orphans already removed above if present
        continue;
      }
      if (admins.length > memberCount) {
        const toRemove = admins.slice(memberCount); // keep only first N (oldest) admins
        if (toRemove.length) {
          await this.prisma.groupAdmin.deleteMany({ where: { id: { in: toRemove.map(a => a.id) } } });
          deleted += toRemove.length;
        }
      }
    }
    return deleted;
  }
}
