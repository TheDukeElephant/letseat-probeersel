import { Field, ID, ObjectType } from '@nestjs/graphql';
import { MenuCategoryModel } from './menuCategory.model';

@ObjectType()
export class MenuModel {
  @Field(() => ID) id: string;
  @Field() restaurantId: string;
  @Field() name: string;
  @Field({ nullable: true }) description?: string;
  @Field() isActive: boolean;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
  @Field(() => [MenuCategoryModel], { nullable: true }) categories?: MenuCategoryModel[];
}
