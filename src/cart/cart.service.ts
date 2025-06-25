import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cart, CartItem } from '@prisma/client';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto, CartItemResponseDto } from './dto/cart-response.dto';
import { CartWithItems, ICartService } from './cart.interface';

@Injectable()
export class CartService implements ICartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  async getCartWithItems(userId: number): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    
    const cartWithItems = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });

    return this.formatCartResponse(cartWithItems);
  }

  async addToCart(userId: number, addToCartDto: AddToCartDto): Promise<CartResponseDto> {
    const { productId, quantity } = addToCartDto;

    // Verify product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Only ${product.stock} items available in stock`);
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        throw new BadRequestException(`Only ${product.stock} items available in stock`);
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Update cart updatedAt timestamp
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    return this.getCartWithItems(userId);
  }

  async updateCartItem(userId: number, itemId: number, updateDto: UpdateCartItemDto): Promise<CartResponseDto> {
    const { quantity } = updateDto;

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      include: {
        product: true,
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.product.stock < quantity) {
      throw new BadRequestException(`Only ${cartItem.product.stock} items available in stock`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    // Update cart updatedAt timestamp
    await this.prisma.cart.update({
      where: { id: cartItem.cartId },
      data: { updatedAt: new Date() },
    });

    return this.getCartWithItems(userId);
  }

  async removeFromCart(userId: number, itemId: number): Promise<CartResponseDto> {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Update cart updatedAt timestamp
    await this.prisma.cart.update({
      where: { id: cartItem.cartId },
      data: { updatedAt: new Date() },
    });

    return this.getCartWithItems(userId);
  }

  async clearCart(userId: number): Promise<void> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Update cart updatedAt timestamp
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() },
      });
    }
  }

  async getCartItemsCount(userId: number): Promise<number> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      return 0;
    }

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  private formatCartResponse(cart: CartWithItems): CartResponseDto {
    if (!cart) {
      return {
        id: 0,
        userId: 0,
        items: [],
        totalItems: 0,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const items: CartItemResponseDto[] = cart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      addedAt: item.addedAt,
      product: item.product,
      totalPrice: Number(item.product.price) * item.quantity,
    }));

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      totalItems,
      totalAmount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
