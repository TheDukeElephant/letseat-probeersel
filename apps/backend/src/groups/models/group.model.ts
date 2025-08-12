import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';

@ObjectType()
export class GroupModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  createdAt: Date;

  @Field(() => [UserModel], { nullable: true })
  users?: UserModel[];

  @Field(() => Number)
  userCount: number;

  @Field(() => [UserModel], { nullable: true })
  admins?: UserModel[];

  @Field(() => Number)
  adminCount: number;
}
