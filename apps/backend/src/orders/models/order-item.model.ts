import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OrderItemModel {
  @Field(() => ID) id: string;
  @Field(() => String) menuItemId: string;
  @Field(() => String) orderId: string;
  @Field(() => String) addedByUserId: string;
  @Field(() => Number) quantity: number;
  @Field(() => String) price: string; // Decimal serialized as string
  @Field(() => String, { nullable: true }) comment?: string | null;
}
