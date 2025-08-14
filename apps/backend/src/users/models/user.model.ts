import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { GroupModel } from '../../groups/models/group.model';
import { RestaurantModel } from '../../restaurants/models/restaurant.model';

registerEnumType(Role, { name: 'Role' });

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => Role)
  role: Role;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [GroupModel], { nullable: true })
  groups?: GroupModel[];
  @Field(() => [RestaurantModel], { nullable: true })
  adminRestaurants?: RestaurantModel[];
}
