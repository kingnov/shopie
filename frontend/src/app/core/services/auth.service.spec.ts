import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, User } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    role: 'CUSTOMER',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAuthResponse = {
    success: true,
    data: {
      user: mockUser,
      accessToken: 'mock.jwt.token'
    },
    message: 'Success'
  };

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const notificationSpyObj = jasmine.createSpyObj('NotificationService', [
      'authSuccess', 'authError', 'authWarning', 'authInfo'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpyObj },
        { provide: NotificationService, useValue: notificationSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    notificationSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login user successfully', () => {
      service.login('test@example.com', 'password123').subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(service.isLoggedIn()).toBeTruthy();
        expect(service.getCurrentUser()).toEqual(mockUser);
        expect(notificationSpy.authSuccess).toHaveBeenCalledWith('login');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'password123'
      });
      req.flush(mockAuthResponse);
    });

    it('should handle login error', () => {
      const errorResponse = { error: { message: 'Invalid credentials' } };

      service.login('test@example.com', 'wrongpassword').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          expect(notificationSpy.authError).toHaveBeenCalledWith('login', errorResponse);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    it('should register user successfully', () => {
      service.register('test@example.com', 'password123', 'Test', 'User', '+1234567890').subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(service.isLoggedIn()).toBeTruthy();
        expect(notificationSpy.authSuccess).toHaveBeenCalledWith('register');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890'
      });
      req.flush(mockAuthResponse);
    });
  });

  describe('token validation', () => {
    it('should validate token correctly', () => {
      // Mock a valid token (expires in future)
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;

      localStorage.setItem('token', validToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      // Reload user from storage
      service = TestBed.inject(AuthService);

      expect(service.isLoggedIn()).toBeTruthy();
    });

    it('should handle expired token', () => {
      // Mock an expired token
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = `header.${btoa(JSON.stringify({ exp: pastTime }))}.signature`;

      localStorage.setItem('token', expiredToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      // Reload user from storage
      service = TestBed.inject(AuthService);

      expect(service.isLoggedIn()).toBeFalsy();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should logout user and clear data', () => {
      // Set up logged in state
      localStorage.setItem('token', 'mock.token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(notificationSpy.authSuccess).toHaveBeenCalledWith('logout');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('token refresh', () => {
    it('should refresh token successfully', () => {
      // Set up logged in state
      localStorage.setItem('token', 'old.token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(localStorage.getItem('token')).toBe('mock.jwt.token');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAuthResponse);
    });
  });

  describe('role checking', () => {
    it('should correctly identify admin user', () => {
      const adminUser = { ...mockUser, role: 'ADMIN' as const };
      localStorage.setItem('user', JSON.stringify(adminUser));

      // Reload service to pick up user data
      service = TestBed.inject(AuthService);

      expect(service.isAdmin()).toBeTruthy();
    });

    it('should correctly identify customer user', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));

      // Reload service to pick up user data
      service = TestBed.inject(AuthService);

      expect(service.isAdmin()).toBeFalsy();
    });
  });
});
