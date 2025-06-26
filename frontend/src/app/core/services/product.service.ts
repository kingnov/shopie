import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  description?: string;
  price: number;
  imageUrl: string;
  images?: string[];
  sku?: string;
  category?: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: PaginationResult;
  message: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product;
  message: string;
}

export interface ProductSearchParams {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  category?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

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

  getFeaturedProducts(): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(`${this.apiUrl}/featured`);
  }

  getNewArrivals(): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(`${this.apiUrl}/new`);
  }

  getSaleProducts(): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(`${this.apiUrl}/sale`);
  }

  createProduct(product: Partial<Product>): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.apiUrl, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<ProductResponse> {
    return this.http.delete<ProductResponse>(`${this.apiUrl}/${id}`);
  }
}
