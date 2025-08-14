import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class CreateMenuItemInput {
  @Field(() => ID) categoryId: string;
  @Field() name: string;
  @Field({ nullable: true }) description?: string;
  @Field() price: number;
  @Field({ nullable: true }) imageUrl?: string;
  @Field({ nullable: true }) stock?: number;
  @Field(() => [String], { nullable: true }) allergyTags?: string[];
}
