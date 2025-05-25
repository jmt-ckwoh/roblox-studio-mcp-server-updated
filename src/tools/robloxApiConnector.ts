import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { validateUserInput } from '../utils/security.js';
import { 
  ErrorType, 
  createStandardError, 
  createErrorResponse, 
  validateBoundaries, 
  LIMITS 
} from '../utils/error-handler.js';
import { 
  validateMCPResponse, 
  validateApiResponse, 
  createStandardResponse 
} from '../utils/response-formatter.js';

/**
 * Roblox API integration tool
 */
export const robloxApiConnector = {
  register: (server: McpServer) => {
    logger.info('Registering robloxApiConnector tool...');
    
    server.tool(
      'call-roblox-api',
      'Make API calls to Roblox web services',
      {
        endpoint: z.string().describe('API endpoint path (e.g., /v1/users/get-by-username)'),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET').describe('HTTP method'),
        parameters: z.record(z.any()).optional().describe('Query parameters or request body'),
        apiType: z.enum(['web', 'catalog', 'games', 'opencloud']).default('web').describe('Type of Roblox API to call')
      },
      async ({ endpoint, method, parameters, apiType }) => {
        try {
          // Boundary validation for endpoint and parameters
          validateBoundaries(endpoint, LIMITS.MAX_ENDPOINT_LENGTH, 'endpoint', 'call-roblox-api');
          if (parameters && typeof parameters === 'object') {
            const paramString = JSON.stringify(parameters);
            validateBoundaries(paramString, LIMITS.MAX_PARAMETER_SIZE, 'parameters', 'call-roblox-api');
          }
          
          const result = await callRobloxAPI(endpoint, method ?? 'GET', parameters, apiType ?? 'web');
          
          // Validate API response structure  
          const apiValidation = validateApiResponse(result);
          if (!apiValidation.isValid) {
            logger.error('API response structure invalid', apiValidation.errors);
            const structureError = createStandardError(
              ErrorType.INTERNAL_ERROR,
              'API response structure is invalid',
              'call-roblox-api'
            );
            return createErrorResponse(structureError);
          }
          
          const response = createStandardResponse(JSON.stringify(result, null, 2), { includeTimestamp: true });
          
          // Validate MCP compliance
          const mcpValidation = validateMCPResponse(response);
          if (!mcpValidation.isValid) {
            logger.error('API response failed MCP validation', mcpValidation.errors);
            const validationError = createStandardError(
              ErrorType.INTERNAL_ERROR,
              'API response does not comply with MCP schema',
              'call-roblox-api'
            );
            return createErrorResponse(validationError);
          }
          
          return response;
        } catch (error) {
          logger.error('Roblox API call failed:', error);
          
          // Handle standardized errors
          if (error && typeof error === 'object' && 'type' in error) {
            return createErrorResponse(error as any);
          }
          
          // Handle other errors
          const internalError = createStandardError(
            ErrorType.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Unknown error occurred during API call',
            'call-roblox-api'
          );
          return createErrorResponse(internalError);
        }
      }
    );
    
    server.tool(
      'get-user-info',
      'Get information about a Roblox user',
      {
        identifier: z.string().describe('Username or user ID'),
        type: z.enum(['username', 'userid']).default('username').describe('Type of identifier')
      },
      async ({ identifier, type }) => {
        try {
          // Boundary validation first
          validateBoundaries(identifier, LIMITS.MAX_IDENTIFIER_LENGTH, 'identifier', 'get-user-info');
          
          // Validate and sanitize user identifier for security
          const validationResult = validateUserInput(identifier);
          
          if (!validationResult.isValid) {
            logger.warn('User info request rejected due to security validation', {
              original: identifier,
              error: validationResult.error
            });
            const securityError = createStandardError(
              ErrorType.SECURITY_ERROR,
              validationResult.error || 'Invalid user identifier',
              'get-user-info',
              'identifier'
            );
            return createErrorResponse(securityError);
          }
          
          // Use sanitized identifier for API call
          const userInfo = await getUserInfo(validationResult.sanitized, type ?? 'username');
          
          const response = createStandardResponse(JSON.stringify(userInfo, null, 2), { includeTimestamp: true });
          
          // Validate MCP compliance
          const mcpValidation = validateMCPResponse(response);
          if (!mcpValidation.isValid) {
            logger.error('User info response failed MCP validation', mcpValidation.errors);
            const validationError = createStandardError(
              ErrorType.INTERNAL_ERROR,
              'User info response does not comply with MCP schema',
              'get-user-info'
            );
            return createErrorResponse(validationError);
          }
          
          return response;
        } catch (error) {
          logger.error('User info fetch failed:', error);
          
          // Handle standardized errors
          if (error && typeof error === 'object' && 'type' in error) {
            return createErrorResponse(error as any);
          }
          
          // Handle other errors
          const internalError = createStandardError(
            ErrorType.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Unknown error occurred during user info fetch',
            'get-user-info'
          );
          return createErrorResponse(internalError);
        }
      }
    );
    
    logger.info('robloxApiConnector tool registered successfully');
  }
};

