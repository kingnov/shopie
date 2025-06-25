import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseIntPipe,
  UseGuards 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { Product, Role } from '@prisma/client';

import { ProductService } from './product.service';
import { ApiResponse as CustomApiResponse, PaginatedResponse } from '../common/dto/response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../common/decorator/public.decorator';

import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductService) {}

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Get all products',
    description: 'Retrieve paginated list of products with optional search and filters' 
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for product name' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 1,
            name: 'iPhone 14',
            shortDescription: 'Latest Apple smartphone',
            price: 999.99,
            imageUrl: 'https://example.com/image.jpg',
            stock: 50,
            isActive: true,
            createdAt: '2025-01-20T10:00:00.000Z',
            updatedAt: '2025-01-20T10:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
        message: 'Products retrieved successfully',
      },
    },
  })
  async findAll(@Query() query: SearchProductDto): Promise<PaginatedResponse<Product>> {
    const result = await this.productsService.findAll(query);
    return {
      success: true,
      data: result.products,
      pagination: result.pagination,
      message: 'Products retrieved successfully',
    };
  }

  @Get('in-stock')
  @Public()
  @ApiOperation({ 
    summary: 'Get products in stock',
    description: 'Retrieve paginated list of products that are active and have stock > 0' 
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for product name' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async findInStock(@Query() query: SearchProductDto): Promise<PaginatedResponse<Product>> {
    const result = await this.productsService.findInStock(query);
    return {
      success: true,
      data: result.products,
      pagination: result.pagination,
      message: 'In-stock products retrieved successfully',
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get product statistics',
    description: 'Get product statistics (Admin only)'
  })
  async getStats(): Promise<CustomApiResponse<any>> {
    const stats = await this.productsService.getProductStats();
    return {
      success: true,
      data: stats,
      message: 'Product statistics retrieved successfully',
    };
  }

  @Post('generate-sample-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate sample products',
    description: 'Generate 10 sample products in the database (Admin only)'
  })
  @ApiResponse({
    status: 201,
    description: 'Sample products generated successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 1,
            name: 'iPhone 15 Pro Max',
            shortDescription: 'Latest Apple flagship smartphone with titanium design and advanced camera system',
            price: 1199.99,
            imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
            stock: 25,
            isActive: true,
            createdAt: '2025-01-20T10:00:00.000Z',
            updatedAt: '2025-01-20T10:00:00.000Z',
          },
        ],
        message: 'Sample products generated successfully',
      },
    },
  })
  async generateSampleData(): Promise<CustomApiResponse<Product[]>> {
    const products = await this.productsService.generateSampleProducts();
    return {
      success: true,
      data: products,
      message: `${products.length} sample products generated successfully`,
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    schema: {
      example: {
        success: true,
        data: {
          id: 1,
          name: 'iPhone 14',
          shortDescription: 'Latest Apple smartphone',
          price: 999.99,
          imageUrl: 'https://example.com/image.jpg',
          stock: 50,
          isActive: true,
          createdAt: '2025-01-20T10:00:00.000Z',
          updatedAt: '2025-01-20T10:00:00.000Z',
        },
        message: 'Product retrieved successfully',
      },
    },
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CustomApiResponse<Product>> {
    const product = await this.productsService.findOne(id);
    return {
      success: true,
      data: product,
      message: 'Product retrieved successfully',
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create new product',
    description: 'Create a new product (Admin only)' 
  })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  async create(@Body() createProductDto: CreateProductDto): Promise<CustomApiResponse<Product>> {
    const product = await this.productsService.create(createProductDto);
    return {
      success: true,
      data: product,
      message: 'Product created successfully',
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update product',
    description: 'Update an existing product (Admin only)' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<CustomApiResponse<Product>> {
    const product = await this.productsService.update(id, updateProductDto);
    return {
      success: true,
      data: product,
      message: 'Product updated successfully',
    };
  }

  @Patch(':id/stock/increase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Increase product stock',
    description: 'Increase stock for a product (Admin only)' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        quantity: { type: 'number', minimum: 1 } 
      },
      required: ['quantity']
    } 
  })
  async increaseStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) quantity: number,
  ): Promise<CustomApiResponse<Product>> {
    const product = await this.productsService.increaseStock(id, quantity);
    return {
      success: true,
      data: product,
      message: `Product stock increased by ${quantity}`,
    };
  }

  @Patch(':id/stock/decrease')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Decrease product stock',
    description: 'Decrease stock for a product (Admin only)' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        quantity: { type: 'number', minimum: 1 } 
      },
      required: ['quantity']
    } 
  })
  async decreaseStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) quantity: number,
  ): Promise<CustomApiResponse<Product>> {
    const product = await this.productsService.decreaseStock(id, quantity);
    return {
      success: true,
      data: product,
      message: `Product stock decreased by ${quantity}`,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Delete product',
    description: 'Delete a product (Admin only). If product is in carts, it will be marked as inactive instead.' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Product ID' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<CustomApiResponse<Product>> {
    const product = await this.productsService.remove(id);
    const message = product.isActive === false 
      ? 'Product marked as inactive (was in use)' 
      : 'Product deleted successfully';
    
    return {
      success: true,
      data: product,
      message,
    };
  }
}