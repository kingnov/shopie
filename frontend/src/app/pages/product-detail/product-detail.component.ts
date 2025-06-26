import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  isLoading = true;
  error = '';
  quantity = 1;
  isAddingToCart = false;
  isAuthenticated = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check authentication status
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
    });

    // Get product ID from route
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    } else {
      this.error = 'Invalid product ID';
      this.isLoading = false;
    }
  }

  loadProduct(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.product = response.data;
        } else {
          this.error = 'Product not found';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load product details';
        this.isLoading = false;
        console.error('Error loading product:', error);
      }
    });
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder.png';
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  // Only call addToCart() when user clicks the button
  addToCart(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login']);
      return;
    }
    if (!this.product) return;
    if (this.quantity > this.product.stock) {
      // Optionally show a toast/modal: "Not enough stock"
      return;
    }
    this.isAddingToCart = true;
    this.cartService.addToCart(this.product.id, this.quantity).subscribe({
      next: (response) => {
        if (response.success) {
          // Show success message/modal
          this.quantity = 1;
        }
        this.isAddingToCart = false;
      },
      error: (error) => {
        // Show error message/modal
        this.isAddingToCart = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
