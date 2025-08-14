import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantInput } from './create-restaurant.input';
import { CuisineType } from '@prisma/client';

@InputType()
export class UpdateRestaurantInput extends PartialType(CreateRestaurantInput) {
  @Field(() => ID) id: string;
  @Field({ nullable: true }) isActive?: boolean;
  @Field(() => CuisineType, { nullable: true }) cuisine?: CuisineType;
}
