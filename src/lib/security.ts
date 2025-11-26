/**
 * Security utilities for input validation and sanitization
 */

/**
 * Validate and sanitize email addresses
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate URL to ensure it's from allowed domains
 */
export function validateUrl(url: string, allowedDomains: string[] = []): boolean {
  try {
    const urlObj = new URL(url);
    
    // If no allowed domains specified, allow any HTTPS
    if (allowedDomains.length === 0) {
      return urlObj.protocol === 'https:';
    }
    
    // Check if domain is in allowed list
    return allowedDomains.some(domain => urlObj.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

/**
 * Sanitize text input by removing potentially dangerous characters
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[],
  maxSizeInMB: number
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize phone number (remove non-numeric characters except +)
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Validate phone number format (basic validation)
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = sanitizePhone(phone);
  // Allow international format +XX and at least 8 digits
  return /^\+?\d{8,}$/.test(cleanPhone);
}

/**
 * Rate limiting helper - track attempts
 */
interface RateLimitTracker {
  [key: string]: { count: number; firstAttempt: number };
}

const rateLimitStore: RateLimitTracker = {};

/**
 * Check if action is rate limited
 * @param key - Unique identifier (e.g., user ID + action)
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 */
export function isRateLimited(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const tracker = rateLimitStore[key];

  if (!tracker || now - tracker.firstAttempt > windowMs) {
    // Reset or initialize tracker
    rateLimitStore[key] = { count: 1, firstAttempt: now };
    return false;
  }

  if (tracker.count >= maxAttempts) {
    return true; // Rate limited
  }

  tracker.count++;
  return false;
}

/**
 * Clear rate limit for a key
 */
export function clearRateLimit(key: string): void {
  delete rateLimitStore[key];
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Encrypt sensitive data before storing (simple obfuscation - use proper encryption in production)
 * Note: This is a basic implementation. For production, use proper encryption libraries
 */
export function obfuscate(text: string): string {
  return btoa(encodeURIComponent(text));
}

/**
 * Decrypt obfuscated data
 */
export function deobfuscate(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return '';
  }
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CNPJ/CPF (Brazilian documents)
 */
export function validateCNPJCPF(doc: string): boolean {
  const cleanDoc = doc.replace(/[^\d]/g, '');
  
  if (cleanDoc.length === 11) {
    // CPF validation
    if (/^(\d)\1{10}$/.test(cleanDoc)) return false; // All same digits
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanDoc.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanDoc.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanDoc.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    return digit === parseInt(cleanDoc.charAt(10));
  } else if (cleanDoc.length === 14) {
    // CNPJ validation
    if (/^(\d)\1{13}$/.test(cleanDoc)) return false;
    
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanDoc.charAt(i)) * weights1[i];
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleanDoc.charAt(12))) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanDoc.charAt(i)) * weights2[i];
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    return digit === parseInt(cleanDoc.charAt(13));
  }
  
  return false;
}
