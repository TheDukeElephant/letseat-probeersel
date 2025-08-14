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
    await this.prisma.group.delete({ where: { id } });
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
  // Remove admin role if present
  await this.prisma.groupAdmin.delete({ where: { userId_groupId: { userId, groupId } } }).catch(() => {});
  return this.prisma.group.update({
      where: { id: groupId },
      data: { users: { disconnect: { id: userId } } },
      include: { users: true, _count: { select: { users: true } } },
    });
  }
}
