import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantInput } from './dto/create-restaurant.input';
import { UpdateRestaurantInput } from './dto/update-restaurant.input';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.restaurant.findMany({ orderBy: { createdAt: 'desc' } }); }
  findOne(id: string) { return this.prisma.restaurant.findUnique({ where: { id } }); }
  create(data: CreateRestaurantInput) { return this.prisma.restaurant.create({ data }); }
  update(id: string, data: UpdateRestaurantInput) { const { id: _id, ...rest } = data as any; return this.prisma.restaurant.update({ where: { id }, data: rest }); }
  async delete(id: string) { await this.prisma.restaurant.delete({ where: { id } }); return true; }
}
