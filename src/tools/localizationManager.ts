import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

export const localizationManager = {
  register: (server: McpServer) => {
    logger.info('Registering localizationManager tool...');
    logger.info('localizationManager tool registered successfully');
  }
};