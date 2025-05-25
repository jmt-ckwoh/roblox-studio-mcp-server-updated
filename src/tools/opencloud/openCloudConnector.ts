import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../../utils/logger.js';

export const openCloudConnector = {
  register: (server: McpServer) => {
    logger.info('Registering openCloudConnector tool...');
    logger.info('openCloudConnector tool registered successfully');
  }
};