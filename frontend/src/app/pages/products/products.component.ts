import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, ProductSearchParams } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;
  error = '';
  isAuthenticated = false;
  addingToCartProductId: string | null = null;

  // Search and filter properties
  searchTerm = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // Pagination properties
  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;
  productsPerPage = 12;
  hasNext = false;
  hasPrev = false;

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
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = '';

    const params: ProductSearchParams = {
      page: this.currentPage,
      limit: this.productsPerPage
    };

    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    if (this.minPrice !== null && this.minPrice > 0) {
      params.minPrice = this.minPrice;
    }

    if (this.maxPrice !== null && this.maxPrice > 0) {
      params.maxPrice = this.maxPrice;
    }

    this.productService.getProducts(params).subscribe({
      next: (response) => {
        this.products = response.data;
        this.currentPage = response.pagination.page;
        this.totalPages = response.pagination.totalPages;
        this.totalProducts = response.pagination.total;
        this.hasNext = response.pagination.hasNext;
        this.hasPrev = response.pagination.hasPrev;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load products';
        this.isLoading = false;
        console.error('Error loading products:', error);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.loadProducts();
  }

  onFilterChange(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.currentPage = 1;
    this.loadProducts();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.hasNext) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.hasPrev) {
      this.goToPage(this.currentPage - 1);
    }
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
}
