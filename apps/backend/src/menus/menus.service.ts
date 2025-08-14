import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuInput } from './dto/create-menu.input';
import { UpdateMenuInput } from './dto/update-menu.input';
import { CreateMenuCategoryInput } from './dto/create-category.input';
import { UpdateMenuCategoryInput } from './dto/update-category.input';
import { CreateMenuItemInput } from './dto/create-item.input';
import { UpdateMenuItemInput } from './dto/update-item.input';
import { BatchUpdateMenuItemsInput } from './dto/batch-update-items.input';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  menusByRestaurant(restaurantId: string) {
    return this.prisma.menu.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: {
          include: { items: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  async createMenu(data: CreateMenuInput) {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.menu.count({ where: { restaurantId: data.restaurantId } });
      let isActive = false;
      if (count === 0) {
        isActive = true; // first menu becomes active automatically
      } else if (data.isActive) {
        // Deactivate existing active if requested activation
        await tx.menu.updateMany({ where: { restaurantId: data.restaurantId, isActive: true }, data: { isActive: false } });
        isActive = true;
      }
      const menu = await tx.menu.create({ data: { restaurantId: data.restaurantId, name: data.name, description: data.description, isActive } });
      if (isActive) {
        await this.maybeActivateRestaurant(tx, data.restaurantId);
      }
      return menu;
    });
  }

  async updateMenu(id: string, data: UpdateMenuInput) {
    const { id: _id, ...rest } = data as any;
    return this.prisma.$transaction(async (tx) => {
      if (rest.isActive) {
        // Deactivate all other menus for this restaurant before activating requested one
        const existing = await tx.menu.findUnique({ where: { id }, select: { restaurantId: true } });
        if (existing) {
          await tx.menu.updateMany({ where: { restaurantId: existing.restaurantId, NOT: { id } }, data: { isActive: false } });
        }
      } else if (rest.isActive === false) {
        // Prevent deactivating the last active menu for the restaurant
        const existing = await tx.menu.findUnique({ where: { id }, select: { restaurantId: true, isActive: true } });
        if (existing?.isActive) {
          const otherActive = await tx.menu.count({ where: { restaurantId: existing.restaurantId, isActive: true, NOT: { id } } });
            if (otherActive === 0) {
              throw new Error('At least one active menu is required for a restaurant. Activate another menu before deactivating this one.');
            }
        }
      }
      const updated = await tx.menu.update({ where: { id }, data: rest });
      if (rest.isActive) {
        await this.maybeActivateRestaurant(tx, updated.restaurantId);
      }
      return updated;
    });
  }
  deleteMenu(id: string) { return this.prisma.menu.delete({ where: { id } }); }
  // Enhanced delete: if deleting the last remaining menu for a restaurant, mark restaurant inactive.
  async deleteMenuWithInactivation(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const menu = await tx.menu.findUnique({ where: { id }, select: { id: true, restaurantId: true } });
      if (!menu) return true; // nothing to do
      // Manually cascade delete items -> categories -> menu (no ON DELETE CASCADE defined)
      const categories = await tx.menuCategory.findMany({ where: { menuId: id }, select: { id: true } });
      const categoryIds = categories.map(c=>c.id);
      if (categoryIds.length) {
        await tx.menuItem.deleteMany({ where: { categoryId: { in: categoryIds } } });
        await tx.menuCategory.deleteMany({ where: { id: { in: categoryIds } } });
      }
      await tx.menu.delete({ where: { id } });
      const remaining = await tx.menu.count({ where: { restaurantId: menu.restaurantId } });
      if (remaining === 0) {
        await tx.restaurant.update({ where: { id: menu.restaurantId }, data: { isActive: false } });
      }
      return true;
    });
  }

  async createCategory(data: CreateMenuCategoryInput) {
    const currentMax = await this.prisma.menuCategory.aggregate({ where: { menuId: data.menuId }, _max: { sortOrder: true } });
    const sortOrder = (currentMax._max.sortOrder ?? -1) + 1;
    return this.prisma.menuCategory.create({ data: { ...data, sortOrder } });
  }
  updateCategory(id: string, data: UpdateMenuCategoryInput) { const { id: _id, ...rest } = data as any; return this.prisma.menuCategory.update({ where: { id }, data: rest }); }
  deleteCategory(id: string) { return this.prisma.menuCategory.delete({ where: { id } }); }

  async createItem(data: CreateMenuItemInput) {
    const count = await this.prisma.menuItem.count({ where: { categoryId: data.categoryId } });
    return this.prisma.menuItem.create({ data: { ...data, price: data.price, sortOrder: count } });
  }
  updateItem(id: string, data: UpdateMenuItemInput) { const { id: _id, ...rest } = data as any; return this.prisma.menuItem.update({ where: { id }, data: rest }); }
  deleteItem(id: string) { return this.prisma.menuItem.delete({ where: { id } }); }

  async batchUpdateItems(data: BatchUpdateMenuItemsInput) {
    return this.prisma.$transaction(data.items.map(item => this.prisma.menuItem.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder, isEnabled: item.isEnabled } })));
  }

  private async maybeActivateRestaurant(tx: any, restaurantId: string) {
    const restaurant = await tx.restaurant.findUnique({ where: { id: restaurantId }, select: { isActive: true } });
    if (restaurant?.isActive) return;
  // Require at least one admin assigned
  const adminCount = await tx.restaurantAdmin.count({ where: { restaurantId } });
  if (adminCount === 0) return;
    const activeMenu = await tx.menu.findFirst({ where: { restaurantId, isActive: true }, select: { id: true } });
    if (!activeMenu) return;
    const categoryCount = await tx.menuCategory.count({ where: { menu: { restaurantId, isActive: true } } });
    if (categoryCount === 0) return;
    const itemCount = await tx.menuItem.count({ where: { category: { menu: { restaurantId, isActive: true } }, isEnabled: true } });
    if (itemCount === 0) return;
    await tx.restaurant.update({ where: { id: restaurantId }, data: { isActive: true } });
  }
}
