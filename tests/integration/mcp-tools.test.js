#!/usr/bin/env node

/**
 * Test script to verify MCP tools are working
 * This simulates what Claude Desktop would do
 */

import http from 'http';

const SERVER_URL = 'http://localhost:44755';
const REQUEST_ENDPOINT = '/request';
const RESPONSE_ENDPOINT = '/response';

// Test function to simulate Studio plugin command
async function testStudioCommand(tool, args = {}) {
  console.log(`\n🔧 Testing ${tool} tool...`);
  
  try {
    // First, poll for any pending commands (simulate Studio plugin polling)
    const pollResponse = await fetch(`${SERVER_URL}${REQUEST_ENDPOINT}`);
    
    if (pollResponse.ok) {
      const command = await pollResponse.json();
      console.log('✅ Server is responding to requests');
      
      if (command && command.tool) {
        console.log(`📝 Command received: ${JSON.stringify(command)}`);
        
        // Simulate successful response from Studio
        const response = {
          id: command.id,
          success: true,
          result: `Mock result for ${command.tool} tool with args: ${JSON.stringify(command.args)}`
        };
        
        // Send response back
        await fetch(`${SERVER_URL}${RESPONSE_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
        
        console.log('✅ Response sent back to server');
      } else {
        console.log('⏳ No pending commands');
      }
    } else {
      console.log('❌ Server not responding');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test basic connectivity
async function testConnectivity() {
  console.log('🔗 Testing MCP Server connectivity...');
  
  try {
    const response = await fetch(`${SERVER_URL}${REQUEST_ENDPOINT}`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('✅ MCP Server is reachable');
      return true;
    } else {
      console.log(`❌ Server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Cannot reach MCP Server: ${error.message}`);
    return false;
  }
}

// Main test
async function main() {
  console.log('🚀 MCP Tools Test Suite');
  console.log('========================');
  
  const connected = await testConnectivity();
  
  if (connected) {
    await testStudioCommand('get_workspace', { maxDepth: 3 });
    await testStudioCommand('run_code', { code: 'print("Hello from MCP!")' });
    await testStudioCommand('create_part', { name: 'TestPart', color: 'red' });
  }
  
  console.log('\n✨ Test complete');
}

main().catch(console.error);