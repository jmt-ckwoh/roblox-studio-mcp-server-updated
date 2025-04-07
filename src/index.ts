import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import dotenv from 'dotenv';
import { robloxTools } from './tools/index.js';
import { robloxResources } from './resources/index.js';
import { robloxPrompts } from './prompts/index.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Server configuration
const PORT = process.env.PORT || 3000;
const SERVER_NAME = process.env.SERVER_NAME || 'Roblox Studio MCP Server';
const SERVER_VERSION = process.env.SERVER_VERSION || '1.0.0';
const DEBUG = process.env.DEBUG === 'true';

// Create MCP Server
const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION
});

// Register tools, resources, and prompts
robloxTools.register(server);
robloxResources.register(server);
robloxPrompts.register(server);

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Storage for active transports
const transports: { [sessionId: string]: SSEServerTransport } = {};

// Simple metrics for monitoring
const metrics = {
  connections: {
    total: 0,
    active: 0,
  },
  requests: {
    total: 0,
    success: 0,
    error: 0,
  },
  startTime: new Date(),
};

// SSE endpoint
app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  
  // Update metrics
  metrics.connections.total += 1;
  metrics.connections.active = Object.keys(transports).length;
  
  logger.info(`New SSE connection established: ${transport.sessionId}`);
  
  res.on('close', () => {
    logger.info(`SSE connection closed: ${transport.sessionId}`);
    delete transports[transport.sessionId];
    metrics.connections.active = Object.keys(transports).length;
  });
  
  await server.connect(transport);
});

// Messages endpoint
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  
  // Update metrics
  metrics.requests.total += 1;
  
  if (transport) {
    try {
      await transport.handlePostMessage(req, res);
      metrics.requests.success += 1;
    } catch (error) {
      metrics.requests.error += 1;
      logger.error(`Error handling message: ${error}`);
      res.status(500).send('Internal server error');
    }
  } else {
    metrics.requests.error += 1;
    logger.error(`No transport found for sessionId: ${sessionId}`);
    res.status(400).send('No transport found for sessionId');
  }
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'ok',
    name: SERVER_NAME,
    version: SERVER_VERSION,
    activeSessions: Object.keys(transports).length
  });
});

// Metrics endpoint
app.get('/metrics', (_, res) => {
  const uptime = Math.floor((new Date().getTime() - metrics.startTime.getTime()) / 1000);
  
  res.status(200).json({
    ...metrics,
    uptime: uptime,
    uptime_formatted: formatUptime(uptime)
  });
});

// Format uptime helper
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * 24 * 60 * 60;
  const hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * 60 * 60;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Start server
app.listen(PORT, () => {
  logger.info(`${SERVER_NAME} running on port ${PORT}`);
  if (DEBUG) {
    logger.info('Debug mode enabled');
  }
});

// Handle process exit
process.on('SIGINT', () => {
  logger.info('Server shutting down...');
  process.exit(0);
});
