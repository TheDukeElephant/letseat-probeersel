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

  // Optional invoice / billing fields
  @Field(() => String, { nullable: true })
  billingName?: string | null;
  @Field(() => String, { nullable: true })
  billingEmail?: string | null;
  @Field(() => String, { nullable: true })
  billingAddress?: string | null;
  @Field(() => String, { nullable: true })
  billingPostalCode?: string | null;
  @Field(() => String, { nullable: true })
  billingCity?: string | null;
  @Field(() => String, { nullable: true })
  billingCountry?: string | null;
  @Field(() => String, { nullable: true })
  vatNumber?: string | null;
  @Field(() => String, { nullable: true })
  companyNumber?: string | null;
  @Field(() => String, { nullable: true })
  iban?: string | null;
  @Field(() => String, { nullable: true })
  bic?: string | null;

  @Field(() => [UserModel], { nullable: true })
  users?: UserModel[];

  @Field(() => Number)
  userCount: number;

  @Field(() => [UserModel], { nullable: true })
  admins?: UserModel[];

  @Field(() => Number)
  adminCount: number;
}
