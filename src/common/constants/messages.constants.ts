export const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    REGISTER_SUCCESS: 'Registration successful',
    LOGOUT_SUCCESS: 'Logout successful',
    INVALID_CREDENTIALS: 'Invalid credentials',
    USER_EXISTS: 'User already exists',
    PASSWORD_RESET_SENT: 'Password reset email sent',
    PASSWORD_RESET_SUCCESS: 'Password reset successful',
  },
  PRODUCTS: {
    CREATED: 'Product created successfully',
    UPDATED: 'Product updated successfully',
    DELETED: 'Product deleted successfully',
    NOT_FOUND: 'Product not found',
    INSUFFICIENT_STOCK: 'Insufficient stock',
  },
  CART: {
    ADDED: 'Product added to cart',
    UPDATED: 'Cart item updated',
    REMOVED: 'Product removed from cart',
    CLEARED: 'Cart cleared',
    ITEM_NOT_FOUND: 'Cart item not found',
  },
  USERS: {
    CREATED: 'User created successfully',
    UPDATED: 'User updated successfully',
    DELETED: 'User deleted successfully',
    NOT_FOUND: 'User not found',
  },
  UPLOAD: {
    SUCCESS: 'File uploaded successfully',
    FAILED: 'File upload failed',
    INVALID_FORMAT: 'Invalid file format',
  },
} as const;