import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { groups: true } });
  }

  async findOne(id: string) {
  return this.prisma.user.findUnique({ where: { id }, include: { groups: true } });
  }

  async create(data: CreateUserInput) {
    const { groupIds, ...rest } = data;
    const passwordHash = this.hashPassword(rest.password);
  const disallowRoles = ['RESTAURANT','ADMIN'];
  const allowGroups = !disallowRoles.includes((rest.role ?? 'USER'));
    return this.prisma.user.create({
      data: {
        ...rest,
        password: passwordHash,
        role: rest.role ?? 'USER',
    groups: allowGroups && groupIds?.length ? { connect: groupIds.map((id) => ({ id })) } : undefined,
      },
      include: { groups: true },
    });
  }

  async update(id: string, data: UpdateUserInput) {
    const { groupIds, ...rest } = data;
    if (rest.password) {
      (rest as any).password = this.hashPassword(rest.password);
    }
  const disallowRoles = ['RESTAURANT','ADMIN'];
  const currentRole = rest.role ?? (await this.prisma.user.findUnique({ where: { id }, select: { role: true } }))?.role;
  const allowGroups = !disallowRoles.includes(currentRole as string);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        id: undefined,
    groups: allowGroups && groupIds ? { set: groupIds.map((gid) => ({ id: gid })) } : allowGroups ? undefined : { set: [] },
      },
      include: { groups: true },
    });
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
  }

  async adminRestaurants(userId: string) {
    return this.prisma.restaurant.findMany({
      where: { admins: { some: { userId } } },
      orderBy: { name: 'asc' },
    });
  }

  private hashPassword(plain: string) {
    return crypto.createHash('sha256').update(plain).digest('hex');
  }
}
