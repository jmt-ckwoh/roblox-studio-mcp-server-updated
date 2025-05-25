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
import { StudioCommand, StudioResponse, ResponseChannel, validateStudioResponse } from '../shared/studio-protocol.js';
import { DEFAULT_STUDIO_CONFIG, validateConfig } from '../shared/studio-config.js';

// Types imported from shared definitions - no local duplicates

// Server state management
class StudioMCPServer {
  private app: express.Application;
  private mcpServer: Server;
  private commandQueue: StudioCommand[] = [];
  private responseChannels: Map<string, ResponseChannel> = new Map();
  private queueEmitter: EventEmitter = new EventEmitter();
  private config = DEFAULT_STUDIO_CONFIG;
  
  constructor() {
    validateConfig(this.config);
    
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
    this.app.get(this.config.server.endpoints.health, (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Studio plugin polls this for commands (long polling)
    this.app.get(this.config.server.endpoints.request, (req, res) => {
      const command = this.commandQueue.shift();
      
      if (command) {
        res.json(command);
        return;
      }

      // Long polling - wait up to configured timeout for new command
      const timeout = setTimeout(() => {
        this.queueEmitter.off('newCommand', commandHandler);
        res.status(423).json({ error: 'No commands available' }); // 423 LOCKED (matches Rust server)
      }, this.config.timeouts.pollTimeout);

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
    this.app.post(this.config.server.endpoints.response, (req, res) => {
      const { id, result, success, error }: StudioResponse = req.body;
      
      if (!id) {
        res.status(400).json({ error: 'Missing response ID' });
        return;
      }

      const channel = this.responseChannels.get(id);
      if (channel) {
        clearTimeout(channel.timeout);
        this.responseChannels.delete(id);
        
        if (success) {
          channel.resolve(result || '');
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
          
        case 'get_workspace_files':
          const filesResponse = await this.executeStudioCommand('GetWorkspaceFiles', args || {});
          return {
            content: [{
              type: 'text' as const,
              text: filesResponse
            }]
          };
          
        case 'get_file_content':
          const contentResponse = await this.executeStudioCommand('GetFileContent', args || {});
          return {
            content: [{
              type: 'text' as const,
              text: contentResponse
            }]
          };
          
        case 'update_file_content':
          const updateResponse = await this.executeStudioCommand('UpdateFileContent', args || {});
          return {
            content: [{
              type: 'text' as const,
              text: updateResponse
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
          
        case 'get_console_output':
          const consoleResponse = await this.executeStudioCommand('GetConsoleOutput', args || {});
          return {
            content: [{
              type: 'text' as const,
              text: consoleResponse
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
            name: 'get_workspace_files',
            description: 'List all scripts and modules in the workspace for file management',
            inputSchema: {
              type: 'object',
              properties: {
                filter_type: {
                  type: 'string',
                  enum: ['Script', 'LocalScript', 'ModuleScript', 'all'],
                  description: 'Filter by script type',
                  default: 'all'
                },
                include_disabled: {
                  type: 'boolean',
                  description: 'Include disabled scripts',
                  default: false
                },
                max_depth: {
                  type: 'number',
                  description: 'Maximum depth to scan',
                  default: 10
                },
                start_path: {
                  type: 'string',
                  description: 'Starting path for scan',
                  default: 'Workspace'
                }
              }
            }
          },
          {
            name: 'get_file_content',
            description: 'Read the source code content of a specific script or module',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Path to the script/module file'
                },
                include_metadata: {
                  type: 'boolean',
                  description: 'Include metadata like type and description',
                  default: true
                },
                line_numbers: {
                  type: 'boolean',
                  description: 'Include line numbers in output',
                  default: false
                }
              },
              required: ['file_path']
            }
          },
          {
            name: 'update_file_content',
            description: 'Edit or replace the content of a script or module with change tracking',
            inputSchema: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'Path to the script/module file to update'
                },
                new_content: {
                  type: 'string',
                  description: 'New source code content'
                },
                change_description: {
                  type: 'string',
                  description: 'Description of changes for undo history',
                  default: 'Update script content'
                },
                create_undo_point: {
                  type: 'boolean',
                  description: 'Create undo waypoint',
                  default: true
                },
                validate_syntax: {
                  type: 'boolean',
                  description: 'Validate Luau syntax before applying',
                  default: true
                }
              },
              required: ['file_path', 'new_content']
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
          },
          {
            name: 'get_console_output',
            description: 'Capture and filter console output from Roblox Studio for debugging',
            inputSchema: {
              type: 'object',
              properties: {
                context: {
                  type: 'string',
                  enum: ['server', 'client', 'both'],
                  description: 'Output context to capture',
                  default: 'both'
                },
                log_level: {
                  type: 'string',
                  enum: ['all', 'output', 'warning', 'error'],
                  description: 'Filter by log level',
                  default: 'all'
                },
                max_lines: {
                  type: 'number',
                  description: 'Maximum number of log entries to return',
                  default: 100,
                  minimum: 1,
                  maximum: 500
                },
                since_timestamp: {
                  type: 'number',
                  description: 'Only return logs after this timestamp'
                },
                filter_pattern: {
                  type: 'string',
                  description: 'Regex pattern to filter log messages'
                }
              }
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
        reject(new Error(`Studio command timeout (${this.config.timeouts.commandTimeout}ms)`));
      }, this.config.timeouts.commandTimeout);

      this.responseChannels.set(commandId, {
        resolve,
        reject,
        timeout
      });
    });
  }

  async start() {
    // Start HTTP server
    const httpServer = this.app.listen(this.config.server.port, () => {
      console.log(`Studio MCP HTTP server running on port ${this.config.server.port}`);
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