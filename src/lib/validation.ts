import { CartStatus, CreateCartInput, UpdateCartInput } from '@/types';
import { CART_STATUS } from '@/lib/constants';

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidCartStatus(status: string): status is CartStatus {
  const validStatuses: CartStatus[] = [
    CART_STATUS.ABANDONED,
    CART_STATUS.PENDING_RECOVERY,
    CART_STATUS.RECOVERED,
    CART_STATUS.EXPIRED,
  ];
  return validStatuses.includes(status as CartStatus);
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCreateCartInput(
  input: unknown
): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Invalid input: expected an object'] };
  }

  const data = input as Partial<CreateCartInput>;

  if (!isNonEmptyString(data.customerEmail)) {
    errors.push('Customer email is required');
  } else if (!isValidEmail(data.customerEmail)) {
    errors.push('Invalid email format');
  }

  if (!isNonEmptyString(data.customerName)) {
    errors.push('Customer name is required');
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('At least one cart item is required');
  } else {
    data.items.forEach((item, index) => {
      if (!isNonEmptyString(item?.productId)) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (!isNonEmptyString(item?.productName)) {
        errors.push(`Item ${index + 1}: Product name is required`);
      }
      if (!isPositiveNumber(item?.quantity)) {
        errors.push(`Item ${index + 1}: Quantity must be a positive number`);
      }
      if (!isPositiveNumber(item?.price)) {
        errors.push(`Item ${index + 1}: Price must be a positive number`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateUpdateCartInput(
  input: unknown
): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Invalid input: expected an object'] };
  }

  const data = input as Partial<UpdateCartInput>;

  // All fields are optional, but if provided, must be valid
  if (data.customerEmail !== undefined) {
    if (!isNonEmptyString(data.customerEmail)) {
      errors.push('Customer email cannot be empty');
    } else if (!isValidEmail(data.customerEmail)) {
      errors.push('Invalid email format');
    }
  }

  if (data.customerName !== undefined && !isNonEmptyString(data.customerName)) {
    errors.push('Customer name cannot be empty');
  }

  if (data.status !== undefined && !isValidCartStatus(data.status)) {
    errors.push(`Invalid status: ${data.status}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateId(id: unknown): ValidationResult {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { valid: false, errors: ['Invalid ID format'] };
  }
  return { valid: true, errors: [] };
}
