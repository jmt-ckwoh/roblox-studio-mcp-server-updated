import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

export const educationalTools = {
  register: (server: McpServer) => {
    logger.info('Registering educationalTools tool...');
    logger.info('educationalTools tool registered successfully');
  }
};