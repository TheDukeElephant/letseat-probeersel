import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserInput) {
    const passwordHash = this.hashPassword(data.password);
    return this.prisma.user.create({
      data: { ...data, password: passwordHash, role: data.role ?? 'USER' },
    });
  }

  async update(id: string, data: UpdateUserInput) {
    if (data.password) {
      (data as any).password = this.hashPassword(data.password);
    }
    return this.prisma.user.update({ where: { id }, data: { ...data, id: undefined } });
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
  }

  private hashPassword(plain: string) {
    return crypto.createHash('sha256').update(plain).digest('hex');
  }
}
