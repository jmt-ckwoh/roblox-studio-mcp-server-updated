import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

export const bugFinder = {
  register: (server: McpServer) => {
    logger.info('Registering bugFinder prompt...');
    logger.info('bugFinder prompt registered successfully');
  }
};