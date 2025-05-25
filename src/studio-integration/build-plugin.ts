/**
 * Plugin build script - Builds Studio plugin using rojo and installs it
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Roblox Studio plugin directories by platform
const getStudioPluginDir = (): string => {
  const platform = os.platform();
  const homeDir = os.homedir();

  if (platform === 'win32') {
    return path.join(homeDir, 'AppData', 'Local', 'Roblox', 'Plugins');
  } else if (platform === 'darwin') {
    return path.join(homeDir, 'Documents', 'Roblox', 'Plugins');
  } else {
    throw new Error('Unsupported platform for Roblox Studio: ' + platform);
  }
};

const buildPlugin = async (): Promise<void> => {
  console.log('🔨 Building Studio MCP Plugin...');

  const pluginDir = path.join(__dirname, '..', '..', 'studio-plugin');
  const outputFile = path.join(pluginDir, 'MCPStudioPlugin.rbxm');

  // Check if rojo is available
  try {
    await new Promise<void>((resolve, reject) => {
      exec('rojo --version', (error, stdout) => {
        if (error) {
          reject(new Error('Rojo not found. Please install rojo: https://rojo.space/docs/installation/'));
        } else {
          console.log('✅ Rojo found:', stdout.trim());
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('❌', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Build plugin with rojo
  try {
    await new Promise<void>((resolve, reject) => {
      const rojoBuild = spawn('rojo', ['build', '--output', outputFile], {
        cwd: pluginDir,
        stdio: 'inherit'
      });

      rojoBuild.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Rojo build failed with code ${code}`));
        }
      });

      rojoBuild.on('error', (error) => {
        reject(error);
      });
    });

    console.log('✅ Plugin built successfully:', outputFile);
  } catch (error) {
    console.error('❌ Plugin build failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Install plugin to Studio
  try {
    const studioPluginDir = getStudioPluginDir();
    
    // Ensure Studio plugins directory exists
    await fs.mkdir(studioPluginDir, { recursive: true });
    
    const targetFile = path.join(studioPluginDir, 'MCPStudioPlugin.rbxm');
    
    // Copy plugin to Studio
    await fs.copyFile(outputFile, targetFile);
    
    console.log('✅ Plugin installed to Studio:', targetFile);
    console.log('');
    console.log('🎉 Setup complete! Next steps:');
    console.log('1. Start the TypeScript MCP Server: npm run studio-server');
    console.log('2. Open Roblox Studio');
    console.log('3. Look for "Toggle MCP" button in Plugins tab');
    console.log('4. Use Claude Desktop to control Roblox Studio!');
    
  } catch (error) {
    console.error('❌ Failed to install plugin to Studio:', error instanceof Error ? error.message : String(error));
    console.log('💡 You can manually copy the plugin file to your Studio plugins directory:');
    console.log('   From:', outputFile);
    console.log('   To:', path.join(getStudioPluginDir(), 'MCPStudioPlugin.rbxm'));
  }
};

// Export for programmatic use
export { buildPlugin };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildPlugin().catch(console.error);
}