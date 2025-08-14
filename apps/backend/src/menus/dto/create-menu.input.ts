import { Field, InputType, ID } from '@nestjs/graphql';

@InputType()
export class CreateMenuInput {
  @Field(() => ID) restaurantId: string;
  @Field() name: string;
  @Field({ nullable: true }) description?: string;
}
