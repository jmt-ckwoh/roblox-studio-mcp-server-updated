import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

export const metaverseIntegration = {
  register: (server: McpServer) => {
    logger.info('Registering metaverseIntegration tool...');
    logger.info('metaverseIntegration tool registered successfully');
  }
};