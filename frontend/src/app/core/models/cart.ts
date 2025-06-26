import { Product } from './product';

export interface CartItem {
  id: string;
  quantity: number;
  addedAt: string;
  product: Product;
  totalPrice: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  success: boolean;
  data: Cart;
  message: string;
}
