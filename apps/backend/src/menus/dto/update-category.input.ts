import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CreateMenuCategoryInput } from './create-category.input';

@InputType()
export class UpdateMenuCategoryInput extends PartialType(CreateMenuCategoryInput) {
  @Field(() => ID) id: string;
  @Field({ nullable: true }) sortOrder?: number;
}
