import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';
import { Role } from '@prisma/client';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field()
  id: string;

  @Field(() => Role, { nullable: true })
  role?: Role;

  @Field({ nullable: true })
  password?: string;

  @Field(() => [String], { nullable: true })
  groupIds?: string[];
}
