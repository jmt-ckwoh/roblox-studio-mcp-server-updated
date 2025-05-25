/**
 * TypeScript MCP Server with Real Studio Integration
 * Follows Rust server architecture but implemented in TypeScript
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import express from 'express';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

// Types for Studio communication
interface StudioCommand {
  id: string;
  tool: string;
  args: any;
  timestamp: number;
}

interface StudioResponse {
  id: string;
  response: string;
  success: boolean;
  error?: string;
}

interface ResponseChannel {
  resolve: (response: string) => void;
  reject: (error: string) => void;
  timeout: NodeJS.Timeout;
}

// Server state management
class StudioMCPServer {
  private app: express.Application;
  private mcpServer: Server;
  private commandQueue: StudioCommand[] = [];
  private responseChannels: Map<string, ResponseChannel> = new Map();
  private queueEmitter: EventEmitter = new EventEmitter();
  private httpPort: number = 44755; // Same port as Rust server
  
  constructor() {
    this.app = express();
    this.mcpServer = new Server(
      {
        name: 'roblox-studio-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    this.setupExpress();
    this.setupMCPServer();
  }

  private setupExpress() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Studio plugin polls this for commands (long polling)
    this.app.get('/request', (req, res) => {
      const command = this.commandQueue.shift();
      
      if (command) {
        res.json(command);
        return;
      }

      // Long polling - wait up to 15 seconds for new command
      const timeout = setTimeout(() => {
        this.queueEmitter.off('newCommand', commandHandler);
        res.status(423).json({ error: 'No commands available' }); // 423 LOCKED (matches Rust server)
      }, 15000);

      const commandHandler = () => {
        clearTimeout(timeout);
        const newCommand = this.commandQueue.shift();
        if (newCommand) {
          res.json(newCommand);
        } else {
          res.status(423).json({ error: 'No commands available' });
        }
      };

      this.queueEmitter.once('newCommand', commandHandler);
    });

    // Studio plugin sends execution results here
    this.app.post('/response', (req, res) => {
      const { id, response, success, error }: StudioResponse = req.body;
      
      if (!id) {
        res.status(400).json({ error: 'Missing response ID' });
        return;
      }

      const channel = this.responseChannels.get(id);
      if (channel) {
        clearTimeout(channel.timeout);
        this.responseChannels.delete(id);
        
        if (success) {
          channel.resolve(response);
        } else {
          channel.reject(error || 'Studio execution failed');
        }
      }

      res.json({ received: true });
    });

    // Proxy endpoint for port conflicts (matches Rust server pattern)
    this.app.post('/proxy', (req, res) => {
      // For now, just log the proxy attempt
      console.log('Proxy request received:', req.body);
      res.json({ proxied: true });
    });
  }

  private setupMCPServer() {
    // Register core Studio tools
    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'run_code':
          const command = (args as any)?.command;
          if (typeof command !== 'string') {
            throw new Error('run_code requires command parameter');
          }
          const response = await this.executeStudioCommand('RunCode', { command });
          return {
            content: [{
              type: 'text' as const,
              text: response
            }]
          };
          
        case 'insert_model':
          const query = (args as any)?.query;
          if (typeof query !== 'string') {
            throw new Error('insert_model requires query parameter');
          }
          const insertResponse = await this.executeStudioCommand('InsertModel', { query });
          return {
            content: [{
              type: 'text' as const,
              text: `Inserted model: ${insertResponse}`
            }]
          };
          
        case 'create_part':
          const partResponse = await this.executeStudioCommand('CreatePart', args || {});
          return {
            content: [{
              type: 'text' as const,
              text: partResponse
            }]
          };
          
        case 'get_workspace':
          const maxDepth = (args as any)?.maxDepth || 3;
          const workspaceResponse = await this.executeStudioCommand('GetWorkspace', { maxDepth });
          return {
            content: [{
              type: 'text' as const,
              text: workspaceResponse
            }]
          };
          
        case 'manage_datastore':
          const datastoreResponse = await this.executeStudioCommand('ManageDatastore', args || {});
          return {
            content: [{
              type: 'text' as const,
              text: datastoreResponse
            }]
          };
          
        case 'create_gui':
          const guiResponse = await this.executeStudioCommand('CreateGUI', args || {});
          return {
            content: [{
              type: 'text' as const,
              text: guiResponse
            }]
          };
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // Tools list for Claude discovery
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'run_code',
            description: 'Execute Luau code directly in Roblox Studio',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'Luau code to execute in Studio'
                }
              },
              required: ['command']
            }
          },
          {
            name: 'insert_model',
            description: 'Insert a model from Roblox marketplace into Studio workspace',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for marketplace model'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'create_part',
            description: 'Create a new Part in Studio workspace with specified properties',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Name for the part' },
                color: { type: 'string', description: 'Part color (e.g., "Bright red", "Really blue")' },
                material: { type: 'string', description: 'Part material (e.g., "Neon", "Glass", "Metal")' },
                size: { type: 'string', description: 'Part size as "X,Y,Z" (e.g., "4,1,2")' },
                position: { type: 'string', description: 'Part position as "X,Y,Z" (e.g., "0,10,0")' }
              }
            }
          },
          {
            name: 'get_workspace',
            description: 'Get current Studio workspace hierarchy and objects',
            inputSchema: {
              type: 'object',
              properties: {
                maxDepth: {
                  type: 'number',
                  description: 'Maximum depth to traverse',
                  default: 3
                }
              }
            }
          },
          {
            name: 'manage_datastore',
            description: 'Perform DataStore operations in Studio (read, write, list, delete)',
            inputSchema: {
              type: 'object',
              properties: {
                operation: { type: 'string', enum: ['read', 'write', 'list', 'delete'], description: 'DataStore operation' },
                datastoreName: { type: 'string', description: 'Name of the DataStore' },
                key: { type: 'string', description: 'Key for the data entry' },
                data: { description: 'Data to store (for write operations)' },
                scope: { type: 'string', description: 'DataStore scope', default: 'global' }
              },
              required: ['operation', 'datastoreName', 'key']
            }
          },
          {
            name: 'create_gui',
            description: 'Create GUI elements in Studio PlayerGui',
            inputSchema: {
              type: 'object',
              properties: {
                componentType: {
                  type: 'string',
                  enum: ['ScreenGui', 'Frame', 'TextLabel', 'TextButton', 'ImageLabel'],
                  description: 'Type of GUI component'
                },
                properties: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    text: { type: 'string' },
                    size: { type: 'string', description: 'Size as UDim2 string like "{0.5,0},{0.1,0}"' },
                    position: { type: 'string', description: 'Position as UDim2 string' },
                    backgroundColor: { type: 'string' },
                    textColor: { type: 'string' }
                  }
                }
              },
              required: ['componentType']
            }
          }
        ]
      };
    });
  }

  private async executeStudioCommand(tool: string, args: any): Promise<string> {
    const commandId = uuidv4();
    const command: StudioCommand = {
      id: commandId,
      tool,
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
        reject(new Error('Studio command timeout (30 seconds)'));
      }, 30000);

      this.responseChannels.set(commandId, {
        resolve,
        reject,
        timeout
      });
    });
  }

  async start() {
    // Start HTTP server
    const httpServer = this.app.listen(this.httpPort, () => {
      console.log(`Studio MCP HTTP server running on port ${this.httpPort}`);
    });

    // Start MCP server with stdio transport
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    
    console.log('Studio MCP Server ready for Claude Desktop connection');
    console.log('Install the Studio plugin and start using Claude with Roblox Studio!');
    console.log('Server is running... Press Ctrl+C to stop');

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down Studio MCP Server...');
      httpServer.close();
      process.exit(0);
    });

    // Keep process alive
    process.on('SIGTERM', () => {
      console.log('Shutting down Studio MCP Server...');
      httpServer.close();
      process.exit(0);
    });
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StudioMCPServer();
  server.start().catch(console.error);
}

export { StudioMCPServer };