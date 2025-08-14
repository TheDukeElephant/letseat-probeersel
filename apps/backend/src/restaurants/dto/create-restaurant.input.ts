import { Field, InputType } from '@nestjs/graphql';
import { CuisineType } from '@prisma/client';

@InputType()
export class CreateRestaurantInput {
  @Field() name: string;
  @Field() slug: string;
  @Field() email: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => [String], { nullable: true }) allergyTags?: string[];
  @Field() address: string;
  @Field({ nullable: true }) lat?: number;
  @Field({ nullable: true }) lng?: number;
  @Field({ nullable: true }) logoUrl?: string;
  @Field({ nullable: true }) heroImageUrl?: string;
  @Field(() => CuisineType, { nullable: true }) cuisine?: CuisineType;
  @Field({ nullable: true }) isFeatured?: boolean;
  @Field({ nullable: true }) minOrderAmount?: number;
  @Field({ nullable: true }) deliveryRadiusKm?: number;
  @Field({ nullable: true }) avgPrepTimeMins?: number;
  @Field({ nullable: true }) serviceFeePercent?: number;
  @Field({ nullable: true }) vatNumber?: string;
  @Field({ nullable: true }) websiteUrl?: string;
}
