import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if token needs refresh before making the request
  return authService.autoRefreshToken().pipe(
    switchMap(() => {
      const token = authService.getToken();

      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            // Token expired or invalid
            authService.logout();
            router.navigate(['/auth/login'], {
              queryParams: { returnUrl: router.url }
            });
          }
          return throwError(() => error);
        })
      );
    })
  );
};
