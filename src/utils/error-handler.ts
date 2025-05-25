/**
 * Standardized error handling for MCP tools
 */

export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  SECURITY_ERROR = 'security_error', 
  TIMEOUT_ERROR = 'timeout_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  INTERNAL_ERROR = 'internal_error',
  BOUNDARY_ERROR = 'boundary_error'
}

export interface StandardError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: string;
  toolName: string;
  fieldName?: string;
}

export interface MCPErrorResponse {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
  errorCode: ErrorType;
  timestamp: string;
  [key: string]: unknown; // Index signature for MCP SDK compatibility
}

export function createErrorResponse(error: StandardError): MCPErrorResponse {
  return {
    content: [{ 
      type: "text", 
      text: `${error.type}: ${error.message}${error.fieldName ? ` (Field: ${error.fieldName})` : ''}` 
    }],
    isError: true,
    errorCode: error.type,
    timestamp: error.timestamp
  };
}

export function createStandardError(
  type: ErrorType,
  message: string,
  toolName: string,
  fieldName?: string,
  details?: any
): StandardError {
  return {
    type,
    message,
    toolName,
    fieldName,
    details,
    timestamp: new Date().toISOString()
  };
}

// Boundary limits for validation
export const LIMITS = {
  MAX_SCRIPT_SIZE: 50000, // 50KB
  MAX_FUNCTIONALITY_LENGTH: 1000,
  MAX_PROCESSING_TIME: 5000, // 5 seconds
  MAX_IDENTIFIER_LENGTH: 100,
  MAX_ENDPOINT_LENGTH: 200,
  MAX_PARAMETER_SIZE: 10000
};

export function validateBoundaries(
  input: string, 
  limit: number, 
  fieldName: string,
  toolName: string
): void {
  if (input.length > limit) {
    throw createStandardError(
      ErrorType.BOUNDARY_ERROR,
      `${fieldName} exceeds maximum length of ${limit} characters`,
      toolName,
      fieldName,
      { actualLength: input.length, maxLength: limit }
    );
  }
}

// Standard error messages
export const ERROR_MESSAGES = {
  SECURITY_VIOLATION: 'Input contains potentially harmful content and was rejected',
  SIZE_LIMIT: 'Input exceeds maximum allowed size',
  TIMEOUT: 'Operation timed out - please try with smaller input',
  VALIDATION_FAILED: 'Input validation failed',
  INTERNAL_ERROR: 'An internal error occurred - please try again',
  EMPTY_INPUT: 'Required input cannot be empty',
  INVALID_TYPE: 'Invalid input type provided'
};