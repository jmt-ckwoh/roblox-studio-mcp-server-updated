import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { validateInput } from '../../utils/input-validator.js';
import { createStandardError, createErrorResponse, ErrorType, validateBoundaries, LIMITS } from '../../utils/error-handler.js';
import { createStandardResponse } from '../../utils/response-formatter.js';

export const datastoreManager = {
  register: (server: McpServer) => {
    logger.info('Registering datastoreManager tool...');
    
    server.tool(
      'manage-datastore',
      'Manage Roblox DataStore operations - create, read, update, delete data with generated Luau code',
      {
        operation: z.enum(['read', 'write', 'list', 'delete']).describe('DataStore operation to perform'),
        datastoreName: z.string().min(1).max(50).describe('Name of the DataStore'),
        key: z.string().min(1).max(50).describe('Key for the data entry'),
        data: z.any().optional().describe('Data to store (required for write operations)'),
        scope: z.string().optional().default('global').describe('DataStore scope (optional, defaults to global)')
      },
      async ({ operation, datastoreName, key, data, scope }) => {
        try {
          // Boundary validation
          validateBoundaries(datastoreName, 50, 'datastoreName', 'manage-datastore');
          validateBoundaries(key, 50, 'key', 'manage-datastore');
          
          // Input validation
          const datastoreValidation = validateInput(datastoreName, { 
            maxLength: 50,
            fieldName: 'datastoreName'
          });
          
          if (!datastoreValidation.isValid) {
            const validationError = createStandardError(
              ErrorType.VALIDATION_ERROR,
              `Invalid datastore name: ${datastoreValidation.errors.join(', ')}`,
              'manage-datastore',
              'datastoreName'
            );
            return createErrorResponse(validationError);
          }
          
          const keyValidation = validateInput(key, { 
            maxLength: 50,
            fieldName: 'key'
          });
          
          if (!keyValidation.isValid) {
            const validationError = createStandardError(
              ErrorType.VALIDATION_ERROR,
              `Invalid key format: ${keyValidation.errors.join(', ')}`,
              'manage-datastore',
              'key'
            );
            return createErrorResponse(validationError);
          }
          
          // Generate operation-specific code and result
          let result: string;
          let generatedCode: string;
          
          switch (operation) {
            case 'read':
              result = `Successfully read data from DataStore '${datastoreName}' with key '${key}'`;
              generatedCode = generateReadCode(datastoreName, key, scope);
              break;
              
            case 'write':
              if (data === undefined) {
                const dataError = createStandardError(
                  ErrorType.VALIDATION_ERROR,
                  'Data parameter is required for write operations',
                  'manage-datastore',
                  'data'
                );
                return createErrorResponse(dataError);
              }
              result = `Successfully wrote data to DataStore '${datastoreName}' with key '${key}'`;
              generatedCode = generateWriteCode(datastoreName, key, data, scope);
              break;
              
            case 'list':
              result = `Successfully listed keys from DataStore '${datastoreName}'`;
              generatedCode = generateListCode(datastoreName, scope);
              break;
              
            case 'delete':
              result = `Successfully deleted key '${key}' from DataStore '${datastoreName}'`;
              generatedCode = generateDeleteCode(datastoreName, key, scope);
              break;
              
            default:
              const operationError = createStandardError(
                ErrorType.VALIDATION_ERROR,
                `Unsupported operation: ${operation}`,
                'manage-datastore',
                'operation'
              );
              return createErrorResponse(operationError);
          }
          
          const responseText = `${result}\n\n**Generated Luau Code:**\n\`\`\`lua\n${generatedCode}\n\`\`\`\n\n**Usage Notes:**\n- Place this code in a ServerScript for DataStore access\n- Ensure DataStore API is enabled in game settings\n- Handle errors appropriately in production code`;
          
          return createStandardResponse(responseText, { includeTimestamp: true });
          
        } catch (error) {
          const internalError = createStandardError(
            ErrorType.INTERNAL_ERROR,
            `Failed to perform DataStore operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'manage-datastore'
          );
          return createErrorResponse(internalError);
        }
      }
    );
    
    logger.info('datastoreManager tool registered successfully');
  }
};

function generateReadCode(datastoreName: string, key: string, scope?: string): string {
  const scopeParam = scope && scope !== 'global' ? `, "${scope}"` : '';
  return `-- DataStore Read Operation
local DataStoreService = game:GetService("DataStoreService")
local dataStore = DataStoreService:GetDataStore("${datastoreName}"${scopeParam})

local success, result = pcall(function()
    return dataStore:GetAsync("${key}")
end)

if success then
    if result then
        print("Data retrieved successfully:", result)
        -- Process the retrieved data here
        return result
    else
        print("No data found for key: ${key}")
        return nil
    end
else
    warn("Failed to read from DataStore:", result)
    return nil
end`;
}

function generateWriteCode(datastoreName: string, key: string, data: any, scope?: string): string {
  const scopeParam = scope && scope !== 'global' ? `, "${scope}"` : '';
  const dataStr = typeof data === 'string' ? `"${data}"` : JSON.stringify(data);
  
  return `-- DataStore Write Operation
local DataStoreService = game:GetService("DataStoreService")
local dataStore = DataStoreService:GetDataStore("${datastoreName}"${scopeParam})

local dataToStore = ${dataStr}

local success, result = pcall(function()
    return dataStore:SetAsync("${key}", dataToStore)
end)

if success then
    print("Data saved successfully to key: ${key}")
    return true
else
    warn("Failed to save to DataStore:", result)
    return false
end`;
}

function generateListCode(datastoreName: string, scope?: string): string {
  const scopeParam = scope && scope !== 'global' ? `, "${scope}"` : '';
  return `-- DataStore List Keys Operation
local DataStoreService = game:GetService("DataStoreService")
local dataStore = DataStoreService:GetDataStore("${datastoreName}"${scopeParam})

local success, result = pcall(function()
    return dataStore:ListKeysAsync()
end)

if success then
    local keys = {}
    repeat
        local page = result:GetCurrentPage()
        for _, keyInfo in pairs(page) do
            table.insert(keys, keyInfo.KeyName)
            print("Found key:", keyInfo.KeyName)
        end
        if not result.IsFinished then
            result:AdvanceToNextPageAsync()
        end
    until result.IsFinished
    
    print("Total keys found:", #keys)
    return keys
else
    warn("Failed to list DataStore keys:", result)
    return {}
end`;
}

function generateDeleteCode(datastoreName: string, key: string, scope?: string): string {
  const scopeParam = scope && scope !== 'global' ? `, "${scope}"` : '';
  return `-- DataStore Delete Operation
local DataStoreService = game:GetService("DataStoreService")
local dataStore = DataStoreService:GetDataStore("${datastoreName}"${scopeParam})

local success, result = pcall(function()
    return dataStore:RemoveAsync("${key}")
end)

if success then
    if result then
        print("Data deleted successfully. Previous value was:", result)
        return result
    else
        print("Key did not exist: ${key}")
        return nil
    end
else
    warn("Failed to delete from DataStore:", result)
    return nil
end`;
}