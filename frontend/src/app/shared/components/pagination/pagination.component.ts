import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationResult } from '../../../core/services/product.service';

export interface PageChangeEvent {
  page: number;
  limit: number;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent implements OnChanges {
  @Input() pagination: PaginationResult | null = null;
  @Input() showInfo: boolean = true;
  @Input() showSizeSelector: boolean = true;
  @Input() pageSizes: number[] = [10, 25, 50, 100];

  @Output() pageChange = new EventEmitter<PageChangeEvent>();

  visiblePages: number[] = [];
  maxVisiblePages = 5;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pagination'] && this.pagination) {
      this.calculateVisiblePages();
    }
  }

  private calculateVisiblePages() {
    if (!this.pagination) return;

    const { page, totalPages } = this.pagination;
    const pages: number[] = [];

    if (totalPages <= this.maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate range around current page
      let start = Math.max(1, page - Math.floor(this.maxVisiblePages / 2));
      let end = Math.min(totalPages, start + this.maxVisiblePages - 1);

      // Adjust start if we're near the end
      if (end - start + 1 < this.maxVisiblePages) {
        start = Math.max(1, end - this.maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    this.visiblePages = pages;
  }

  onPageClick(page: number) {
    if (!this.pagination || page === this.pagination.page) return;
    
    this.pageChange.emit({
      page,
      limit: this.pagination.limit
    });
  }

  onPreviousClick() {
    if (!this.pagination || !this.pagination.hasPrev) return;
    
    this.onPageClick(this.pagination.page - 1);
  }

  onNextClick() {
    if (!this.pagination || !this.pagination.hasNext) return;
    
    this.onPageClick(this.pagination.page + 1);
  }

  onFirstClick() {
    if (!this.pagination || this.pagination.page === 1) return;
    
    this.onPageClick(1);
  }

  onLastClick() {
    if (!this.pagination || this.pagination.page === this.pagination.totalPages) return;
    
    this.onPageClick(this.pagination.totalPages);
  }

  onPageSizeChange(event: Event) {
    if (!this.pagination) return;
    
    const target = event.target as HTMLSelectElement;
    const newLimit = parseInt(target.value, 10);
    
    this.pageChange.emit({
      page: 1, // Reset to first page when changing page size
      limit: newLimit
    });
  }

  getPageInfo(): string {
    if (!this.pagination) return '';

    const { page, limit, total } = this.pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    return `Showing ${start} to ${end} of ${total} results`;
  }

  isFirstPage(): boolean {
    return !this.pagination || this.pagination.page === 1;
  }

  isLastPage(): boolean {
    return !this.pagination || this.pagination.page === this.pagination.totalPages;
  }
}
