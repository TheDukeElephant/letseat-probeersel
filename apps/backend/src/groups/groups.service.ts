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
    return this.prisma.group.findUnique({ where: { id }, include: { users: true, _count: { select: { users: true } } } });
  }

  async create(name: string) {
    return this.prisma.group.create({ data: { name } });
  }

  async delete(id: string) {
    await this.prisma.group.delete({ where: { id } });
    return true;
  }

  async update(id: string, name: string) {
    return this.prisma.group.update({
      where: { id },
      data: { name },
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
    return this.prisma.group.update({
      where: { id: groupId },
      data: { users: { disconnect: { id: userId } } },
      include: { users: true, _count: { select: { users: true } } },
    });
  }
}
