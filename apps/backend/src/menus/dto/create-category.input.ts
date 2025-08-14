import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class CreateMenuCategoryInput {
  @Field(() => ID) menuId: string;
  @Field() name: string;
}
