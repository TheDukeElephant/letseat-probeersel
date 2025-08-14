import { Field, ID, ObjectType } from '@nestjs/graphql';
import { MenuItemModel } from './menuItem.model';

@ObjectType()
export class MenuCategoryModel {
  @Field(() => ID) id: string;
  @Field() menuId: string;
  @Field() name: string;
  @Field() sortOrder: number;
  @Field(() => [MenuItemModel], { nullable: true }) items?: MenuItemModel[];
}
