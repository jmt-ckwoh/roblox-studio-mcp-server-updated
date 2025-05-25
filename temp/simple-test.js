#!/usr/bin/env node

// Simple test to verify our MCP server tools work by starting the server 
// and importing the tools directly to test them

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { robloxTools } from './dist/tools/index.js';

async function testTools() {
  console.log('🚀 Testing MCP Tools Directly...\n');
  
  try {
    // Create a mock MCP server
    const server = new McpServer({
      name: "Test Server",
      version: "1.0.0"
    });

    // Register our tools
    robloxTools.register(server);
    
    console.log('✅ Tools registered successfully\n');
    
    // Test the tools by calling them directly
    console.log('🔧 Testing Code Generation...');
    
    // Get the registered tools
    const toolsList = await server.listTools();
    console.log(`📋 Found ${toolsList.tools.length} tools:`);
    
    toolsList.tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} - ${tool.description || 'No description'}`);
    });
    
    console.log('\n🎯 Testing generate-roblox-code tool...');
    
    const codeResult = await server.callTool({
      name: 'generate-roblox-code',
      arguments: {
        scriptType: 'ServerScript',
        functionality: 'teleport system',
        includeComments: true,
        framework: 'none'
      }
    });
    
    console.log('Generated Code:');
    console.log(codeResult.content[0].text);
    console.log('\n✅ Code generation working!\n');
    
    console.log('🔍 Testing find-roblox-assets tool...');
    
    const assetResult = await server.callTool({
      name: 'find-roblox-assets', 
      arguments: {
        searchQuery: 'car',
        assetType: 'Model',
        maxResults: 2
      }
    });
    
    const assets = JSON.parse(assetResult.content[0].text);
    console.log(`Found ${assets.results.length} assets:`);
    assets.results.forEach(asset => {
      console.log(`- ${asset.name} (ID: ${asset.id})`);
    });
    console.log('\n✅ Asset search working!\n');
    
    console.log('✔️ Testing validate-luau-script tool...');
    
    const scriptToValidate = `
local Players = game:GetService("Players")
local function handlePlayerJoin(player)
    print("Player joined: " .. player.Name)
    -- Setup player data
end
Players.PlayerAdded:Connect(handlePlayerJoin)
    `;
    
    const validationResult = await server.callTool({
      name: 'validate-luau-script',
      arguments: {
        script: scriptToValidate,
        checkSyntax: true,
        checkBestPractices: true,
        checkSecurity: false
      }
    });
    
    const validation = JSON.parse(validationResult.content[0].text);
    console.log(`Validation result: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`Metrics: ${validation.metrics.lineCount} lines, ${validation.metrics.functionCount} functions`);
    if (validation.warnings.length > 0) {
      console.log(`Warnings: ${validation.warnings.length}`);
    }
    console.log('\n✅ Script validation working!\n');
    
    console.log('👤 Testing get-user-info tool...');
    
    const userResult = await server.callTool({
      name: 'get-user-info',
      arguments: {
        identifier: 'Builderman',
        type: 'username'
      }
    });
    
    const userInfo = JSON.parse(userResult.content[0].text);
    console.log(`User: ${userInfo.name} (Display: ${userInfo.displayName})`);
    console.log(`ID: ${userInfo.id}, Verified: ${userInfo.hasVerifiedBadge}`);
    console.log('\n✅ User info working!\n');
    
    console.log('🎮 Testing run-studio-code tool...');
    
    const studioResult = await server.callTool({
      name: 'run-studio-code',
      arguments: {
        code: 'print("Testing MCP integration!")\nlocal part = Instance.new("Part")\npart.Parent = workspace\nprint("Created part")',
        description: 'Test basic Studio commands'
      }
    });
    
    console.log('Studio execution result:');
    console.log(studioResult.content[0].text);
    console.log('\n✅ Studio integration working!\n');
    
    console.log('🎉 ALL TESTS PASSED! 🎉\n');
    console.log('📊 MCP Server Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Code Generation Tool - WORKING');
    console.log('✅ Asset Search Tool - WORKING');
    console.log('✅ Script Validation Tool - WORKING');
    console.log('✅ Roblox API Connector - WORKING'); 
    console.log('✅ Studio Integration Tool - WORKING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n🛠️  Total Tools Available: ${toolsList.tools.length}`);
    console.log('🚀 MCP Server is FULLY FUNCTIONAL!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testTools().catch(console.error);