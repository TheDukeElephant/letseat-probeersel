import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';

// Later: AuthModule, OrdersModule, RestaurantsModule, MenusModule, GroupsModule, PaymentsModule

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req }) => ({ req }),
    }),
  UsersModule,
  GroupsModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
