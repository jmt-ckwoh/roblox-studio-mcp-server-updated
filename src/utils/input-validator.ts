/**
 * Comprehensive input validation pipeline
 */

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  warnings: string[];
  errors: string[];
  metadata: {
    originalLength: number;
    sanitizedLength: number;
    encoding: string;
    hasUnicode: boolean;
    hasControlChars: boolean;
    hasNullBytes: boolean;
  };
}

export interface ValidationOptions {
  maxLength?: number;
  allowUnicode?: boolean;
  checkMalicious?: boolean;
  fieldName: string;
  allowEmpty?: boolean;
}

export function validateInput(input: string, options: ValidationOptions): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  let sanitized = input;
  
  // Encoding and character analysis
  const encodingResult = validateEncoding(input);
  
  // Length validation
  if (options.maxLength && input.length > options.maxLength) {
    errors.push(`${options.fieldName} exceeds maximum length of ${options.maxLength} characters`);
  }
  
  // Empty input validation
  if (!options.allowEmpty && input.trim().length === 0) {
    errors.push(`${options.fieldName} cannot be empty`);
  }
  
  // Null byte detection (security risk)
  if (encodingResult.hasNullBytes) {
    errors.push(`${options.fieldName} contains null bytes which are not allowed`);
    sanitized = sanitized.replace(/\0/g, '');
  }
  
  // Control character detection
  if (encodingResult.hasControlChars) {
    warnings.push(`${options.fieldName} contains control characters which were removed`);
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  
  // Unicode validation
  if (encodingResult.hasUnicode && !options.allowUnicode) {
    warnings.push(`${options.fieldName} contains Unicode characters which were normalized`);
    sanitized = normalizeUnicode(sanitized);
  }
  
  // Malicious content detection
  if (options.checkMalicious) {
    const maliciousResult = detectMaliciousContent(sanitized);
    if (maliciousResult.isMalicious) {
      errors.push(`${options.fieldName} contains potentially malicious content: ${maliciousResult.reasons.join(', ')}`);
      sanitized = maliciousResult.sanitized;
    }
  }
  
  return {
    isValid: errors.length === 0,
    sanitized,
    warnings,
    errors,
    metadata: {
      originalLength: input.length,
      sanitizedLength: sanitized.length,
      encoding: detectEncoding(input),
      hasUnicode: encodingResult.hasUnicode,
      hasControlChars: encodingResult.hasControlChars,
      hasNullBytes: encodingResult.hasNullBytes
    }
  };
}

function validateEncoding(input: string) {
  const hasNullBytes = input.includes('\0');
  const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input);
  const hasUnicode = /[^\x00-\x7F]/.test(input);
  
  return { hasNullBytes, hasControlChars, hasUnicode };
}

function detectEncoding(input: string): string {
  // Simple encoding detection
  if (/^[\x00-\x7F]*$/.test(input)) {
    return 'ASCII';
  } else if (/^[\x00-\xFF]*$/.test(input)) {
    return 'UTF-8';
  } else {
    return 'Unicode';
  }
}

function normalizeUnicode(input: string): string {
  try {
    // Normalize to NFC form and remove problematic Unicode categories
    let normalized = input.normalize('NFC');
    
    // Remove zero-width characters
    normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    // Remove directional marks
    normalized = normalized.replace(/[\u202A-\u202E]/g, '');
    
    // Replace problematic Unicode with safe equivalents
    normalized = normalized.replace(/[^\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g, '?');
    
    return normalized;
  } catch (error) {
    // Fallback: remove all non-ASCII characters
    return input.replace(/[^\x00-\x7F]/g, '');
  }
}

function detectMaliciousContent(input: string): { isMalicious: boolean; reasons: string[]; sanitized: string } {
  const reasons: string[] = [];
  let sanitized = input;
  
  // XSS patterns
  if (/<script|javascript:|on\w+\s*=/i.test(input)) {
    reasons.push('XSS patterns detected');
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  }
  
  // SQL injection patterns
  if (/(;|--|\b(DROP|DELETE|INSERT|UPDATE|ALTER|UNION|SELECT)\b)/i.test(input)) {
    reasons.push('SQL injection patterns detected');
    sanitized = sanitized.replace(/(;|--|\|\||&&)/g, '');
    sanitized = sanitized.replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE|UNION|SELECT)\b/gi, '');
  }
  
  // Command injection patterns
  if (/(\||&|;|`|\$\(|\${)/i.test(input)) {
    reasons.push('Command injection patterns detected');
    sanitized = sanitized.replace(/[\|&;`]/g, '');
    sanitized = sanitized.replace(/\$[\(\{]/g, '');
  }
  
  // Path traversal patterns
  if (/\.\.[\/\\]/.test(input)) {
    reasons.push('Path traversal patterns detected');
    sanitized = sanitized.replace(/\.\.[\/\\]/g, '');
  }
  
  // LDAP injection patterns
  if (/[\(\)&\|!]/.test(input) && /[=><~]/.test(input)) {
    reasons.push('LDAP injection patterns detected');
    sanitized = sanitized.replace(/[\(\)&\|!]/g, '');
  }
  
  // HTML injection patterns
  if (/<[^>]*>/i.test(input)) {
    reasons.push('HTML injection patterns detected');
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  return {
    isMalicious: reasons.length > 0,
    reasons,
    sanitized
  };
}

// Field-specific validation rules
export const FIELD_VALIDATION_RULES = {
  functionality: {
    maxLength: 1000,
    allowUnicode: true,
    checkMalicious: true,
    allowEmpty: false
  },
  scriptType: {
    maxLength: 50,
    allowUnicode: false,
    checkMalicious: true,
    allowEmpty: false
  },
  framework: {
    maxLength: 50,
    allowUnicode: false,
    checkMalicious: true,
    allowEmpty: true
  },
  script: {
    maxLength: 50000,
    allowUnicode: true,
    checkMalicious: true,
    allowEmpty: false
  },
  endpoint: {
    maxLength: 200,
    allowUnicode: false,
    checkMalicious: true,
    allowEmpty: false
  },
  identifier: {
    maxLength: 100,
    allowUnicode: false,
    checkMalicious: true,
    allowEmpty: false
  }
};

export function validateField(input: string, fieldName: keyof typeof FIELD_VALIDATION_RULES): ValidationResult {
  const rules = FIELD_VALIDATION_RULES[fieldName];
  return validateInput(input, { ...rules, fieldName });
}