import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class BatchUpdateMenuItemInput {
  @Field(() => ID) id: string;
  @Field({ nullable: true }) sortOrder?: number;
  @Field({ nullable: true }) isEnabled?: boolean;
}

@InputType()
export class BatchUpdateMenuItemsInput {
  @Field(() => [BatchUpdateMenuItemInput]) items: BatchUpdateMenuItemInput[];
}
