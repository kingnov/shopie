import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminProductService, CreateProductDto, UpdateProductDto } from '../../../core/services/admin-product.service';
import { Product, ProductSearchParams, PaginationResult } from '../../../core/services/product.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent, PageChangeEvent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    PaginationComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.css'
})
export class ProductManagementComponent implements OnInit {
  // Data properties
  products: Product[] = [];
  pagination: PaginationResult | null = null;
  loading = false;
  error: string | null = null;

  // Search and filter properties
  searchParams: ProductSearchParams = {
    page: 1,
    limit: 10
  };

  // UI state properties
  showAddModal = false;
  showEditModal = false;
  showConfirmDialog = false;
  selectedProduct: Product | null = null;
  confirmDialogData: ConfirmDialogData = {
    title: '',
    message: '',
    type: 'warning'
  };

  // Form properties
  productForm: CreateProductDto = {
    name: '',
    shortDescription: '',
    description: '',
    price: 0,
    imageUrl: '',
    images: [],
    sku: '',
    category: '',
    stock: 0,
    isActive: true
  };

  // Table configuration
  tableColumns: TableColumn[] = [
    {
      key: 'imageUrl',
      label: 'Image',
      type: 'image',
      width: '80px',
      align: 'center'
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      type: 'text'
    },
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      width: '120px'
    },
    {
      key: 'category',
      label: 'Category',
      type: 'text',
      width: '120px'
    },
    {
      key: 'price',
      label: 'Price',
      type: 'currency',
      align: 'right',
      width: '100px',
      sortable: true
    },
    {
      key: 'stock',
      label: 'Stock',
      type: 'number',
      align: 'center',
      width: '80px',
      sortable: true
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'badge',
      align: 'center',
      width: '100px',
      badgeColors: {
        'true': 'bg-green-100 text-green-800',
        'false': 'bg-red-100 text-red-800'
      },
      format: (value: boolean) => value ? 'Active' : 'Inactive'
    },
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      width: '120px',
      sortable: true
    }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Edit',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'primary',
      action: (product: Product) => this.editProduct(product)
    },
    {
      label: 'Delete',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'danger',
      action: (product: Product) => this.confirmDelete(product)
    }
  ];

  constructor(
    private adminProductService: AdminProductService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  // Data loading methods
  loadProducts() {
    this.loading = true;
    this.error = null;

    this.adminProductService.getProducts(this.searchParams).subscribe({
      next: (response) => {
        this.products = response.data;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load products. Please try again.';
        this.loading = false;
        this.notificationService.error('Error', 'Failed to load products. Please try again.');
        console.error('Error loading products:', error);
      }
    });
  }

  // Search and filter methods
  onSearch(searchTerm: string) {
    this.searchParams.search = searchTerm || undefined;
    this.searchParams.page = 1;
    this.loadProducts();
  }

  onPageChange(event: PageChangeEvent) {
    this.searchParams.page = event.page;
    this.searchParams.limit = event.limit;
    this.loadProducts();
  }

  // CRUD operations
  openAddModal() {
    this.resetForm();
    this.showAddModal = true;
  }

  editProduct(product: Product) {
    this.selectedProduct = product;
    this.productForm = {
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description || '',
      price: product.price,
      imageUrl: product.imageUrl,
      images: product.images || [],
      sku: product.sku || '',
      category: product.category || '',
      stock: product.stock,
      isActive: product.isActive
    };
    this.showEditModal = true;
  }

  confirmDelete(product: Product) {
    this.selectedProduct = product;
    this.confirmDialogData = {
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };
    this.showConfirmDialog = true;
  }

  // Form methods
  saveProduct(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    if (!this.isFormValid()) {
      return;
    }

    this.loading = true;

    if (this.selectedProduct) {
      // Update existing product
      this.adminProductService.updateProduct(this.selectedProduct.id, this.productForm).subscribe({
        next: (response) => {
          this.closeModals();
          this.loadProducts();
          this.notificationService.success('Success', `Product "${response.data.name}" updated successfully`);
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.error('Error', 'Failed to update product. Please try again.');
          console.error('Error updating product:', error);
        }
      });
    } else {
      // Create new product
      this.adminProductService.createProduct(this.productForm).subscribe({
        next: (response) => {
          this.closeModals();
          this.loadProducts();
          this.notificationService.success('Success', `Product "${response.data.name}" created successfully`);
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.error('Error', 'Failed to create product. Please try again.');
          console.error('Error creating product:', error);
        }
      });
    }
  }

  deleteProduct() {
    if (!this.selectedProduct) return;

    this.loading = true;
    this.adminProductService.deleteProduct(this.selectedProduct.id).subscribe({
      next: (response) => {
        this.closeModals();
        this.loadProducts();
        const message = response.data.isActive === false
          ? `Product "${response.data.name}" marked as inactive (was in use)`
          : `Product "${response.data.name}" deleted successfully`;
        this.notificationService.success('Success', message);
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.error('Error', 'Failed to delete product. Please try again.');
        console.error('Error deleting product:', error);
      }
    });
  }

  // UI helper methods
  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showConfirmDialog = false;
    this.selectedProduct = null;
    this.resetForm();
  }

  resetForm() {
    this.productForm = {
      name: '',
      shortDescription: '',
      description: '',
      price: 0,
      imageUrl: '',
      images: [],
      sku: '',
      category: '',
      stock: 0,
      isActive: true
    };
  }

  isFormValid(): boolean {
    return !!(
      this.productForm.name?.trim() &&
      this.productForm.shortDescription?.trim() &&
      this.productForm.price > 0 &&
      this.productForm.imageUrl?.trim()
    );
  }

  // Utility methods
  private handleApiError(error: any, operation: string) {
    console.error(`Error ${operation}:`, error);

    if (error.status === 401) {
      this.notificationService.error('Unauthorized', 'Your session has expired. Please log in again.');
      this.router.navigate(['/auth/login']);
    } else if (error.status === 403) {
      this.notificationService.error('Forbidden', 'You do not have permission to perform this action.');
    } else if (error.status === 409) {
      this.notificationService.warning('Conflict', error.error?.message || 'A conflict occurred. Please check your data.');
    } else if (error.status === 422) {
      this.notificationService.warning('Validation Error', error.error?.message || 'Please check your input data.');
    } else {
      this.notificationService.error('Error', `Failed to ${operation}. Please try again.`);
    }
  }

  // Confirm dialog handlers
  onConfirmDialogConfirm = () => {
    this.deleteProduct();
  };

  onConfirmDialogCancel = () => {
    this.closeModals();
  };
}
