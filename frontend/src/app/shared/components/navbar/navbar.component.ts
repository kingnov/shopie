import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // Adjust path as needed

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  scrolled = false;
  menuOpen = false;
  isProfileDropdownOpen = false;

  cartItemCount = 2; // Replace with cart service observable if available
  currentUser: any = null; // Replace 'any' with your User model

  constructor(private authService: AuthService, public router: Router) { // <-- change 'private' to 'public'
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    // Subscribe to cart count if you have a cart service
    // this.cartService.cartItemsCount$.subscribe(count => this.cartItemCount = count);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 20;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const nav = target.closest('nav');
    if (!nav && this.menuOpen) {
      this.menuOpen = false;
    }
    if (!nav && this.isProfileDropdownOpen) {
      this.isProfileDropdownOpen = false;
    }
  }

  @HostListener('window:resize', [])
  onResize() {
    if (window.innerWidth >= 768 && this.menuOpen) {
      this.menuOpen = false;
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // Optional: Add search functionality
  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const query = input.value.trim();
    if (query) {
      // Implement your search logic here
      console.log('Searching for:', query);
    }
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch(event);
    }
  }
}