import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { 
  ErrorType, 
  createStandardError, 
  createErrorResponse, 
  validateBoundaries, 
  LIMITS 
} from '../utils/error-handler.js';
import { 
  validateMCPResponse, 
  validateValidationResponse, 
  createStandardResponse 
} from '../utils/response-formatter.js';

/**
 * Roblox Luau script validation tool
 */
export const scriptValidator = {
  register: (server: McpServer) => {
    logger.info('Registering scriptValidator tool...');
    
    server.tool(
      'validate-luau-script',
      'Validate Luau scripts for syntax, best practices, and security issues',
      {
        script: z.string().describe('The Luau script code to validate'),
        checkSyntax: z.boolean().optional().default(true).describe('Check for syntax errors'),
        checkBestPractices: z.boolean().optional().default(true).describe('Check for best practice violations'),
        checkSecurity: z.boolean().optional().default(false).describe('Check for potential security issues')
      },
      async ({ script, checkSyntax, checkBestPractices, checkSecurity }) => {
        try {
          // Boundary validation for script size
          validateBoundaries(script, LIMITS.MAX_SCRIPT_SIZE, 'script', 'validate-luau-script');
          
          const validation = validateLuauScript(
            script, 
            checkSyntax ?? true, 
            checkBestPractices ?? true, 
            checkSecurity ?? false
          );
          
          // Validate the validation response structure
          const structureValidation = validateValidationResponse(validation);
          if (!structureValidation.isValid) {
            logger.error('Validation response structure invalid', structureValidation.errors);
            const structureError = createStandardError(
              ErrorType.INTERNAL_ERROR,
              'Validation response structure is invalid',
              'validate-luau-script'
            );
            return createErrorResponse(structureError);
          }
          
          const response = createStandardResponse(JSON.stringify(validation, null, 2), { includeTimestamp: true });
          
          // Validate MCP compliance
          const mcpValidation = validateMCPResponse(response);
          if (!mcpValidation.isValid) {
            logger.error('Validation response failed MCP validation', mcpValidation.errors);
            const validationError = createStandardError(
              ErrorType.INTERNAL_ERROR,
              'Validation response does not comply with MCP schema',
              'validate-luau-script'
            );
            return createErrorResponse(validationError);
          }
          
          return response;
        } catch (error) {
          logger.error('Script validation failed:', error);
          
          // Handle standardized errors
          if (error && typeof error === 'object' && 'type' in error) {
            return createErrorResponse(error as any);
          }
          
          // Handle other errors
          const internalError = createStandardError(
            ErrorType.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Unknown error occurred during script validation',
            'validate-luau-script'
          );
          return createErrorResponse(internalError);
        }
      }
    );
    
    logger.info('scriptValidator tool registered successfully');
  }
};

function validateLuauScript(script: string, checkSyntax: boolean, checkBestPractices: boolean, checkSecurity: boolean = false) {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const suggestions: ValidationIssue[] = [];
  
  if (checkSyntax) {
    performSyntaxChecks(script, issues);
  }
  
  if (checkBestPractices) {
    performBestPracticeChecks(script, warnings, suggestions);
  }
  
  if (checkSecurity) {
    performSecurityChecks(script, issues, warnings);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    suggestions,
    metrics: {
      lineCount: script.split('\n').length,
      characterCount: script.length,
      functionCount: (script.match(/function\s+\w+/g) || []).length,
      localVariableCount: (script.match(/local\s+\w+/g) || []).length
    }
  };
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  line?: number;
  severity: 'high' | 'medium' | 'low';
  category: string;
}

function performSyntaxChecks(script: string, issues: ValidationIssue[]) {
  const lines = script.split('\n');
  
  // Check for balanced keywords
  const functionCount = (script.match(/\bfunction\b/g) || []).length;
  const endCount = (script.match(/\bend\b/g) || []).length;
  
  if (functionCount > endCount) {
    issues.push({
      type: 'error',
      message: `Missing ${functionCount - endCount} "end" statement(s) for function(s)`,
      severity: 'high',
      category: 'syntax'
    });
  }
  
  // Check for if-then pairs
  const ifMatches = script.match(/\bif\b/g) || [];
  const thenMatches = script.match(/\bthen\b/g) || [];
  
  if (ifMatches.length > thenMatches.length) {
    issues.push({
      type: 'error',
      message: `Missing "then" for if statement`,
      severity: 'high',
      category: 'syntax'
    });
  }
  
  // Check for common syntax errors line by line
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Check for assignment without local in global scope
    if (trimmed.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/) && !trimmed.startsWith('local')) {
      issues.push({
        type: 'error',
        message: 'Assignment to global variable without "local" keyword',
        line: lineNum,
        severity: 'medium',
        category: 'syntax'
      });
    }
    
    // Check for unclosed strings
    const singleQuotes = (trimmed.match(/'/g) || []).length;
    const doubleQuotes = (trimmed.match(/"/g) || []).length;
    
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      issues.push({
        type: 'error',
        message: 'Unclosed string literal',
        line: lineNum,
        severity: 'high',
        category: 'syntax'
      });
    }
  });
}

