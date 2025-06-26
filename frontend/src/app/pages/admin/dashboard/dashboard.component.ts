import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  sidebarOpen = false;
  currentUser: any = null;

  navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      route: '/admin'
    },
    {
      label: 'Products',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10',
      route: '/admin/products'
    },
    {
      label: 'Users',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      route: '/admin/users'
    },
    {
      label: 'Orders',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      route: '/admin/orders'
    }
  ];

  breadcrumbs: BreadcrumbItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.updateActiveNavigation();
    this.updateBreadcrumbs();

    // Listen to route changes to update navigation
    this.router.events.subscribe(() => {
      this.updateActiveNavigation();
      this.updateBreadcrumbs();
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  logout() {
    this.authService.logout();
  }

  private updateActiveNavigation() {
    const currentUrl = this.router.url;
    this.navigationItems.forEach(item => {
      item.active = currentUrl.startsWith(item.route);
    });
  }

  private updateBreadcrumbs() {
    const url = this.router.url;
    this.breadcrumbs = [{ label: 'Admin', route: '/admin' }];

    if (url.includes('/products')) {
      this.breadcrumbs.push({ label: 'Products', route: '/admin/products' });
    } else if (url.includes('/users')) {
      this.breadcrumbs.push({ label: 'Users', route: '/admin/users' });
    } else if (url.includes('/orders')) {
      this.breadcrumbs.push({ label: 'Orders', route: '/admin/orders' });
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeSidebar();
  }
}
