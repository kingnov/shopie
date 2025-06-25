import { Product, Prisma } from '@prisma/client';

import { PaginatedResponse } from '../common/dto/response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface ProductSearchResult {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface IProductsService {
  create(createProductDto: CreateProductDto): Promise<Product>;
  findAll(searchDto: SearchProductDto): Promise<ProductSearchResult>;
  findOne(id: number): Promise<Product | null>;
  update(id: number, updateProductDto: UpdateProductDto): Promise<Product>;
  remove(id: number): Promise<Product>;
  decreaseStock(id: number, quantity: number): Promise<Product>;
  increaseStock(id: number, quantity: number): Promise<Product>;
  generateSampleProducts(): Promise<Product[]>;
}