import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import dotenv from 'dotenv';
import { robloxTools } from './tools/index.js';
import { robloxResources } from './resources/index.js';
import { robloxPrompts } from './prompts/index.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFound, ApiError } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Server configuration
const PORT = process.env.PORT || 3000;
const SERVER_NAME = process.env.SERVER_NAME || 'Roblox Studio MCP Server';
const SERVER_VERSION = process.env.SERVER_VERSION || '1.0.0';
const DEBUG = process.env.DEBUG === 'true';
const NODE_ENV = process.env.NODE_ENV || 'development';

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

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS === '*' ? '*' : process.env.CORS_ORIGINS?.split(','),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log when the response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });
  
  next();
});

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
app.get('/sse', async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

// Messages endpoint
app.post('/messages', async (req, res, next) => {
  try {
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId) {
      throw new ApiError('Missing sessionId parameter', 400);
    }
    
    const transport = transports[sessionId];
    
    // Update metrics
    metrics.requests.total += 1;
    
    if (transport) {
      await transport.handlePostMessage(req, res);
      metrics.requests.success += 1;
    } else {
      metrics.requests.error += 1;
      throw new ApiError(`No transport found for sessionId: ${sessionId}`, 400);
    }
  } catch (error) {
    next(error);
  }
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'ok',
    name: SERVER_NAME,
    version: SERVER_VERSION,
    environment: NODE_ENV,
    activeSessions: Object.keys(transports).length
  });
});

// Metrics endpoint
app.get('/metrics', (_, res) => {
  const uptime = Math.floor((new Date().getTime() - metrics.startTime.getTime()) / 1000);
  
  res.status(200).json({
    server: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      environment: NODE_ENV,
      uptime: uptime,
      uptime_formatted: formatUptime(uptime)
    },
    metrics: {
      connections: metrics.connections,
      requests: metrics.requests,
      memory: process.memoryUsage()
    }
  });
});

// Add error handling middleware
app.use(notFound);
app.use(errorHandler);

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
  logger.info(`${SERVER_NAME} v${SERVER_VERSION} running on port ${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);
  if (DEBUG) {
    logger.info('Debug mode enabled');
  }
});

// Handle process exit
process.on('SIGINT', () => {
  logger.info('Server shutting down...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.critical('Uncaught exception', error);
  // Give the logger time to log the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.critical('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)));
});
