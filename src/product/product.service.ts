import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Product, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductsService, ProductSearchResult } from './product.interface';

@Injectable()
export class ProductService implements IProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      // Check if product with same name already exists
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          name: {
            equals: createProductDto.name,
            mode: 'insensitive',
          },
        },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this name already exists');
      }

      const product = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          shortDescription: createProductDto.shortDescription,
          price: createProductDto.price,
          imageUrl: createProductDto.imageUrl,
          stock: createProductDto.stock || 0,
          isActive:
            createProductDto.isActive !== undefined
              ? createProductDto.isActive
              : true,
        },
      });

      return product;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create product');
    }
  }

  async findAll(searchDto: SearchProductDto): Promise<ProductSearchResult> {
    const {
      search,
      minPrice,
      maxPrice,
      isActive,
      page = 1,
      limit = 10,
    } = searchDto;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          shortDescription: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    try {
      // Get total count for pagination
      const total = await this.prisma.product.count({ where });

      // Calculate pagination
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      // Get products
      const products = await this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch products', error);
    }
  }

  async findOne(id: number): Promise<Product | null> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch product');
    }
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    try {
      // Check if product exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // Check if updating name and if new name conflicts with another product
      if (
        updateProductDto.name &&
        updateProductDto.name !== existingProduct.name
      ) {
        const nameConflict = await this.prisma.product.findFirst({
          where: {
            name: {
              equals: updateProductDto.name,
              mode: 'insensitive',
            },
            id: {
              not: id,
            },
          },
        });

        if (nameConflict) {
          throw new ConflictException('Product with this name already exists');
        }
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...updateProductDto,
        },
      });

      return updatedProduct;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update product');
    }
  }

  async remove(id: number): Promise<Product> {
    try {
      // Check if product exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
        include: {
          cartItems: true,
        },
      });

      if (!existingProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // Check if product is in any carts
      if (existingProduct.cartItems.length > 0) {
        // Instead of hard delete, mark as inactive
        const updatedProduct = await this.prisma.product.update({
          where: { id },
          data: {
            isActive: false,
          },
        });

        return updatedProduct;
      }

      // If not in any carts, perform hard delete
      const deletedProduct = await this.prisma.product.delete({
        where: { id },
      });

      return deletedProduct;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete product');
    }
  }

  async decreaseStock(id: number, quantity: number): Promise<Product> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      if (product.stock < quantity) {
        throw new BadRequestException('Insufficient stock available');
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          stock: product.stock - quantity,
        },
      });

      return updatedProduct;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to decrease product stock');
    }
  }

  async increaseStock(id: number, quantity: number): Promise<Product> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          stock: product.stock + quantity,
        },
      });

      return updatedProduct;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to increase product stock');
    }
  }

  // Sample data generation method
  async generateSampleProducts(): Promise<Product[]> {
    const sampleProducts = [
      {
        name: 'iPhone 15 Pro Max',
        shortDescription:
          'Latest Apple flagship smartphone with titanium design and advanced camera system',
        price: 1199.99,
        imageUrl:
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
        stock: 25,
        isActive: true,
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        shortDescription:
          'Premium Android smartphone with S Pen and exceptional camera capabilities',
        price: 1099.99,
        imageUrl:
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500',
        stock: 30,
        isActive: true,
      },
      {
        name: 'MacBook Pro 14-inch',
        shortDescription:
          'Powerful laptop with M3 chip, perfect for professionals and creators',
        price: 1999.99,
        imageUrl:
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        stock: 15,
        isActive: true,
      },
      {
        name: 'Sony WH-1000XM5 Headphones',
        shortDescription:
          'Industry-leading noise canceling wireless headphones',
        price: 399.99,
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        stock: 50,
        isActive: true,
      },
      {
        name: 'iPad Air 5th Generation',
        shortDescription:
          'Versatile tablet with M1 chip for work and entertainment',
        price: 599.99,
        imageUrl:
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',
        stock: 20,
        isActive: true,
      },
      {
        name: 'Apple Watch Series 9',
        shortDescription:
          'Advanced smartwatch with health monitoring and fitness tracking',
        price: 429.99,
        imageUrl:
          'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500',
        stock: 35,
        isActive: true,
      },
      {
        name: 'Dell XPS 13 Laptop',
        shortDescription:
          'Ultra-portable laptop with stunning InfinityEdge display',
        price: 1299.99,
        imageUrl:
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        stock: 12,
        isActive: true,
      },
      {
        name: 'Nintendo Switch OLED',
        shortDescription:
          'Gaming console with vibrant OLED screen for home and portable gaming',
        price: 349.99,
        imageUrl:
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500',
        stock: 40,
        isActive: true,
      },
      {
        name: 'AirPods Pro 2nd Generation',
        shortDescription:
          'Premium wireless earbuds with active noise cancellation',
        price: 249.99,
        imageUrl:
          'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500',
        stock: 60,
        isActive: true,
      },
      {
        name: 'Samsung 4K Smart TV 55"',
        shortDescription:
          'Crystal clear 4K display with smart TV features and streaming apps',
        price: 799.99,
        imageUrl:
          'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500',
        stock: 8,
        isActive: true,
      },
    ];

    const createdProducts: Product[] = [];

    for (const productData of sampleProducts) {
      try {
        // Check if product already exists
        const existingProduct = await this.prisma.product.findFirst({
          where: {
            name: {
              equals: productData.name,
              mode: 'insensitive',
            },
          },
        });

        if (!existingProduct) {
          const product = await this.prisma.product.create({
            data: productData,
          });
          createdProducts.push(product);
        }
      } catch (error) {
        // Continue with next product if one fails
        console.warn(
          `Failed to create sample product ${productData.name}:`,
          error.message,
        );
      }
    }

    return createdProducts;
  }

  // Additional utility methods
  async findActiveProducts(
    searchDto: SearchProductDto,
  ): Promise<ProductSearchResult> {
    return this.findAll({ ...searchDto, isActive: true });
  }

  async findInStock(searchDto: SearchProductDto): Promise<ProductSearchResult> {
    const { search, minPrice, maxPrice, page = 1, limit = 10 } = searchDto;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      stock: {
        gt: 0,
      },
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          shortDescription: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    try {
      const total = await this.prisma.product.count({ where });
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      const products = await this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch in-stock products');
    }
  }

  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    inStock: number;
    outOfStock: number;
  }> {
    try {
      const [total, active, inactive, inStock, outOfStock] = await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.product.count({ where: { isActive: false } }),
        this.prisma.product.count({ where: { stock: { gt: 0 } } }),
        this.prisma.product.count({ where: { stock: 0 } }),
      ]);

      return {
        total,
        active,
        inactive,
        inStock,
        outOfStock,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch product statistics');
    }
  }
}
