import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Shopie API')
  .setDescription(`
    # Shopie API Documentation
    
    Welcome to the Shopie online store API. This API provides endpoints for:
    
    - **Authentication**: User registration, login, password reset
    - **Products**: Product management (CRUD operations)
    - **Cart**: Shopping cart functionality
    - **Users**: User management
    - **Upload**: File upload to Cloudinary
    
    ## Authentication
    
    Most endpoints require authentication via JWT token. 
    
    1. Register/Login to get a token
    2. Click "Authorize" button above
    3. Enter your token in the format: \`Bearer YOUR_TOKEN\`
    
    ## Roles
    
    - **CUSTOMER**: Can view products, manage cart, update profile
    - **ADMIN**: Full access to all endpoints including product management
  `)
  .setVersion('1.0.0')
  .setContact('Shopie Team', 'https://shopie.com', 'support@shopie.com')
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addTag('auth', 'Authentication and authorization')
  .addTag('users', 'User management')
  .addTag('products', 'Product catalog management')
  .addTag('cart', 'Shopping cart operations')
  .addTag('upload', 'File upload operations')
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