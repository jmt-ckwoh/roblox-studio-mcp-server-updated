import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { scriptGenerator } from './scriptGenerator.js';
import { bugFinder } from './bugFinder.js';
import { logger } from '../utils/logger.js';

/**
 * Registry for all Roblox Studio prompts
 */
export const robloxPrompts = {
  register: (server: McpServer) => {
    logger.info('Registering Roblox Studio prompts...');
    
    // Register all prompts
    scriptGenerator.register(server);
    bugFinder.register(server);
    
    logger.info('Roblox Studio prompts registered successfully');
  }
};
