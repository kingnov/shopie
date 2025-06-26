import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN';
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.userSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userData && token) {
      try {
        const user = JSON.parse(userData);
        // Validate token is not expired
        if (this.isTokenValid(token)) {
          this.userSubject.next(user);
        } else {
          console.warn('Token expired, clearing auth data');
          this.clearAuthData();
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage', error);
        this.clearAuthData();
      }
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Invalid token format', error);
      return false;
    }
  }

  private saveAuthData(user: User, token: string): void {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    this.userSubject.next(user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.userSubject.next(null);
  }

  register(email: string, password: string, firstName?: string, lastName?: string, phone?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      email,
      password,
      firstName,
      lastName,
      phone
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.saveAuthData(response.data.user, response.data.accessToken);
          this.notificationService.authSuccess('register');
        }
      }),
      catchError(error => {
        console.error('Registration error:', error);
        this.notificationService.authError('register', error);
        return throwError(() => error);
      })
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.saveAuthData(response.data.user, response.data.accessToken);
          this.notificationService.authSuccess('login');
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        this.notificationService.authError('login', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearAuthData();
    this.notificationService.authSuccess('logout');
    this.router.navigate(['/']);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, {
      token,
      newPassword
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/user/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      tap(response => {
        if (response.success) {
          this.notificationService.authSuccess('passwordChanged');
        }
      }),
      catchError(error => {
        console.error('Password change error:', error);
        this.notificationService.authError('passwordChange', error);
        return throwError(() => error);
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/user/profile`, userData).pipe(
      tap(response => {
        if (response.success && response.data) {
          const currentUser = this.userSubject.value;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...response.data };
            this.saveAuthData(updatedUser, localStorage.getItem('token') || '');
            this.notificationService.authSuccess('profileUpdated');
          }
        }
      }),
      catchError(error => {
        console.error('Profile update error:', error);
        this.notificationService.authError('profileUpdate', error);
        return throwError(() => error);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && this.isTokenValid(token);
  }

  isAdmin(): boolean {
    const user = this.userSubject.value;
    return user?.role === 'ADMIN' || false;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.saveAuthData(response.data.user, response.data.accessToken);
        }
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        // If refresh fails, logout the user
        this.logout();
        return throwError(() => error);
      })
    );
  }

  // Check if token is about to expire (within 5 minutes)
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - currentTime;
      // Return true if token expires within 5 minutes (300 seconds)
      return timeUntilExpiry < 300;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true; // Assume expiring if we can't parse
    }
  }

  // Automatically refresh token if it's expiring soon
  autoRefreshToken(): Observable<AuthResponse | null> {
    if (this.isLoggedIn() && this.isTokenExpiringSoon()) {
      console.log('Token expiring soon, refreshing...');
      return this.refreshToken();
    }
    return new Observable(observer => {
      observer.next(null);
      observer.complete();
    });
  }
}
