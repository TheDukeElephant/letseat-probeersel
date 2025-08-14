import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { RestaurantsService } from './restaurants.service';
import { RestaurantModel } from './models/restaurant.model';
import { CreateRestaurantInput } from './dto/create-restaurant.input';
import { UpdateRestaurantInput } from './dto/update-restaurant.input';
import { UserModel } from '../users/models/user.model';

@Resolver(() => RestaurantModel)
export class RestaurantsResolver {
  constructor(private restaurants: RestaurantsService) {}
  @Query(() => [RestaurantModel], { name: 'restaurants' }) findAll() { return this.restaurants.findAll(); }
  @Query(() => RestaurantModel, { name: 'restaurant', nullable: true }) findOne(@Args('id') id: string) { return this.restaurants.findOne(id); }
  @Mutation(() => RestaurantModel) createRestaurant(@Args('data') data: CreateRestaurantInput) { return this.restaurants.create(data); }
  @Mutation(() => RestaurantModel) updateRestaurant(@Args('data') data: UpdateRestaurantInput) { return this.restaurants.update(data.id, data); }
  @Mutation(() => Boolean) deleteRestaurant(@Args('id') id: string) { return this.restaurants.delete(id); }

  @ResolveField(() => [UserModel], { name: 'admins', nullable: true })
  admins(@Parent() restaurant: RestaurantModel) {
    return this.restaurants.admins(restaurant.id);
  }

  @Mutation(() => Boolean)
  addRestaurantAdmin(@Args('restaurantId') restaurantId: string, @Args('userId') userId: string) {
    return this.restaurants.addAdmin(restaurantId, userId).then(()=>true);
  }

  @Mutation(() => Boolean)
  removeRestaurantAdmin(@Args('restaurantId') restaurantId: string, @Args('userId') userId: string) {
    return this.restaurants.removeAdmin(restaurantId, userId).then(()=>true);
  }
}
