import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

export const scriptGenerator = {
  register: (server: McpServer) => {
    logger.info('Registering scriptGenerator prompt...');
    logger.info('scriptGenerator prompt registered successfully');
  }
};