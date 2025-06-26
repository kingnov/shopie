import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private addNotification(notification: Omit<Notification, 'id'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      duration: notification.duration || 5000
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    // Auto-remove notification after duration (unless persistent)
    if (!notification.persistent && newNotification.duration) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, newNotification.duration);
    }
  }

  success(title: string, message: string, duration?: number): void {
    this.addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  }

  error(title: string, message: string, persistent?: boolean): void {
    this.addNotification({
      type: 'error',
      title,
      message,
      persistent,
      duration: persistent ? undefined : 8000
    });
  }

  warning(title: string, message: string, duration?: number): void {
    this.addNotification({
      type: 'warning',
      title,
      message,
      duration: duration || 6000
    });
  }

  info(title: string, message: string, duration?: number): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      duration
    });
  }

  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
  }

  // Authentication-specific notification methods
  authSuccess(action: string): void {
    const messages = {
      login: 'Welcome back! You have been successfully logged in.',
      register: 'Account created successfully! Welcome to Shopie.',
      logout: 'You have been logged out successfully.',
      passwordReset: 'Password reset email sent. Please check your inbox.',
      passwordChanged: 'Your password has been changed successfully.',
      profileUpdated: 'Your profile has been updated successfully.',
      tokenRefreshed: 'Your session has been refreshed automatically.'
    };

    this.success(
      'Success',
      messages[action as keyof typeof messages] || `${action} completed successfully.`
    );
  }

  authError(action: string, error?: any): void {
    const defaultMessages = {
      login: 'Login failed. Please check your credentials and try again.',
      register: 'Registration failed. Please check your information and try again.',
      passwordReset: 'Failed to send password reset email. Please try again.',
      passwordChange: 'Failed to change password. Please try again.',
      profileUpdate: 'Failed to update profile. Please try again.',
      tokenRefresh: 'Session expired. Please log in again.',
      networkError: 'Network error. Please check your connection and try again.',
      serverError: 'Server error. Please try again later.',
      validationError: 'Please check your input and try again.'
    };

    let message = defaultMessages[action as keyof typeof defaultMessages] || 'An error occurred. Please try again.';

    // Extract specific error message if available
    if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      message = error.message;
    }

    this.error('Error', message);
  }

  authWarning(message: string): void {
    this.warning('Warning', message);
  }

  authInfo(message: string): void {
    this.info('Information', message);
  }
}
