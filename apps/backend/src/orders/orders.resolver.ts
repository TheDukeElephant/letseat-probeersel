import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { OrderModel } from './models/order.model';
import { OrderItemModel } from './models/order-item.model';
import { OrderStatus } from '@prisma/client';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
class CreateOrderInput {
  @Field(() => String) restaurantId: string;
  @Field(() => String) groupId: string;
  @Field(() => String) userId: string; // creator
  @Field(() => String) deliveryAddressLine: string;
  @Field(() => String) deliveryPostalCode: string;
  @Field(() => String) deliveryCity: string;
  @Field(() => Number, { nullable: true }) deliveryLat?: number;
  @Field(() => Number, { nullable: true }) deliveryLng?: number;
  @Field(() => Date, { nullable: true }) scheduledFor?: Date | null;
  @Field(() => String, { nullable: true }) specialInstructions?: string | null;
}

@Resolver(() => OrderModel)
export class OrdersResolver {
  constructor(private orders: OrdersService) {}

  @Query(() => [OrderModel])
  ordersAll() { return this.orders.findAll(); }

  @Query(() => OrderModel, { nullable: true })
  order(@Args('id') id: string) { return this.orders.findOne(id); }

  @Mutation(() => OrderModel)
  createOrder(@Args('input') input: CreateOrderInput) { return this.orders.create(input); }

  @Mutation(() => OrderItemModel)
  addOrderItem(@Args('orderId') orderId: string, @Args('userId') userId: string, @Args('menuItemId') menuItemId: string, @Args('quantity') quantity: number, @Args('comment', { nullable: true }) comment?: string) {
    return this.orders.addItem(orderId, userId, menuItemId, quantity, comment || null);
  }

  @Mutation(() => OrderModel)
  updateOrderItemQuantity(@Args('orderItemId') orderItemId: string, @Args('userId') userId: string, @Args('quantity') quantity: number) {
    return this.orders.updateItemQuantity(orderItemId, userId, quantity);
  }

  @Mutation(() => Boolean)
  removeOrderItem(@Args('orderItemId') orderItemId: string, @Args('userId') userId: string) {
    return this.orders.removeItem(orderItemId, userId);
  }

  @Mutation(() => OrderModel)
  finalizeOrder(@Args('orderId') orderId: string, @Args('userId') userId: string) { return this.orders.finalize(orderId, userId); }

  @Mutation(() => OrderModel)
  changeOrderStatus(@Args('orderId') orderId: string, @Args('status') status: OrderStatus) { return this.orders.changeStatus(orderId, status); }
}
