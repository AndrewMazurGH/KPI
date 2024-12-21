import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 1. Налаштування заголовків (title, version і т.д.)
  const config = new DocumentBuilder()
    .setTitle('Office Booking API')
    .setDescription('Документація до API для бронювання офісних приміщень')
    .setVersion('1.0.0')
    // Якщо треба авторизація через Bearer Token (JWT), додаємо:
    .addBearerAuth()
    .build();

  // 2. Створити документ на основі AppModule і конфігурації
  const document = SwaggerModule.createDocument(app, config);

  // 3. Підключити Swagger на якомусь шляху, наприклад /api
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
