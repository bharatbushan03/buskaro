/**
 * Password Utilities
 * 
 * Provides secure password hashing, validation, and strength checking.
 * Uses bcrypt for hashing with configurable rounds.
 */

import bcrypt from 'bcryptjs';

// Salt rounds for bcrypt (higher = more secure but slower)
const SALT_ROUNDS = 12;

/**
 * Password validation rules
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
  }

  // Check for common weak patterns
  if (/^[a-zA-Z]+$/.test(password)) {
    errors.push('Password cannot contain only letters');
  }

  if (/^[0-9]+$/.test(password)) {
    errors.push('Password cannot contain only numbers');
  }

  // Check for sequential characters
  if (hasSequentialChars(password)) {
    errors.push('Password cannot contain sequential characters (abc, 123, etc.)');
  }

  // Check for repeated characters
  if (hasRepeatedChars(password)) {
    errors.push('Password cannot contain repeated characters (aaa, 111, etc.)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check for sequential characters (abc, 123, etc.)
 */
function hasSequentialChars(password: string): boolean {
  const str = password.toLowerCase();
  
  for (let i = 0; i < str.length - 2; i++) {
    const char1 = str.charCodeAt(i);
    const char2 = str.charCodeAt(i + 1);
    const char3 = str.charCodeAt(i + 2);
    
    // Check ascending sequence
    if (char2 === char1 + 1 && char3 === char2 + 1) {
      return true;
    }
    
    // Check descending sequence
    if (char2 === char1 - 1 && char3 === char2 - 1) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check for repeated characters (aaa, 111, etc.)
 */
function hasRepeatedChars(password: string): boolean {
  const str = password.toLowerCase();
  
  for (let i = 0; i < str.length - 2; i++) {
    if (str[i] === str[i + 1] && str[i] === str[i + 2]) {
      return true;
    }
  }
  
  return false;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain text password with hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Calculate password strength score (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;

  // Length contribution (up to 30 points)
  score += Math.min(password.length * 2, 30);

  // Character variety contribution
  if (/[A-Z]/.test(password)) score += 10; // Uppercase
  if (/[a-z]/.test(password)) score += 10; // Lowercase
  if (/[0-9]/.test(password)) score += 10; // Numbers
  if (/[^A-Za-z0-9]/.test(password)) score += 15; // Special chars

  // Bonus for length beyond minimum
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Penalties
  if (hasSequentialChars(password)) score -= 10;
  if (hasRepeatedChars(password)) score -= 10;

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): 'weak' | 'fair' | 'good' | 'strong' {
  if (score < 40) return 'weak';
  if (score < 60) return 'fair';
  if (score < 80) return 'good';
  return 'strong';
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + special;
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill remaining length
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
