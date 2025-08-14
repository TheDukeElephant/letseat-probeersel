import { Field, InputType, ID } from '@nestjs/graphql';

@InputType()
export class CreateMenuInput {
  @Field(() => ID) restaurantId: string;
  @Field() name: string;
  @Field({ nullable: true }) description?: string;
  @Field({ nullable: true }) isActive?: boolean; // optional on create; service decides final value ensuring single active
}
