import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProductService, Product } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { OfferDialogComponent } from '../../shared/components/offer-dialog/offer-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, OfferDialogComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  newArrivals: Product[] = [];
  isLoading = true;
  error = '';
  isAuthenticated = false;
  addingToCartProductId: string | null = null;
  showOfferDialog = false;
  offerProduct: Product | null = null;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check authentication status
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
    });

    this.loadProducts();

    // Show offer dialog only once per session
    if (!sessionStorage.getItem('offerDialogShown')) {
      this.showOfferDialog = true;
      sessionStorage.setItem('offerDialogShown', '1');
    }
  }

  loadProducts(): void {
    this.productService.getProducts({ limit: 8 }).subscribe({
      next: (response) => {
        const products = response.data;
        this.featuredProducts = products.slice(0, 4);
        this.newArrivals = products.slice(4, 8);
        this.isLoading = false;
        // Set offer product as first product
        if (!this.offerProduct && products.length > 0) {
          this.offerProduct = products[0];
        }
      },
      error: (error) => {
        this.error = 'Failed to load products';
        this.isLoading = false;
        console.error('Error loading products:', error);
      }
    });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/images/placeholder.png';
    }
  }

  addToCart(product: Product): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (product.stock === 0) {
      return;
    }

    this.addingToCartProductId = product.id;
    this.cartService.addToCart(product.id, 1).subscribe({
      next: (response) => {
        if (response.success) {
          // Show success feedback (could be a toast notification)
          console.log('Product added to cart successfully');
        }
        this.addingToCartProductId = null;
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.addingToCartProductId = null;
        // Show error feedback
      }
    });
  }

  closeOfferDialog() {
    this.showOfferDialog = false;
  }
}
