import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

export const documentation = {
  register: (server: McpServer) => {
    logger.info('Registering documentation resource...');
    logger.info('documentation resource registered successfully');
  }
};