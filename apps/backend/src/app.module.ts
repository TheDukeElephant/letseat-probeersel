// Core NestJS decorator for defining a module.
import { Module } from '@nestjs/common';
// GraphQLModule wires Apollo Server into Nest.
import { GraphQLModule } from '@nestjs/graphql';
// Apollo specific driver + config typing.
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
// Node path helper so we can build an absolute path to the generated schema file.
import { join } from 'path';
// PrismaService is our database access layer wrapper around Prisma Client.
import { PrismaService } from './prisma/prisma.service';
// Import feature modules so their resolvers/services get registered.
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenusModule } from './menus/menus.module';

// Roadmap (future modules we might plug in): AuthModule, OrdersModule, PaymentsModule, etc.

@Module({
  imports: [
    // Configure GraphQL runtime:
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,              // Tell Nest to use Apollo under the hood.
      autoSchemaFile: join(process.cwd(), 'schema.gql'), // Auto-generate schema from decorators.
      sortSchema: true,                  // Ensures schema output is deterministic (nicer diffs).
      playground: true,                  // Enables the in-browser GraphQL Playground (disable in prod).
      context: ({ req }) => ({ req }),   // Expose request object to resolvers (for auth later).
    }),
    // Feature modules registered here make their providers/resolvers available.
    UsersModule,
    GroupsModule,
    RestaurantsModule,
    MenusModule,
  ],
  // REST controllers (if any) would be listed here. We have none right now.
  controllers: [],
  // Global singleton providers. PrismaService is shared so we open only one DB connection pool.
  providers: [PrismaService],
})
export class AppModule {}
