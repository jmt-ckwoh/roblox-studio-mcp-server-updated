/**
 * Auto-generate plugin configuration from shared TypeScript config
 * This prevents hardcoded values in the plugin and ensures consistency
 */

import { writeFileSync } from 'fs';
import { DEFAULT_STUDIO_CONFIG, getServerUrl } from '../src/shared/studio-config.js';

function generatePluginConfig(): string {
  const config = DEFAULT_STUDIO_CONFIG;
  const serverUrl = getServerUrl(config);
  
  return `--[[
  Auto-generated configuration - DO NOT EDIT MANUALLY
  Generated from src/shared/studio-config.ts at build time
  
  To change configuration, modify src/shared/studio-config.ts
]]

local Config = {
    SERVER_URL = "${serverUrl}",
    REQUEST_ENDPOINT = "${config.server.endpoints.request}",
    RESPONSE_ENDPOINT = "${config.server.endpoints.response}",
    HEALTH_ENDPOINT = "${config.server.endpoints.health}",
    POLL_INTERVAL = ${config.timeouts.pollInterval / 1000}, -- Convert to seconds for Luau
    COMMAND_TIMEOUT = ${config.timeouts.commandTimeout / 1000} -- Convert to seconds for Luau
}

return Config`;
}

/**
 * Generate plugin configuration file
 */
export function buildPluginConfig(): void {
  try {
    const configContent = generatePluginConfig();
    writeFileSync('studio-plugin/src/Config.luau', configContent);
    console.log('✅ Generated studio-plugin/src/Config.luau');
  } catch (error) {
    console.error('❌ Failed to generate plugin config:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildPluginConfig();
}