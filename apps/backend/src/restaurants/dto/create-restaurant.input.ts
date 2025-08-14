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
  @Field({ nullable: true }) billingName?: string;
  @Field({ nullable: true }) billingEmail?: string;
  @Field({ nullable: true }) billingAddress?: string;
  @Field({ nullable: true }) billingPostalCode?: string;
  @Field({ nullable: true }) billingCity?: string;
  @Field({ nullable: true }) billingCountry?: string;
  @Field({ nullable: true }) companyNumber?: string;
  @Field({ nullable: true }) iban?: string;
  @Field({ nullable: true }) bic?: string;
  @Field({ nullable: true }) websiteUrl?: string;
  @Field(() => [String], { nullable: true }) adminUserIds?: string[]; // optional initial admins with RESTAURANT role
}
