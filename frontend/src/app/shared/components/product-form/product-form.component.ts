import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreateProductDto, UpdateProductDto } from '../../../core/services/admin-product.service';
import { Product } from '../../../core/services/product.service';

export interface ProductFormData {
  name: string;
  shortDescription: string;
  description?: string;
  price: number;
  imageUrl: string;
  images?: string[];
  sku?: string;
  category?: string;
  stock: number;
  isActive: boolean;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit, OnChanges {
  @Input() product: Product | null = null;
  @Input() loading = false;
  @Input() submitButtonText = 'Save Product';

  @Output() formSubmit = new EventEmitter<ProductFormData>();
  @Output() formCancel = new EventEmitter<void>();

  productForm!: FormGroup;
  imagePreview: string | null = null;
  additionalImages: string[] = [];

  // Predefined categories for dropdown
  categories = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Toys',
    'Beauty',
    'Automotive',
    'Health',
    'Food & Beverages'
  ];

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit() {
    if (this.product) {
      this.populateForm(this.product);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['product'] && changes['product'].currentValue) {
      this.populateForm(changes['product'].currentValue);
    }
  }

  private initializeForm() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      shortDescription: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      imageUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      sku: ['', [Validators.pattern(/^[A-Z0-9-]+$/)]],
      category: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });

    // Watch for image URL changes to update preview
    this.productForm.get('imageUrl')?.valueChanges.subscribe(url => {
      this.updateImagePreview(url);
    });
  }

  private populateForm(product: Product) {
    this.productForm.patchValue({
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description || '',
      price: product.price,
      imageUrl: product.imageUrl,
      sku: product.sku || '',
      category: product.category || '',
      stock: product.stock,
      isActive: product.isActive
    });

    this.additionalImages = product.images || [];
    this.updateImagePreview(product.imageUrl);
  }

  private updateImagePreview(url: string) {
    if (url && this.isValidImageUrl(url)) {
      this.imagePreview = url;
    } else {
      this.imagePreview = null;
    }
  }

  private isValidImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || url.includes('unsplash.com');
  }

  onSubmit() {
    if (this.productForm.valid) {
      const formData: ProductFormData = {
        ...this.productForm.value,
        images: this.additionalImages
      };
      this.formSubmit.emit(formData);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.formCancel.emit();
  }

  addAdditionalImage() {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl && this.isValidImageUrl(imageUrl)) {
      this.additionalImages.push(imageUrl);
    }
  }

  removeAdditionalImage(index: number) {
    this.additionalImages.splice(index, 1);
  }

  generateSku() {
    const name = this.productForm.get('name')?.value || '';
    const category = this.productForm.get('category')?.value || '';
    
    if (name) {
      const namePart = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
      const categoryPart = category.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
      const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
      
      const sku = `${categoryPart}-${namePart}-${randomPart}`;
      this.productForm.patchValue({ sku });
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  // Validation helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} must be greater than ${field.errors['min'].min}`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
    }
    return '';
  }

  // Price formatting
  formatPrice(event: any) {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      event.target.value = value.toFixed(2);
      this.productForm.patchValue({ price: value });
    }
  }

  // Image error handling
  onImageError(event: any) {
    event.target.src = 'assets/images/placeholder.png';
  }

  // Form reset
  resetForm() {
    this.productForm.reset({
      name: '',
      shortDescription: '',
      description: '',
      price: 0,
      imageUrl: '',
      sku: '',
      category: '',
      stock: 0,
      isActive: true
    });
    this.additionalImages = [];
    this.imagePreview = null;
  }

  // Utility methods for template
  get isFormValid(): boolean {
    return this.productForm.valid;
  }

  get formValue(): ProductFormData {
    return {
      ...this.productForm.value,
      images: this.additionalImages
    };
  }
}

