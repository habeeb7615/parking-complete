import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) =>
          Object.values(error.constraints || {}).join(', '),
        );
        return new HttpException(
          {
            success: false,
            statusCode: 400,
            message: messages,
            error: 'Bad Request',
            timestamp: new Date().toISOString(),
          },
          400,
        );
      },
    }),
  );

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('ParkFlow API')
    .setDescription('ParkFlow Parking Management System API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('dashboard', 'Dashboard metrics and statistics')
    .addTag('contractors', 'Contractor management')
    .addTag('locations', 'Parking location management')
    .addTag('vehicles', 'Vehicle check-in/checkout operations')
    .addTag('attendants', 'Attendant management')
    .addTag('payments', 'Payment tracking')
    .addTag('subscriptions', 'Subscription management')
    .addTag('profiles', 'User profile management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('apitest/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/apitest`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/apitest/docs`);
}

bootstrap();

