/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize text input to prevent XSS attacks
 */
export function sanitizeXSS(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove script tags and their contents
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous HTML tags
  sanitized = sanitized.replace(/<(iframe|object|embed|form|input|textarea|button|select|option|script|style|link|meta|base)[^>]*>/gi, '');
  
  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove data: protocols that could contain scripts
  sanitized = sanitized.replace(/data:text\/html/gi, 'data:text/plain');
  
  return sanitized;
}

/**
 * Validate and sanitize SQL-like inputs
 */
export function sanitizeSQL(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove common SQL injection patterns
  let sanitized = input
    .replace(/('|(\\'))+/g, '') // Remove quotes
    .replace(/(;|--|\|\||&&)/g, '') // Remove SQL operators
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE|UNION|SELECT)\b/gi, '') // Remove SQL keywords
    .replace(/\b(SCRIPT|IFRAME|OBJECT|EMBED|FORM)\b/gi, ''); // Remove HTML injection keywords
  
  return sanitized.trim();
}

/**
 * Validate that a string is safe for code generation
 */
export function validateCodeInput(input: string): { isValid: boolean; sanitized: string; warnings: string[] } {
  const warnings: string[] = [];
  let sanitized = input;
  
  // Check for XSS patterns
  if (/<script|javascript:|on\w+\s*=/i.test(input)) {
    warnings.push('Potential XSS content detected and removed');
    sanitized = sanitizeXSS(sanitized);
  }
  
  // Check for SQL injection patterns  
  if (/(;|--|\b(DROP|DELETE|INSERT|UPDATE|ALTER|UNION|SELECT)\b)/i.test(input)) {
    warnings.push('Potential SQL injection content detected and removed');
    sanitized = sanitizeSQL(sanitized);
  }
  
  // Check for path traversal
  if (/\.\.[\/\\]/.test(input)) {
    warnings.push('Path traversal patterns detected and removed');
    sanitized = sanitized.replace(/\.\.[\/\\]/g, '');
  }
  
  // Validate the sanitized input isn't empty or completely changed
  const isValid = sanitized.length > 0 && (sanitized.length / input.length) > 0.5;
  
  return {
    isValid,
    sanitized,
    warnings
  };
}

/**
 * Validate user identifier input (usernames, etc.)
 */
export function validateUserInput(input: string): { isValid: boolean; sanitized: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, sanitized: '', error: 'Input must be a non-empty string' };
  }
  
  // Check for obvious injection attempts
  if (/(;|--|\b(DROP|DELETE|INSERT|UPDATE|ALTER|UNION|SELECT)\b|<script|javascript:)/i.test(input)) {
    return { 
      isValid: false, 
      sanitized: '', 
      error: 'Input contains potentially malicious content' 
    };
  }
  
  // Basic sanitization for usernames/identifiers
  const sanitized = input
    .replace(/[<>\"'&]/g, '') // Remove HTML chars
    .replace(/[^\w\s\-_]/g, '') // Keep only alphanumeric, spaces, hyphens, underscores
    .trim();
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Input becomes empty after sanitization' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, sanitized: '', error: 'Input too long after sanitization' };
  }
  
  return { isValid: true, sanitized };
}