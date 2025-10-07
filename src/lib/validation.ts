import { ValidationError } from './errors';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null) {
    throw new ValidationError(`${fieldName} is required`);
  }
  if (typeof value === 'string' && value.trim() === '') {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }
}

export function validatePositiveNumber(value: unknown, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`);
  }
}

export function validateNonNegativeNumber(value: unknown, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  if (value < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number`);
  }
}

export function validatePositiveInteger(value: unknown, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value) || !Number.isInteger(value)) {
    throw new ValidationError(`${fieldName} must be a valid integer`);
  }
  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`);
  }
}

export function validateUUID(value: string, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }
}

export function validateArrayNotEmpty<T>(arr: T[], fieldName: string): void {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty array`);
  }
}

export function sanitizeString(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCartItemInput(item: {
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
}): ValidationResult {
  const errors: string[] = [];

  if (!item.productId || item.productId.trim() === '') {
    errors.push('Product ID is required');
  }
  if (!item.productName || item.productName.trim() === '') {
    errors.push('Product name is required');
  }
  if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
    errors.push('Quantity must be a positive integer');
  }
  if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
    errors.push('Unit price must be a non-negative number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
