import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GroupModel } from '../../groups/models/group.model';
import { OrderItemModel } from './order-item.model';
import { OrderStatus } from '@prisma/client';

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@ObjectType()
export class OrderModel {
  @Field(() => ID) id: string;
  @Field(() => String) userId: string;
  @Field(() => String) groupId: string;
  @Field(() => String) restaurantId: string;
  @Field(() => OrderStatus) status: OrderStatus;
  @Field(() => Boolean) isFinalized: boolean;
  @Field(() => Date, { nullable: true }) finalizedAt?: Date | null;
  @Field(() => Date, { nullable: true }) scheduledFor?: Date | null;
  @Field(() => String, { nullable: true }) specialInstructions?: string | null;
  @Field(() => String, { nullable: true }) couponCode?: string | null;
  @Field(() => String) currency: string;
  @Field(() => String) subtotal: string;
  @Field(() => String) taxAmount: string;
  @Field(() => String) deliveryFee: string;
  @Field(() => String) serviceFee: string;
  @Field(() => String) tipAmount: string;
  @Field(() => String) discountTotal: string;
  @Field(() => String) grandTotal: string;
  @Field(() => String) deliveryAddressLine: string;
  @Field(() => String) deliveryPostalCode: string;
  @Field(() => String) deliveryCity: string;
  @Field(() => Number, { nullable: true }) deliveryLat?: number | null;
  @Field(() => Number, { nullable: true }) deliveryLng?: number | null;
  @Field(() => Date) createdAt: Date;
  @Field(() => Date) updatedAt: Date;
  @Field(() => [OrderItemModel], { nullable: true }) items?: OrderItemModel[];
  @Field(() => GroupModel, { nullable: true }) group?: GroupModel;
}
