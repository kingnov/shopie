import { ApiProperty } from '@nestjs/swagger';
import { Product } from '@prisma/client';

export class CartItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  addedAt: Date;

  @ApiProperty()
  product: Product;

  @ApiProperty()
  totalPrice: number;
}

export class CartResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}