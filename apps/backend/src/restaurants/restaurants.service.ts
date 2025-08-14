import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantInput } from './dto/create-restaurant.input';
import { UpdateRestaurantInput } from './dto/update-restaurant.input';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.restaurant.findMany({ orderBy: { createdAt: 'desc' } }); }
  findOne(id: string) { return this.prisma.restaurant.findUnique({ where: { id } }); }
  async create(data: CreateRestaurantInput) {
    const { adminUserIds = [], ...rest } = data as any;
    return this.prisma.$transaction(async (tx) => {
      // Start inactive if no admin provided; even with admin we remain inactive until menu conditions met
      const restaurant = await tx.restaurant.create({ data: { ...rest, isActive: false } });
      if (adminUserIds.length) {
        const users = await tx.user.findMany({ where: { id: { in: adminUserIds } }, select: { id: true, role: true } });
        // Enforce that a RESTAURANT role user can only be admin of one restaurant
        const valid = [] as string[];
        for (const u of users) {
          if (u.role !== 'RESTAURANT') continue;
          const existing = await tx.restaurantAdmin.findFirst({ where: { userId: u.id } });
          if (existing) {
            // Skip user already assigned elsewhere
            continue;
          }
          valid.push(u.id);
        }
        const toCreate = [...new Set(valid)].map(userId => tx.restaurantAdmin.create({ data: { restaurantId: restaurant.id, userId } }));
        if (toCreate.length) await Promise.all(toCreate);
      }
      return restaurant;
    });
  }
  update(id: string, data: UpdateRestaurantInput) { const { id: _id, ...rest } = data as any; return this.prisma.restaurant.update({ where: { id }, data: rest }); }
  async delete(id: string) {
    await this.prisma.$transaction(async (tx) => {
      // Remove admin relations
      await tx.restaurantAdmin.deleteMany({ where: { restaurantId: id } });
      // Delete menus (categories & items will cascade via onDelete if configured; otherwise explicit deletes)
      const menus = await tx.menu.findMany({ where: { restaurantId: id }, select: { id: true } });
      for (const m of menus) {
        await tx.menuItem.deleteMany({ where: { category: { menuId: m.id } } });
        await tx.menuCategory.deleteMany({ where: { menuId: m.id } });
        await tx.menu.delete({ where: { id: m.id } });
      }
      await tx.restaurant.delete({ where: { id } });
    });
    return true;
  }

  admins(restaurantId: string) {
    return this.prisma.user.findMany({
      where: { restaurantAdmins: { some: { restaurantId } } },
      orderBy: { name: 'asc' }
    });
  }

  async addAdmin(restaurantId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (user.role !== 'RESTAURANT') throw new Error('User role must be RESTAURANT');
  // Enforce single restaurant admin assignment per RESTAURANT user
  const existing = await this.prisma.restaurantAdmin.findFirst({ where: { userId } });
  if (existing) throw new Error('User already assigned to another restaurant');
    try {
      await this.prisma.restaurantAdmin.create({ data: { restaurantId, userId } });
    } catch (e:any) {
      if (e.code === 'P2002') { /* unique constraint -> already admin */ return; }
      throw e;
    }
    // Attempt activation if there is now an admin and menus conditions satisfied
    await this.prisma.$transaction(async (tx) => {
      const r = await tx.restaurant.findUnique({ where: { id: restaurantId }, select: { isActive: true } });
      if (r?.isActive) return;
      const adminCount = await tx.restaurantAdmin.count({ where: { restaurantId } });
      if (adminCount === 0) return;
      const activeMenu = await tx.menu.findFirst({ where: { restaurantId, isActive: true }, select: { id: true } });
      if (!activeMenu) return;
      const categoryCount = await tx.menuCategory.count({ where: { menu: { restaurantId, isActive: true } } });
      if (categoryCount === 0) return;
      const itemCount = await tx.menuItem.count({ where: { category: { menu: { restaurantId, isActive: true } }, isEnabled: true } });
      if (itemCount === 0) return;
      await tx.restaurant.update({ where: { id: restaurantId }, data: { isActive: true } });
    });
  }

  async removeAdmin(restaurantId: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.restaurantAdmin.delete({ where: { restaurantId_userId: { restaurantId, userId } } });
      const remaining = await tx.restaurantAdmin.count({ where: { restaurantId } });
      if (remaining === 0) {
        // Delete entire restaurant (including menus/categories/items) if no admins remain
        // Reuse existing delete logic (inline to avoid nested transaction)
        const menus = await tx.menu.findMany({ where: { restaurantId }, select: { id: true } });
        for (const m of menus) {
          await tx.menuItem.deleteMany({ where: { category: { menuId: m.id } } });
          await tx.menuCategory.deleteMany({ where: { menuId: m.id } });
          await tx.menu.delete({ where: { id: m.id } });
        }
        await tx.restaurant.delete({ where: { id: restaurantId } });
      }
    });
  }
}
