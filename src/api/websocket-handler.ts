import WebSocket from 'ws';
import { Server } from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebSocketServerTransport } from '../connection/websocket-transport.js';
import { ConnectionManager } from '../connection/connection-manager.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * WebSocket Handler
 * Manages WebSocket connections for MCP communication
 */
export class WebSocketHandler {
  private wss: WebSocket.Server;
  private mcpServer: McpServer;
  private connectionManager: ConnectionManager;
  private path: string;

  constructor(
    server: Server,
    mcpServer: McpServer,
    connectionManager: ConnectionManager,
    path: string = '/ws'
  ) {
    this.mcpServer = mcpServer;
    this.connectionManager = connectionManager;
    this.path = path;

    // Create WebSocket server
    this.wss = new WebSocket.Server({ server, path });

    // Setup WebSocket server
    this.setupWebSocketServer();

    logger.info(`WebSocket handler initialized on path: ${path}`);
  }

  /**
   * Setup WebSocket server event handlers
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (socket, req) => {
      const ip = req.socket.remoteAddress || 'unknown';
      const connectionId = uuidv4();

      logger.info(`New WebSocket connection from ${ip} (${connectionId})`);

      // Create transport
      const transport = new WebSocketServerTransport(socket);

      // Register with connection manager
      this.connectionManager.registerConnection(transport.sessionId, transport);

      // Set up connection close handler
      transport.onClose(() => {
        logger.info(`WebSocket connection closed: ${transport.sessionId}`);
        this.connectionManager.unregisterConnection(transport.sessionId);
      });

      // Connect to MCP server
      this.mcpServer.connect(transport)
        .catch(error => {
          logger.error(`Failed to connect WebSocket to MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
          socket.close();
        });
    });

    this.wss.on('error', (error) => {
      logger.error(`WebSocket server error: ${error.message}`);
    });

    this.wss.on('close', () => {
      logger.info('WebSocket server closed');
    });
  }

  /**
   * Get the current number of active connections
   */
  getConnectionCount(): number {
    return this.wss.clients.size;
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message: string): void {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Close all WebSocket connections
   */
  closeAllConnections(): void {
    this.wss.clients.forEach(client => {
      client.close();
    });
  }

  /**
   * Close the WebSocket server
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
