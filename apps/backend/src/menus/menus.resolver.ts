import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MenusService } from './menus.service';
import { MenuModel } from './models/menu.model';
import { MenuCategoryModel } from './models/menuCategory.model';
import { MenuItemModel } from './models/menuItem.model';
import { CreateMenuInput } from './dto/create-menu.input';
import { UpdateMenuInput } from './dto/update-menu.input';
import { CreateMenuCategoryInput } from './dto/create-category.input';
import { UpdateMenuCategoryInput } from './dto/update-category.input';
import { CreateMenuItemInput } from './dto/create-item.input';
import { UpdateMenuItemInput } from './dto/update-item.input';
import { BatchUpdateMenuItemsInput } from './dto/batch-update-items.input';

@Resolver()
export class MenusResolver {
  constructor(private menus: MenusService) {}
  @Query(() => [MenuModel]) menusByRestaurant(@Args('restaurantId', { type: () => ID }) restaurantId: string) { return this.menus.menusByRestaurant(restaurantId); }
  @Mutation(() => MenuModel) createMenu(@Args('data') data: CreateMenuInput) { return this.menus.createMenu(data); }
  @Mutation(() => MenuModel) updateMenu(@Args('data') data: UpdateMenuInput) { return this.menus.updateMenu(data.id, data); }
  @Mutation(() => Boolean) deleteMenu(@Args('id', { type: () => ID }) id: string) { return this.menus.deleteMenu(id).then(() => true); }
  @Mutation(() => MenuCategoryModel) createMenuCategory(@Args('data') data: CreateMenuCategoryInput) { return this.menus.createCategory(data); }
  @Mutation(() => MenuCategoryModel) updateMenuCategory(@Args('data') data: UpdateMenuCategoryInput) { return this.menus.updateCategory(data.id, data); }
  @Mutation(() => Boolean) deleteMenuCategory(@Args('id', { type: () => ID }) id: string) { return this.menus.deleteCategory(id).then(() => true); }
  @Mutation(() => MenuItemModel) createMenuItem(@Args('data') data: CreateMenuItemInput) { return this.menus.createItem(data); }
  @Mutation(() => MenuItemModel) updateMenuItem(@Args('data') data: UpdateMenuItemInput) { return this.menus.updateItem(data.id, data); }
  @Mutation(() => Boolean) deleteMenuItem(@Args('id', { type: () => ID }) id: string) { return this.menus.deleteItem(id).then(() => true); }
  @Mutation(() => Boolean) batchUpdateMenuItems(@Args('data') data: BatchUpdateMenuItemsInput) { return this.menus.batchUpdateItems(data).then(()=>true); }
}
