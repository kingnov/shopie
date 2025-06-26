import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Cart, CartItem, CartResponse } from '../models/cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private cartItemsCountSubject = new BehaviorSubject<number>(0);
  public cartItemsCount$ = this.cartItemsCountSubject.asObservable();
  private cartDataSubject = new BehaviorSubject<Cart | null>(null);
  public cartData$ = this.cartDataSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCartCount();
  }

  private loadCartCount(): void {
    if (localStorage.getItem('token')) {
      this.getCartItemsCount().subscribe({
        next: (response) => {
          this.cartItemsCountSubject.next(response.count);
        },
        error: (error) => {
          console.error('Failed to load cart count', error);
          // Reset cart count on error
          this.cartItemsCountSubject.next(0);
        }
      });
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('Cart service error:', error);
    // Add this for more detail:
    if (error && error.error) {
      console.error('Backend error:', error.error);
    }
    return throwError(() => error);
  }

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.apiUrl).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.cartItemsCountSubject.next(response.data.totalItems);
          this.cartDataSubject.next(response.data);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  addToCart(productId: string, quantity: number = 1): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.apiUrl}/add`, { productId, quantity }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.cartItemsCountSubject.next(response.data.totalItems);
          this.cartDataSubject.next(response.data);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateCartItem(itemId: string, quantity: number): Observable<CartResponse> {
    return this.http.put<CartResponse>(`${this.apiUrl}/items/${itemId}`, { quantity }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.cartItemsCountSubject.next(response.data.totalItems);
          this.cartDataSubject.next(response.data);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  removeFromCart(itemId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/items/${itemId}`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.cartItemsCountSubject.next(response.data.totalItems);
          this.cartDataSubject.next(response.data);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/clear`).pipe(
      tap(() => {
        this.cartItemsCountSubject.next(0);
        this.cartDataSubject.next(null);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getCartItemsCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/count`).pipe(
      tap(response => {
        this.cartItemsCountSubject.next(response.count);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // Method to refresh cart data
  refreshCart(): void {
    if (localStorage.getItem('token')) {
      this.getCart().subscribe({
        error: (error) => {
          console.error('Failed to refresh cart', error);
        }
      });
    }
  }

  // Method to clear local cart state (for logout)
  clearLocalCartState(): void {
    this.cartItemsCountSubject.next(0);
    this.cartDataSubject.next(null);
  }

  sendOrderCompleteEmail(data: {
    orderId: string;
    itemsCount: number;
    totalAmount: number;
    billingAddress?: string;
  }) {
    return this.http.post<any>(`${this.apiUrl}/send-order-complete-email`, data);
  }
}
