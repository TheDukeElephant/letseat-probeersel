import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error','warn','log'] });
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  // Ensure proper SIGTERM/SIGINT handling (Docker, CTRL+C) to close Prisma connections
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle("Let's Eat API")
    .setDescription('API documentation for the LetsEat platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(env.PORT);
}
bootstrap();
