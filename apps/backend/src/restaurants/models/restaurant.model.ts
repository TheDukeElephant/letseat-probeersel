import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CuisineType } from '@prisma/client';

registerEnumType(CuisineType, { name: 'CuisineType' });

@ObjectType()
export class RestaurantModel {
  @Field(() => ID)
  id: string;
  @Field() name: string;
  @Field() slug: string;
  @Field() email: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => [String]) allergyTags: string[];
  @Field() address: string;
  @Field(() => Number, { nullable: true }) lat?: any; // Decimal -> exposed as Float
  @Field(() => Number, { nullable: true }) lng?: any; // Decimal -> exposed as Float
  @Field() isActive: boolean;
  @Field() createdAt: Date;
  @Field() updatedAt: Date;
  @Field({ nullable: true }) logoUrl?: string;
  @Field({ nullable: true }) heroImageUrl?: string;
  @Field(() => CuisineType, { nullable: true }) cuisine?: CuisineType;
  @Field() isFeatured: boolean;
  @Field(() => Number, { nullable: true }) minOrderAmount?: any; // Decimal -> exposed as Float
  @Field({ nullable: true }) deliveryRadiusKm?: number;
  @Field({ nullable: true }) avgPrepTimeMins?: number;
  @Field(() => Number, { nullable: true }) serviceFeePercent?: any; // Decimal -> exposed as Float
  @Field({ nullable: true }) vatNumber?: string;
  @Field(() => Number, { nullable: true }) ratingAverage?: any; // Decimal -> exposed as Float
  @Field() ratingCount: number;
  @Field({ nullable: true }) websiteUrl?: string;
}
