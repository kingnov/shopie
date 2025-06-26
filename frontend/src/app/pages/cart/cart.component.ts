import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { Cart, CartItem } from '../../core/models/cart';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ConfirmDialogComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  isLoading = true;
  error = '';
  isUpdating = false;
  updatingItemId: string | null = null;

  // Dialog state:
  showConfirmDialog = false;
  confirmDialogData: ConfirmDialogData = {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning'
  };
  confirmDialogOnConfirm: () => void = () => {};
  confirmDialogOnCancel: () => void = () => { this.showConfirmDialog = false; };

  // Track local quantities for each cart item
  localQuantities: { [itemId: string]: number } = {};

  // Checkout state
  isCheckingOut = false;
  checkoutSuccess = false;
  checkoutError = '';

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.isLoading = true;
    this.cartService.getCart().subscribe({
      next: (response) => {
        if (response.success) {
          this.cart = response.data;
          // Initialize local quantities
          this.localQuantities = {};
          this.cart.items.forEach(item => {
            this.localQuantities[item.id] = item.quantity;
          });
        } else {
          this.error = 'Failed to load cart';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load cart';
        this.isLoading = false;
        console.error('Error loading cart:', error);
      }
    });
  }

  // Handle manual input
  onQuantityInput(item: CartItem, event: any): void {
    let value = Number(event.target.value);
    if (isNaN(value) || value < 1) value = 1;
    if (value > item.product.stock) value = item.product.stock;
    this.localQuantities[item.id] = value;
  }

  // Handle increment
  increaseQuantity(item: CartItem): void {
    let value = this.localQuantities[item.id] || item.quantity;
    if (value < item.product.stock) {
      this.localQuantities[item.id] = value + 1;
    }
  }

  // Handle decrement
  decreaseQuantity(item: CartItem): void {
    let value = this.localQuantities[item.id] || item.quantity;
    if (value > 1) {
      this.localQuantities[item.id] = value - 1;
    }
  }

  // Call this on checkout or when user clicks "Update Cart"
  updateAllQuantities(): void {
    if (!this.cart) return;
    this.isUpdating = true;
    const updates = this.cart.items
      .filter(item => this.localQuantities[item.id] !== item.quantity)
      .map(item =>
        this.cartService.updateCartItem(item.id, this.localQuantities[item.id]).toPromise()
      );
    Promise.all(updates)
      .then(() => this.loadCart())
      .finally(() => (this.isUpdating = false));
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder.png';
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (!item || !item.product) return;
    if (newQuantity < 1 || newQuantity > item.product.stock) return;
    if (item.quantity === newQuantity) return;

    this.updatingItemId = item.id;
    this.cartService.updateCartItem(item.id, newQuantity).subscribe({
      next: (response) => {
        if (response.success) {
          this.cart = response.data;
        }
        this.updatingItemId = null;
      },
      error: (error) => {
        console.error('Error updating cart item:', error);
        this.updatingItemId = null;
      }
    });
  }

  openConfirmDialog(data: ConfirmDialogData, onConfirm: () => void): void {
    this.confirmDialogData = data;
    this.confirmDialogOnConfirm = () => {
      onConfirm();
      this.showConfirmDialog = false;
    };
    this.showConfirmDialog = true;
  }

  removeItem(item: CartItem): void {
    this.openConfirmDialog(
      {
        title: 'Remove Item',
        message: 'Are you sure you want to remove this item from your cart?',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        type: 'danger'
      },
      () => {
        this.updatingItemId = item.id;
        this.cartService.removeFromCart(item.id).subscribe({
          next: (response) => {
            if (response.success) {
              this.cart = response.data;
            }
            this.updatingItemId = null;
          },
          error: (error) => {
            console.error('Error removing cart item:', error);
            this.updatingItemId = null;
          }
        });
      }
    );
  }

  clearCart(): void {
    this.openConfirmDialog(
      {
        title: 'Clear Cart',
        message: 'Are you sure you want to clear your entire cart?',
        confirmText: 'Clear',
        cancelText: 'Cancel',
        type: 'danger'
      },
      () => {
        this.isUpdating = true;
        this.cartService.clearCart().subscribe({
          next: () => {
            this.loadCart();
            this.isUpdating = false;
          },
          error: (error) => {
            console.error('Error clearing cart:', error);
            this.isUpdating = false;
          }
        });
      }
    );
  }

  makePayment(): void {
    if (!this.cart) return;
    this.isCheckingOut = true;
    this.checkoutSuccess = false;
    this.checkoutError = '';

    this.cartService.sendOrderCompleteEmail({
      orderId: 'ORDER-' + Date.now(),
      itemsCount: this.getTotalItems(),
      totalAmount: this.getTotalPrice(),
      billingAddress: 'Nairobi, Kenya',
    }).subscribe({
      next: (res: any) => {
        this.isCheckingOut = false;
        if (res.success) {
          this.checkoutSuccess = true;
          this.cartService.clearCart().subscribe(() => this.loadCart());
        } else {
          this.checkoutError = res.message || 'Failed to send order email';
        }
      },
      error: (err: any) => {
        this.isCheckingOut = false;
        this.checkoutError = 'Payment failed. Please try again.';
      }
    });
  }

  getItemSubtotal(item: CartItem, quantity?: number): number {
    const qty = quantity !== undefined ? quantity : (this.localQuantities[item.id] || item.quantity);
    return item.product.price * qty;
  }

  getTotalPrice(): number {
    if (!this.cart || !this.cart.items) {
      return 0;
    }
    return this.cart.items.reduce(
      (total, item) => total + this.getItemSubtotal(item, this.localQuantities[item.id] || item.quantity),
      0
    );
  }

  getTotalItems(): number {
    if (!this.cart || !this.cart.items) {
      return 0;
    }
    return this.cart.items.reduce((total, item) => total + item.quantity, 0);
  }
}
