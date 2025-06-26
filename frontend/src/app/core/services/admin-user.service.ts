import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'ADMIN' | 'CUSTOMER';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'ADMIN' | 'CUSTOMER';
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'ADMIN' | 'CUSTOMER';
}

export interface UserSearchParams {
  search?: string;
  role?: 'ADMIN' | 'CUSTOMER';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: PaginationResult;
  message: string;
}

export interface UserResponse {
  success: boolean;
  data: User;
  message: string;
}

export interface UserStatsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    adminUsers: number;
    customerUsers: number;
    recentUsers: number;
    userGrowth: {
      last30Days: number;
    };
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private apiUrl = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  // CRUD Operations
  createUser(user: CreateUserDto): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, user);
  }

  getUsers(params: UserSearchParams = {}): Observable<UsersResponse> {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<UsersResponse>(this.apiUrl, { params: httpParams });
  }

  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: string, user: UpdateUserDto): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: string): Observable<{ success: boolean; data: null; message: string }> {
    return this.http.delete<{ success: boolean; data: null; message: string }>(`${this.apiUrl}/${id}`);
  }

  // Role Management
  updateUserRole(id: string, role: 'ADMIN' | 'CUSTOMER'): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/${id}/role`, { role });
  }

  // Statistics
  getUserStats(): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`${this.apiUrl}/stats/overview`);
  }

  // Search and Filter Helpers
  searchUsers(searchTerm: string, page: number = 1, limit: number = 10): Observable<UsersResponse> {
    return this.getUsers({ search: searchTerm, page, limit });
  }

  getUsersByRole(role: 'ADMIN' | 'CUSTOMER', page: number = 1, limit: number = 10): Observable<UsersResponse> {
    return this.getUsers({ role, page, limit });
  }

  // Validation Helpers
  validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  // Format Helpers
  getFullName(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    }
    return user.email;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
