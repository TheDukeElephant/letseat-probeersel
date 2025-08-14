import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MenuItemModel {
  @Field(() => ID) id: string;
  @Field() categoryId: string;
  @Field() name: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => Number) price: any; // Decimal -> expose as Float
  @Field({ nullable: true }) imageUrl?: string;
  @Field() isEnabled: boolean;
  @Field({ nullable: true }) stock?: number;
  @Field(() => [String]) allergyTags: string[];
  @Field() sortOrder: number;
  @Field(() => Date) createdAt: Date;
  @Field(() => Date) updatedAt: Date;
}
