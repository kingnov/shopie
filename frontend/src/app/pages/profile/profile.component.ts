import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  currentUser: User | null = null;
  isUpdatingProfile = false;
  isChangingPassword = false;
  activeTab = 'profile';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      this.notificationService.authError('profileUpdate', { message: 'User not found. Please log in again.' });
      return;
    }

    this.initializeForms();
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      firstName: [this.currentUser?.firstName || '', [Validators.required]],
      lastName: [this.currentUser?.lastName || '', [Validators.required]],
      email: [{ value: this.currentUser?.email || '', disabled: true }],
      phone: [this.currentUser?.phone || '', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid || this.isUpdatingProfile) {
      return;
    }

    this.isUpdatingProfile = true;
    const formData = this.profileForm.getRawValue();

    this.authService.updateProfile(formData).subscribe({
      next: () => {
        this.isUpdatingProfile = false;
        this.currentUser = this.authService.getCurrentUser();
        this.notificationService.authSuccess('profileUpdated');
      },
      error: () => {
        this.isUpdatingProfile = false;
        // Error handling is done by the AuthService
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid || this.isChangingPassword) {
      return;
    }

    this.isChangingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.passwordForm.reset();
        this.notificationService.authSuccess('passwordChanged');
      },
      error: () => {
        this.isChangingPassword = false;
        // Error handling is done by the AuthService
      }
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string | null {
    const field = form.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors?.['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors?.['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
      }
      if (field.errors?.['pattern']) {
        return 'Please enter a valid phone number';
      }
    }
    return null;
  }

  getPasswordFormError(): string | null {
    if (this.passwordForm.errors?.['passwordMismatch'] && this.passwordForm.get('confirmPassword')?.touched) {
      return 'Passwords do not match';
    }
    return null;
  }
}
