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

  createMenu(data: CreateMenuInput) { return this.prisma.menu.create({ data }); }
  updateMenu(id: string, data: UpdateMenuInput) { const { id: _id, ...rest } = data as any; return this.prisma.menu.update({ where: { id }, data: rest }); }
  deleteMenu(id: string) { return this.prisma.menu.delete({ where: { id } }); }

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
}
