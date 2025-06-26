import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminProductService, ProductStats } from '../../../core/services/admin-product.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements OnInit {
  stats: ProductStats | null = null;
  loading = true;
  error: string | null = null;

  constructor(private adminProductService: AdminProductService) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.error = null;

    this.adminProductService.getProductStats().subscribe({
      next: (response) => {
        this.stats = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load statistics';
        this.loading = false;
        console.error('Error loading stats:', error);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  getStockStatusColor(inStock: number, total: number): string {
    const percentage = (inStock / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  getCategoryEntries(): Array<{key: string, value: number}> {
    if (!this.stats?.categories) return [];
    return Object.entries(this.stats.categories).map(([key, value]) => ({ key, value }));
  }
}
