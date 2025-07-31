import { NestFactory } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import * as dotenv from 'dotenv';

dotenv.config();

import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(CommonModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
