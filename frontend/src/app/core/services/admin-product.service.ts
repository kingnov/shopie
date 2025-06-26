import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductsResponse, ProductResponse, ProductSearchParams, PaginationResult } from './product.service';

export interface CreateProductDto {
  name: string;
  shortDescription: string;
  description?: string;
  price: number;
  imageUrl: string;
  images?: string[];
  sku?: string;
  category?: string;
  stock?: number;
  isActive?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  shortDescription?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  images?: string[];
  sku?: string;
  category?: string;
  stock?: number;
  isActive?: boolean;
}

export interface StockUpdateDto {
  quantity: number;
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  inStock: number;
  outOfStock: number;
  totalValue: number;
  averagePrice: number;
  categories: { [key: string]: number };
}

export interface ProductStatsResponse {
  success: boolean;
  data: ProductStats;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminProductService {
  private apiUrl = `${environment.apiUrl}/admin/products`;

  constructor(private http: HttpClient) {}

  // CRUD Operations
  createProduct(product: CreateProductDto): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.apiUrl, product);
  }

  getProducts(params: ProductSearchParams = {}): Observable<ProductsResponse> {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<ProductsResponse>(this.apiUrl, { params: httpParams });
  }

  getProductById(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`);
  }

  updateProduct(id: string, product: UpdateProductDto): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<ProductResponse> {
    return this.http.delete<ProductResponse>(`${this.apiUrl}/${id}`);
  }

  // Stock Management
  increaseStock(id: string, quantity: number): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.apiUrl}/${id}/stock/increase`, { quantity });
  }

  decreaseStock(id: string, quantity: number): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.apiUrl}/${id}/stock/decrease`, { quantity });
  }

  // Statistics and Analytics
  getProductStats(): Observable<ProductStatsResponse> {
    return this.http.get<ProductStatsResponse>(`${this.apiUrl}/stats/overview`);
  }

  // Utility Methods
  generateSampleData(): Observable<ProductsResponse> {
    return this.http.post<ProductsResponse>(`${this.apiUrl}/generate-sample-data`, {});
  }

  // Search and Filter Helpers
  searchProducts(searchTerm: string, page: number = 1, limit: number = 10): Observable<ProductsResponse> {
    return this.getProducts({ search: searchTerm, page, limit });
  }

  getProductsByCategory(category: string, page: number = 1, limit: number = 10): Observable<ProductsResponse> {
    return this.getProducts({ category, page, limit });
  }

  getActiveProducts(page: number = 1, limit: number = 10): Observable<ProductsResponse> {
    return this.getProducts({ isActive: true, page, limit });
  }

  getInactiveProducts(page: number = 1, limit: number = 10): Observable<ProductsResponse> {
    return this.getProducts({ isActive: false, page, limit });
  }

  getProductsByPriceRange(minPrice: number, maxPrice: number, page: number = 1, limit: number = 10): Observable<ProductsResponse> {
    return this.getProducts({ minPrice, maxPrice, page, limit });
  }

  // Bulk Operations (for future enhancement)
  bulkUpdateStatus(productIds: string[], isActive: boolean): Observable<any> {
    // This would require a backend endpoint for bulk operations
    // For now, we'll implement it as individual calls
    const updates = productIds.map(id => this.updateProduct(id, { isActive }));
    return new Observable(observer => {
      Promise.all(updates.map(update => update.toPromise()))
        .then(results => {
          observer.next({ success: true, data: results, message: 'Bulk update completed' });
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  // Validation Helpers
  validateSku(sku: string): boolean {
    // Basic SKU validation - alphanumeric with hyphens
    const skuPattern = /^[A-Z0-9-]+$/;
    return skuPattern.test(sku);
  }

  validatePrice(price: number): boolean {
    return price > 0 && Number.isFinite(price);
  }

  validateStock(stock: number): boolean {
    return Number.isInteger(stock) && stock >= 0;
  }

  // Format Helpers
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  formatStock(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock === 1) return '1 item left';
    return `${stock} items in stock`;
  }

  getStockStatus(stock: number): 'in-stock' | 'low-stock' | 'out-of-stock' {
    if (stock === 0) return 'out-of-stock';
    if (stock <= 5) return 'low-stock';
    return 'in-stock';
  }
}
