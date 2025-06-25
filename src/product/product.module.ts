import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductsController } from './product.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProductService],
  controllers: [ProductsController],
  exports: [ProductService],
})
export class ProductModule {}