async function callRobloxAPI(endpoint: string, method: string, parameters: any = {}, apiType: string = 'web') {
  try {
    const baseUrls = {
      web: 'https://www.roblox.com/api',
      catalog: 'https://catalog.roblox.com',
      games: 'https://games.roblox.com',
      opencloud: 'https://apis.roblox.com/cloud'
    };
    
    const baseUrl = baseUrls[apiType as keyof typeof baseUrls] || baseUrls.web;
    const url = `${baseUrl}${endpoint}`;
    
    logger.info(`Calling Roblox API: ${method} ${url}`);
    
    // Mock responses for different API types
    const mockResponses = {
      '/v1/users/get-by-username': {
        users: [{
          requestedUsername: parameters.usernames?.[0] || 'MockUser',
          hasVerifiedBadge: false,
          id: 123456789,
          name: parameters.usernames?.[0] || 'MockUser',
          displayName: parameters.usernames?.[0] || 'MockUser'
        }]
      },
      '/v1/users': {
        id: 123456789,
        name: 'MockUser',
        displayName: 'MockUser',
        description: 'A mock user for testing',
        created: '2020-01-01T00:00:00.000Z',
        hasVerifiedBadge: false
      },
      '/v1/search/items': {
        data: [
          {
            id: 123456789,
            name: 'Mock Asset',
            description: 'A mock asset for testing',
            assetType: 'Model',
            creator: { id: 1, name: 'ROBLOX', type: 'User' },
            product: { id: 123456, type: 'User Product', isForSale: true, priceInRobux: 0 }
          }
        ],
        totalResults: 1
      }
    };
    
    const mockResponse = mockResponses[endpoint as keyof typeof mockResponses] || {
      message: `Mock response for ${endpoint}`,
      parameters,
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      apiType
    };
    
    return {
      status: 'success',
      data: mockResponse,
      metadata: {
        endpoint,
        method,
        apiType,
        timestamp: new Date().toISOString(),
        isMock: true
      }
    };
  } catch (error) {
    logger.error('Roblox API call failed:', error);
    throw error;
  }
}

async function getUserInfo(identifier: string, type: 'username' | 'userid' = 'username') {
  try {
    if (type === 'username') {
      // Get user by username
      const response = await callRobloxAPI('/v1/users/get-by-username', 'POST', {
        usernames: [identifier]
      });
      
      const userData = (response.data as any).users?.[0];
      if (!userData) {
        throw new Error('User not found');
      }
      
      // Get additional user details
      const detailsResponse = await callRobloxAPI(`/v1/users/${userData.id}`, 'GET');
      
      return {
        ...userData,
        ...detailsResponse.data,
        source: 'username_lookup'
      };
    } else {
      // Get user by ID
      const response = await callRobloxAPI(`/v1/users/${identifier}`, 'GET');
      return {
        ...response.data,
        source: 'userid_lookup'
      };
    }
  } catch (error) {
    logger.error('User info fetch failed:', error);
    throw error;
  }
}