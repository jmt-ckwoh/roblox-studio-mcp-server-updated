/**
 * MCP response formatting and validation utilities
 */

import { z } from 'zod';

// MCP Protocol Schema Definitions
const MCPContentSchema = z.object({
  type: z.literal('text'),
  text: z.string().min(1, 'Content text cannot be empty')
});

const MCPResponseSchema = z.object({
  content: z.array(MCPContentSchema).min(1, 'Response must contain at least one content item'),
  isError: z.boolean().optional(),
  errorCode: z.string().optional(),
  timestamp: z.string().optional()
});

export interface MCPResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
  errorCode?: string;
  timestamp?: string;
  [key: string]: unknown; // Index signature for MCP SDK compatibility
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateMCPResponse(response: any): ValidationResult {
  const result = MCPResponseSchema.safeParse(response);
  
  const warnings: string[] = [];
  
  // Additional content quality checks
  if (result.success && response.content) {
    for (const content of response.content) {
      if (content.text.length > 100000) {
        warnings.push('Content text is very large (>100KB)');
      }
      
      if (content.text.trim() === '') {
        warnings.push('Content text is empty or whitespace only');
      }
      
      // Check for potential encoding issues
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(content.text)) {
        warnings.push('Content contains control characters');
      }
    }
  }
  
  return {
    isValid: result.success,
    errors: result.success ? [] : result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    warnings
  };
}

export function createStandardResponse(text: string, options: {
  isError?: boolean;
  errorCode?: string;
  includeTimestamp?: boolean;
} = {}): MCPResponse {
  const response: MCPResponse = {
    content: [{ type: 'text', text }]
  };
  
  if (options.isError) {
    response.isError = true;
  }
  
  if (options.errorCode) {
    response.errorCode = options.errorCode;
  }
  
  if (options.includeTimestamp !== false) {
    response.timestamp = new Date().toISOString();
  }
  
  return response;
}

export function validateGeneratedCode(code: string): {
  isValid: boolean;
  quality: {
    hasComments: boolean;
    hasValidStructure: boolean;
    noSyntaxErrors: boolean;
    hasProperIndentation: boolean;
  };
  suggestions: string[];
} {
  const suggestions: string[] = [];
  
  // Check for comments
  const hasComments = code.includes('--');
  if (!hasComments) {
    suggestions.push('Consider adding comments for better code documentation');
  }
  
  // Check for valid Luau structure
  const hasValidStructure = /\b(function|local|if|for|while|repeat|do)\b/.test(code);
  if (!hasValidStructure) {
    suggestions.push('Code should contain typical Luau language constructs');
  }
  
  // Basic syntax error detection
  const functionCount = (code.match(/\bfunction\b/g) || []).length;
  const endCount = (code.match(/\bend\b/g) || []).length;
  const noSyntaxErrors = functionCount <= endCount;
  
  if (!noSyntaxErrors) {
    suggestions.push('Code may have unmatched function/end statements');
  }
  
  // Check indentation consistency
  const lines = code.split('\n');
  const indentedLines = lines.filter(line => line.match(/^\s+/));
  const hasProperIndentation = indentedLines.length > 0 || lines.length <= 5;
  
  if (!hasProperIndentation && lines.length > 5) {
    suggestions.push('Code should use proper indentation for better readability');
  }
  
  const quality = {
    hasComments,
    hasValidStructure,
    noSyntaxErrors,
    hasProperIndentation
  };
  
  const isValid = Object.values(quality).every(Boolean);
  
  return { isValid, quality, suggestions };
}

export function validateValidationResponse(response: any): {
  isValid: boolean;
  hasRequiredFields: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check if response is valid JSON
  if (typeof response !== 'object' || response === null) {
    errors.push('Response must be a valid object');
    return { isValid: false, hasRequiredFields: false, errors };
  }
  
  // Check required fields for validation response
  const requiredFields = ['isValid', 'issues', 'warnings', 'suggestions', 'metrics'];
  const hasRequiredFields = requiredFields.every(field => field in response);
  
  if (!hasRequiredFields) {
    const missing = requiredFields.filter(field => !(field in response));
    errors.push(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate field types
  if ('isValid' in response && typeof response.isValid !== 'boolean') {
    errors.push('isValid must be a boolean');
  }
  
  if ('issues' in response && !Array.isArray(response.issues)) {
    errors.push('issues must be an array');
  }
  
  if ('warnings' in response && !Array.isArray(response.warnings)) {
    errors.push('warnings must be an array');
  }
  
  if ('suggestions' in response && !Array.isArray(response.suggestions)) {
    errors.push('suggestions must be an array');
  }
  
  if ('metrics' in response && typeof response.metrics !== 'object') {
    errors.push('metrics must be an object');
  }
  
  return {
    isValid: errors.length === 0,
    hasRequiredFields,
    errors
  };
}

export function validateApiResponse(response: any): {
  isValid: boolean;
  hasMetadata: boolean;
  isMockLabeled: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (typeof response !== 'object' || response === null) {
    errors.push('Response must be a valid object');
    return { isValid: false, hasMetadata: false, isMockLabeled: false, errors };
  }
  
  // Check for required structure
  const hasMetadata = 'metadata' in response;
  if (!hasMetadata) {
    errors.push('API response must include metadata field');
  }
  
  // Check if mock responses are properly labeled
  const isMockLabeled = response.metadata && response.metadata.isMock === true;
  if (!isMockLabeled) {
    errors.push('Mock API responses must be clearly labeled with metadata.isMock: true');
  }
  
  // Validate data structure
  if (!('data' in response)) {
    errors.push('API response must include data field');
  }
  
  if (!('status' in response)) {
    errors.push('API response must include status field');
  }
  
  return {
    isValid: errors.length === 0,
    hasMetadata,
    isMockLabeled,
    errors
  };
}

// Enhanced error messages
export const ENHANCED_ERROR_MESSAGES = {
  SECURITY_VIOLATION: 'Input contains potentially harmful content and was rejected for security reasons',
  SIZE_LIMIT: 'Input exceeds the maximum allowed size limit',
  TIMEOUT: 'Operation timed out - please try with smaller or simpler input',
  VALIDATION_FAILED: 'Input validation failed - please check your parameters',
  INTERNAL_ERROR: 'An internal server error occurred - please try again',
  EMPTY_INPUT: 'Required input field cannot be empty',
  INVALID_TYPE: 'Invalid input type provided - expected string',
  BOUNDARY_ERROR: 'Input exceeds acceptable boundaries',
  MALICIOUS_CONTENT: 'Input contains patterns that could be harmful',
  ENCODING_ERROR: 'Input contains invalid character encoding'
};

export function enhanceErrorMessage(errorType: string, originalMessage: string, context?: any): string {
  const enhanced = ENHANCED_ERROR_MESSAGES[errorType as keyof typeof ENHANCED_ERROR_MESSAGES];
  
  if (!enhanced) {
    return originalMessage;
  }
  
  let message = enhanced;
  
  // Add context-specific details
  if (context) {
    if (context.fieldName) {
      message += ` (Field: ${context.fieldName})`;
    }
    
    if (context.maxLength && context.actualLength) {
      message += ` (Limit: ${context.maxLength}, Actual: ${context.actualLength})`;
    }
    
    if (context.suggestions && context.suggestions.length > 0) {
      message += `. Suggestions: ${context.suggestions.join(', ')}`;
    }
  }
  
  return message;
}