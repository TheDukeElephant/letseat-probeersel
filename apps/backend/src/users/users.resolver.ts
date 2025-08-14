import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserModel } from './models/user.model';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [UserModel], { name: 'users' })
  findAll() { return this.usersService.findAll(); }

  @Query(() => UserModel, { name: 'user', nullable: true })
  findOne(@Args('id') id: string) { return this.usersService.findOne(id); }

  @Mutation(() => UserModel)
  createUser(@Args('data') data: CreateUserInput) { return this.usersService.create(data); }

  @Mutation(() => UserModel)
  updateUser(@Args('data') data: UpdateUserInput) { return this.usersService.update(data.id, data); }

  @Mutation(() => Boolean)
  deleteUser(@Args('id') id: string) { return this.usersService.delete(id).then(() => true); }

  @ResolveField('adminRestaurants')
  adminRestaurants(@Parent() user: UserModel) {
    return this.usersService.adminRestaurants(user.id);
  }
}
