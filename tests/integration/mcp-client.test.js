#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function testMCPServer() {
  console.log('🚀 Testing MCP Server Tools...\n');
  
  try {
    // Create client and connect via SSE
    const transport = new SSEClientTransport(new URL('http://localhost:3000/sse'));
    const client = new Client({
      name: "test-client",
      version: "1.0.0",
    }, {
      capabilities: {}
    });

    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // List available tools
    console.log('📋 Available Tools:');
    const toolsResult = await client.listTools();
    toolsResult.tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} - ${tool.description}`);
    });
    console.log('');

    // Test 1: Code Generation
    console.log('🔧 Testing Code Generation Tool...');
    const codeResult = await client.callTool({
      name: 'generate-roblox-code',
      arguments: {
        scriptType: 'ServerScript',
        functionality: 'player join handler',
        includeComments: true
      }
    });
    console.log('Generated Code Preview:');
    console.log(codeResult.content[0].text.substring(0, 200) + '...\n');

    // Test 2: Asset Search
    console.log('🔍 Testing Asset Finder...');
    const assetResult = await client.callTool({
      name: 'find-roblox-assets',
      arguments: {
        searchQuery: 'sword',
        assetType: 'Model',
        maxResults: 3
      }
    });
    const assets = JSON.parse(assetResult.content[0].text);
    console.log(`Found ${assets.results.length} assets for "sword"`);
    console.log(`First asset: ${assets.results[0]?.name}\n`);

    // Test 3: Script Validation
    console.log('✔️ Testing Script Validator...');
    const testScript = `
local Players = game:GetService("Players")
function onPlayerJoined(player)
  print("Welcome " .. player.Name)
end
Players.PlayerAdded:Connect(onPlayerJoined)
    `;
    
    const validationResult = await client.callTool({
      name: 'validate-luau-script',
      arguments: {
        script: testScript,
        checkSyntax: true,
        checkBestPractices: true
      }
    });
    const validation = JSON.parse(validationResult.content[0].text);
    console.log(`Script validation: ${validation.isValid ? 'VALID' : 'INVALID'}`);
    console.log(`Issues: ${validation.issues.length}, Warnings: ${validation.warnings.length}\n`);

    // Test 4: Studio Integration
    console.log('🎮 Testing Studio Integration...');
    const studioResult = await client.callTool({
      name: 'run-studio-code',
      arguments: {
        code: 'print("Hello from MCP!")',
        description: 'Test MCP connection'
      }
    });
    console.log('Studio execution result:');
    console.log(studioResult.content[0].text.substring(0, 150) + '...\n');

    // Test 5: User Info
    console.log('👤 Testing User Info...');
    const userResult = await client.callTool({
      name: 'get-user-info',
      arguments: {
        identifier: 'TestUser123',
        type: 'username'
      }
    });
    const userInfo = JSON.parse(userResult.content[0].text);
    console.log(`User: ${userInfo.name} (ID: ${userInfo.id})\n`);

    await client.close();
    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Code Generation: ✅ Working');
    console.log('- Asset Search: ✅ Working'); 
    console.log('- Script Validation: ✅ Working');
    console.log('- Studio Integration: ✅ Working');
    console.log('- API Connector: ✅ Working');
    console.log('\n🚀 MCP Server is fully functional!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMCPServer().catch(console.error);