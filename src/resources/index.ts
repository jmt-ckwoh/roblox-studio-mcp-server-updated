import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { documentation } from './documentation.js';
import { templates } from './templates.js';
import { logger } from '../utils/logger.js';

/**
 * Registry for all Roblox Studio resources
 */
export const robloxResources = {
  register: (server: McpServer) => {
    logger.info('Registering Roblox Studio resources...');
    
    // Register all resources
    documentation.register(server);
    templates.register(server);
    
    logger.info('Roblox Studio resources registered successfully');
  }
};
