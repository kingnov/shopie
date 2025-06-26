import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      }
    ]
  },
  {
    path: 'products',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent),
        data: { filter: 'new' }
      },
      {
        path: 'featured',
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent),
        data: { filter: 'featured' }
      },
      {
        path: 'sale',
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent),
        data: { filter: 'sale' }
      }
    ]
  },
  {
    path: 'cart',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'user',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent),
        data: { view: 'orders' }
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/admin/overview/overview.component').then(m => m.OverviewComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/admin/product-management/product-management.component').then(m => m.ProductManagementComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/admin/product-management/product-management.component').then(m => m.ProductManagementComponent),
        data: { view: 'orders' }
      }
    ]
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    data: { view: 'about' }
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    data: { view: 'contact' }
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    data: { view: 'privacy' }
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    data: { view: 'terms' }
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found-component/not-found-component.component').then(m => m.NotFoundComponentComponent)
  }
];
