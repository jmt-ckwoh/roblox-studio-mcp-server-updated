/**
 * Shared Studio MCP Configuration
 * SINGLE SOURCE OF TRUTH for all configuration values
 * 
 * This prevents hardcoded values scattered across files
 * All servers and build scripts should import from here
 */

export interface StudioMCPConfig {
  readonly server: {
    readonly port: number;
    readonly host: string;
    readonly endpoints: {
      readonly request: string;
      readonly response: string;
      readonly health: string;
    };
  };
  readonly timeouts: {
    readonly commandTimeout: number;
    readonly pollTimeout: number;
    readonly pollInterval: number;
  };
}

export const DEFAULT_STUDIO_CONFIG: StudioMCPConfig = {
  server: {
    port: parseInt(process.env.STUDIO_MCP_PORT || '3000'),
    host: process.env.STUDIO_MCP_HOST || 'localhost',
    endpoints: {
      request: '/request',
      response: '/response',
      health: '/health'
    }
  },
  timeouts: {
    commandTimeout: 30000,  // 30 seconds
    pollTimeout: 15000,     // 15 seconds  
    pollInterval: 1000      // 1 second
  }
};

/**
 * Get the full server URL for plugin configuration
 */
export function getServerUrl(config: StudioMCPConfig = DEFAULT_STUDIO_CONFIG): string {
  return `http://${config.server.host}:${config.server.port}`;
}

/**
 * Validate configuration values
 */
export function validateConfig(config: StudioMCPConfig): void {
  if (config.server.port < 1 || config.server.port > 65535) {
    throw new Error(`Invalid port: ${config.server.port}`);
  }
  
  if (!config.server.host) {
    throw new Error('Host cannot be empty');
  }
  
  if (config.timeouts.commandTimeout < 1000) {
    throw new Error('Command timeout too short (min 1000ms)');
  }
}