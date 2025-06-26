import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminUserService, User, CreateUserDto, UpdateUserDto, UserSearchParams, PaginationResult } from '../../../core/services/admin-user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { PaginationComponent, PageChangeEvent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    PaginationComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  // Data properties
  users: User[] = [];
  pagination: PaginationResult | null = null;
  loading = false;
  error: string | null = null;

  // Search and filter properties
  searchParams: UserSearchParams = {
    page: 1,
    limit: 10
  };

  // UI state properties
  showAddModal = false;
  showEditModal = false;
  showConfirmDialog = false;
  selectedUser: User | null = null;
  confirmDialogData: ConfirmDialogData = {
    title: '',
    message: '',
    type: 'warning'
  };

  // Form properties
  userForm: CreateUserDto = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CUSTOMER'
  };

  // Table configuration
  tableColumns: TableColumn[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      type: 'text'
    },
    {
      key: 'firstName',
      label: 'First Name',
      type: 'text',
      width: '120px'
    },
    {
      key: 'lastName',
      label: 'Last Name',
      type: 'text',
      width: '120px'
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'text',
      width: '140px'
    },
    {
      key: 'role',
      label: 'Role',
      type: 'badge',
      align: 'center',
      width: '100px',
      badgeColors: {
        'ADMIN': 'bg-purple-100 text-purple-800',
        'CUSTOMER': 'bg-blue-100 text-blue-800'
      }
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
      action: (user: User) => this.editUser(user)
    },
    {
      label: 'Delete',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'danger',
      action: (user: User) => this.confirmDelete(user)
    }
  ];

  constructor(
    private adminUserService: AdminUserService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  // Data loading methods
  loadUsers() {
    this.loading = true;
    this.error = null;

    this.adminUserService.getUsers(this.searchParams).subscribe({
      next: (response) => {
        this.users = response.data;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load users. Please try again.';
        this.loading = false;
        this.notificationService.error('Error', 'Failed to load users. Please try again.');
        console.error('Error loading users:', error);
      }
    });
  }

  // Search and filter methods
  onSearch(searchTerm: string) {
    this.searchParams.search = searchTerm || undefined;
    this.searchParams.page = 1;
    this.loadUsers();
  }

  onPageChange(event: PageChangeEvent) {
    this.searchParams.page = event.page;
    this.searchParams.limit = event.limit;
    this.loadUsers();
  }

  // CRUD operations
  openAddModal() {
    this.resetForm();
    this.showAddModal = true;
  }

  editUser(user: User) {
    this.selectedUser = user;
    this.userForm = {
      email: user.email,
      password: '', // Don't populate password for security
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      role: user.role
    };
    this.showEditModal = true;
  }

  confirmDelete(user: User) {
    this.selectedUser = user;
    this.confirmDialogData = {
      title: 'Delete User',
      message: `Are you sure you want to delete user "${user.email}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };
    this.showConfirmDialog = true;
  }

  // Form methods
  saveUser(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    
    if (!this.isFormValid()) {
      return;
    }

    this.loading = true;

    if (this.selectedUser) {
      // Update existing user (exclude password from update)
      const { password, ...updateData } = this.userForm;
      this.adminUserService.updateUser(this.selectedUser.id, updateData).subscribe({
        next: (response) => {
          this.closeModals();
          this.loadUsers();
          this.notificationService.success('Success', `User "${response.data.email}" updated successfully`);
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.error('Error', 'Failed to update user. Please try again.');
          console.error('Error updating user:', error);
        }
      });
    } else {
      // Create new user
      this.adminUserService.createUser(this.userForm).subscribe({
        next: (response) => {
          this.closeModals();
          this.loadUsers();
          this.notificationService.success('Success', `User "${response.data.email}" created successfully`);
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.error('Error', 'Failed to create user. Please try again.');
          console.error('Error creating user:', error);
        }
      });
    }
  }

  deleteUser() {
    if (!this.selectedUser) return;

    this.loading = true;
    this.adminUserService.deleteUser(this.selectedUser.id).subscribe({
      next: (response) => {
        this.closeModals();
        this.loadUsers();
        this.notificationService.success('Success', `User deleted successfully`);
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.error('Error', 'Failed to delete user. Please try again.');
        console.error('Error deleting user:', error);
      }
    });
  }

  // UI helper methods
  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showConfirmDialog = false;
    this.selectedUser = null;
    this.resetForm();
  }

  resetForm() {
    this.userForm = {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'CUSTOMER'
    };
  }

  isFormValid(): boolean {
    if (this.selectedUser) {
      // For updates, password is optional
      return !!(
        this.userForm.email?.trim() &&
        this.adminUserService.validateEmail(this.userForm.email)
      );
    } else {
      // For creation, password is required
      return !!(
        this.userForm.email?.trim() &&
        this.adminUserService.validateEmail(this.userForm.email) &&
        this.userForm.password?.trim() &&
        this.adminUserService.validatePassword(this.userForm.password)
      );
    }
  }

  // Confirm dialog handlers
  onConfirmDialogConfirm = () => {
    this.deleteUser();
  };

  onConfirmDialogCancel = () => {
    this.closeModals();
  };
}
