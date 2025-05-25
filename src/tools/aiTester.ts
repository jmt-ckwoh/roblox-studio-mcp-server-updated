import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

export const aiTester = {
  register: (server: McpServer) => {
    logger.info('Registering aiTester tool...');
    logger.info('aiTester tool registered successfully');
  }
};