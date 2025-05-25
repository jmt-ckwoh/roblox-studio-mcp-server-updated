/**
 * HTTP-only version of Studio MCP Server for testing
 * This version doesn't use stdio transport, just HTTP endpoints
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { StudioCommand, StudioResponse, ResponseChannel, validateStudioResponse } from '../shared/studio-protocol.js';
import { DEFAULT_STUDIO_CONFIG, validateConfig } from '../shared/studio-config.js';

// Types imported from shared definitions - no local duplicates

class HttpOnlyStudioServer {
  private app: express.Application;
  private commandQueue: StudioCommand[] = [];
  private responseChannels: Map<string, ResponseChannel> = new Map();
  private queueEmitter: EventEmitter = new EventEmitter();
  private config = DEFAULT_STUDIO_CONFIG;
  
  constructor() {
    validateConfig(this.config);
    
    this.app = express();
    this.setupExpress();
    this.setupRoutes();
  }

  private setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Studio plugin polls this for commands
    this.app.get(this.config.server.endpoints.request, async (req, res) => {
      try {
        if (this.commandQueue.length > 0) {
          const command = this.commandQueue.shift()!;
          console.log(`📤 Sending command to Studio: ${command.tool}`);
          res.json(command);
        } else {
          // Long polling - wait for new commands
          const timeout = setTimeout(() => {
            this.queueEmitter.removeAllListeners('newCommand');
            res.json(null);
          }, this.config.timeouts.pollTimeout);

          this.queueEmitter.once('newCommand', () => {
            clearTimeout(timeout);
            if (this.commandQueue.length > 0) {
              const command = this.commandQueue.shift()!;
              console.log(`📤 Sending command to Studio: ${command.tool}`);
              res.json(command);
            } else {
              res.json(null);
            }
          });
        }
      } catch (error) {
        console.error('Error in /request:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Studio plugin sends responses here
    this.app.post(this.config.server.endpoints.response, (req, res) => {
      try {
        const response: StudioResponse = req.body;
        console.log(`📥 Received response from Studio: ${response.id}`);
        
        const channel = this.responseChannels.get(response.id);
        if (channel) {
          clearTimeout(channel.timeout);
          this.responseChannels.delete(response.id);
          
          if (response.success) {
            channel.resolve(response.result || '');
          } else {
            channel.reject(response.error || 'Unknown error');
          }
        }
        
        res.json({ status: 'received' });
      } catch (error) {
        console.error('Error in /response:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Test endpoint for manual testing
    this.app.post('/test-tool', async (req, res) => {
      try {
        const { tool, args } = req.body;
        console.log(`🔧 Testing tool: ${tool} with args:`, args);
        
        const result = await this.executeStudioCommand(tool, args);
        
        // Parse JSON response from Studio plugin to avoid double encoding
        let parsedResult;
        try {
          parsedResult = JSON.parse(result);
        } catch {
          // If parsing fails, treat as plain string
          parsedResult = result;
        }
        
        res.json({ success: true, result: parsedResult });
      } catch (error) {
        console.error('Error testing tool:', error);
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // Health check
    this.app.get(this.config.server.endpoints.health, (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  private async executeStudioCommand(tool: string, args: any): Promise<string> {
    // Map snake_case to PascalCase tool names
    const toolNameMap: Record<string, string> = {
      'get_workspace': 'GetWorkspace',
      'get_workspace_files': 'GetWorkspaceFiles',
      'get_file_content': 'GetFileContent',
      'update_file_content': 'UpdateFileContent',
      'run_code': 'RunCode', 
      'create_part': 'CreatePart',
      'insert_model': 'InsertModel',
      'manage_datastore': 'ManageDatastore',
      'create_gui': 'CreateGUI',
      'get_console_output': 'GetConsoleOutput'
    };
    
    const studioToolName = toolNameMap[tool] || tool;
    const commandId = uuidv4();
    const command: StudioCommand = {
      id: commandId,
      tool: studioToolName,
      args,
      timestamp: Date.now()
    };

    // Add to queue and notify waiting long-poll requests
    this.commandQueue.push(command);
    this.queueEmitter.emit('newCommand');

    // Create response channel with timeout
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseChannels.delete(commandId);
        reject(new Error(`Studio command timeout (${this.config.timeouts.commandTimeout}ms)`));
      }, this.config.timeouts.commandTimeout);

      this.responseChannels.set(commandId, {
        resolve,
        reject,
        timeout
      });
    });
  }

  start() {
    const httpServer = this.app.listen(this.config.server.port, '0.0.0.0', () => {
      console.log(`🚀 HTTP-Only Studio Server running on port ${this.config.server.port}`);
      console.log(`📡 Studio plugin should connect to: http://${this.config.server.host}:${this.config.server.port}`);
      console.log(`🧪 Test tools at: http://${this.config.server.host}:${this.config.server.port}/test-tool`);
      console.log(`❤️  Health check: http://${this.config.server.host}:${this.config.server.port}${this.config.server.endpoints.health}`);
      console.log('');
      console.log('🎯 Ready for testing! Server will stay running...');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n💀 Shutting down HTTP-Only Studio Server...');
      httpServer.close(() => {
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n💀 Shutting down HTTP-Only Studio Server...');
      httpServer.close(() => {
        process.exit(0);
      });
    });

    return httpServer;
  }
}

// Start the server - always start when this file is executed
const server = new HttpOnlyStudioServer();
server.start();

export { HttpOnlyStudioServer };