import { Cart, CartItem, Product } from '@prisma/client';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';


export type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product;
  })[];
};

export interface ICartService {
  getOrCreateCart(userId: number): Promise<Cart>;
  getCartWithItems(userId: number): Promise<CartResponseDto>;
  addToCart(userId: number, addToCartDto: AddToCartDto): Promise<CartResponseDto>;
  updateCartItem(userId: number, itemId: number, updateDto: UpdateCartItemDto): Promise<CartResponseDto>;
  removeFromCart(userId: number, itemId: number): Promise<CartResponseDto>;
  clearCart(userId: number): Promise<void>;
}