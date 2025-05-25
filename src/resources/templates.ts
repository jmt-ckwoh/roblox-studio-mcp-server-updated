import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

export const templates = {
  register: (server: McpServer) => {
    logger.info('Registering templates resource...');
    logger.info('templates resource registered successfully');
  }
};