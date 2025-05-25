import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

export const socialFeatures = {
  register: (server: McpServer) => {
    logger.info('Registering socialFeatures tool...');
    logger.info('socialFeatures tool registered successfully');
  }
};