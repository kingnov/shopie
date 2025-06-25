import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // Debug: Check if environment variables are loaded
  console.log('🔍 Environment Variables Check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('MAIL_USER:', process.env.MAIL_USER ? '✅ Loaded' : '❌ Missing');
  console.log('MAIL_PASS:', process.env.MAIL_PASS ? '✅ Loaded' : '❌ Missing');
  console.log(
    'DATABASE_URL:',
    process.env.DATABASE_URL ? '✅ Loaded' : '❌ Missing',
  );
  console.log(
    'JWT_SECRET:',
    process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing',
  );
  console.log(
    'FRONTEND_URL:',
    process.env.FRONTEND_URL ? '✅ Loaded' : '❌ Missing',
  );

  const app = await NestFactory.create(AppModule);

  // Add global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Set global prefix to match your test file expectations
  app.setGlobalPrefix('api');

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL]
        : [
            'http://localhost:4200',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
          ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Shopie API')
    .setDescription('The Shopie online store API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('products', 'Product management endpoints')
    .addTag('cart', 'Shopping cart endpoints')
    .addTag('upload', 'File upload endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.shopie.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      displayRequestDuration: true,
    },
    customSiteTitle: 'Shopie API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  // Create default admin user if it doesn't exist
  try {
    const authService = app.get(AuthService);
    await authService.createAdminUser();
    console.log('✅ Admin user check completed');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }

  // Add health check endpoint
  app.use('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('🚀 Application is running on: http://localhost:' + port);
  console.log('📚 API Documentation: http://localhost:' + port + '/api/docs');
  console.log('❤️  Health Check: http://localhost:' + port + '/health');
  console.log('🔐 Auth Endpoints: http://localhost:' + port + '/api/auth');
  console.log('🛒 Cart Endpoints: http://localhost:' + port + '/api/cart');
  console.log(
    '📦 Product Endpoints: http://localhost:' + port + '/api/products',
  );

  // Display available routes
  console.log('\n📋 Available Auth Routes:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/forgot-password');
  console.log('  POST /api/auth/reset-password');

  console.log('\n🛒 Available Cart Routes:');
  console.log('  GET /api/cart');
  console.log('  POST /api/cart/add');
  console.log('  PUT /api/cart/items/:itemId');
  console.log('  DELETE /api/cart/items/:itemId');
  console.log('  DELETE /api/cart/clear');
  console.log('  GET /api/cart/count');

  console.log('\n📦 Available Product Routes:');
  console.log('  GET /api/products');
  console.log('  GET /api/products/in-stock');
  console.log('  GET /api/products/stats (Admin)');
  console.log('  GET /api/products/:id');
  console.log('  POST /api/products (Admin)');
  console.log('  PATCH /api/products/:id (Admin)');
  console.log('  DELETE /api/products/:id (Admin)');
}

bootstrap().catch((error) => {
  console.error('❌ Error starting application:', error);
  process.exit(1);
});