function performBestPracticeChecks(script: string, warnings: ValidationIssue[], suggestions: ValidationIssue[]) {
  const lines = script.split('\n');
  
  // Check for deprecated functions
  if (script.includes('wait()')) {
    warnings.push({
      type: 'warning',
      message: 'Use task.wait() instead of wait() for better performance',
      severity: 'medium',
      category: 'performance'
    });
  }
  
  if (script.includes('spawn(')) {
    warnings.push({
      type: 'warning',
      message: 'Use task.spawn() instead of spawn() for modern Luau',
      severity: 'medium',
      category: 'performance'
    });
  }
  
  if (script.includes('delay(')) {
    warnings.push({
      type: 'warning',
      message: 'Use task.delay() instead of delay() for better performance',
      severity: 'medium',
      category: 'performance'
    });
  }
  
  // Check for missing local variables
  const localCount = (script.match(/local\s+\w+/g) || []).length;
  if (localCount === 0 && script.length > 100) {
    suggestions.push({
      type: 'suggestion',
      message: 'Consider using local variables for better performance and scope management',
      severity: 'low',
      category: 'performance'
    });
  }
  
  // Check for service access patterns
  if (script.includes('game.') && !script.includes('game:GetService')) {
    suggestions.push({
      type: 'suggestion',
      message: 'Use game:GetService() instead of direct game property access for better performance',
      severity: 'medium',
      category: 'performance'
    });
  }
  
  // Check for hardcoded waits
  const hardcodedWaits = script.match(/wait\(\s*[\d.]+\s*\)/g);
  if (hardcodedWaits && hardcodedWaits.length > 0) {
    suggestions.push({
      type: 'suggestion',
      message: 'Consider using events or heartbeat connections instead of hardcoded waits',
      severity: 'low',
      category: 'design'
    });
  }
  
  // Check for print statements (might be debug code)
  const printCount = (script.match(/print\s*\(/g) || []).length;
  if (printCount > 5) {
    suggestions.push({
      type: 'suggestion',
      message: 'Consider removing debug print statements before production',
      severity: 'low',
      category: 'cleanup'
    });
  }
  
  // Check for magic numbers
  lines.forEach((line, index) => {
    const numbers = line.match(/\b\d{2,}\b/g);
    if (numbers && numbers.length > 0) {
      suggestions.push({
        type: 'suggestion',
        message: 'Consider using named constants instead of magic numbers',
        line: index + 1,
        severity: 'low',
        category: 'readability'
      });
    }
  });
}

function performSecurityChecks(script: string, issues: ValidationIssue[], warnings: ValidationIssue[]) {
  // Check for dangerous functions
  const dangerousFunctions = ['loadstring', 'getfenv', 'setfenv', 'rawget', 'rawset'];
  
  dangerousFunctions.forEach(func => {
    if (script.includes(func)) {
      warnings.push({
        type: 'warning',
        message: `Potentially dangerous function "${func}" detected`,
        severity: 'high',
        category: 'security'
      });
    }
  });
  
  // Check for HTTP requests (might be suspicious)
  if (script.includes('HttpService') || script.includes('RequestAsync')) {
    warnings.push({
      type: 'warning',
      message: 'HTTP requests detected - ensure proper validation of external data',
      severity: 'medium',
      category: 'security'
    });
  }
  
  // Check for DataStore operations without error handling
  if (script.includes('DataStore') && !script.includes('pcall')) {
    warnings.push({
      type: 'warning',
      message: 'DataStore operations should be wrapped in pcall for error handling',
      severity: 'medium',
      category: 'security'
    });
  }
}