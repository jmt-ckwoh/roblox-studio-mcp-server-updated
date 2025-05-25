#!/usr/bin/env node

/**
 * Quick test script to verify TypeScript MCP Server functionality
 * Tests HTTP endpoints and basic communication flow
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:44755';

async function testServerEndpoints() {
  console.log('🧪 Testing TypeScript MCP Server HTTP endpoints...\n');

  // Test 1: Health check
  try {
    console.log('1. Testing health endpoint...');
    const response = await fetch(`${SERVER_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('💡 Make sure to start the server first: npm run studio-server');
    return;
  }

  // Test 2: Long polling request endpoint (should timeout)
  try {
    console.log('\n2. Testing request endpoint (should timeout after 15s)...');
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000); // 16s timeout
    
    try {
      const response = await fetch(`${SERVER_URL}/request`, {
        signal: controller.signal
      });
      const data = await response.json();
      console.log('Response:', data);
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.log('✅ Request endpoint timed out as expected');
      } else {
        throw fetchError;
      }
    } finally {
      clearTimeout(timeoutId);
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`   Elapsed time: ${(elapsed / 1000).toFixed(1)}s`);
    
  } catch (error) {
    console.log('❌ Request endpoint test failed:', error.message);
  }

  // Test 3: Response endpoint
  try {
    console.log('\n3. Testing response endpoint...');
    const testResponse = {
      id: 'test-id-123',
      response: 'Test response from test script',
      success: true
    };
    
    const response = await fetch(`${SERVER_URL}/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testResponse)
    });
    
    const data = await response.json();
    console.log('✅ Response endpoint:', data);
  } catch (error) {
    console.log('❌ Response endpoint test failed:', error.message);
  }

  console.log('\n🎉 HTTP endpoint tests complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Install Studio plugin: npm run build-plugin');
  console.log('2. Open Roblox Studio and look for "Toggle MCP" button');
  console.log('3. Configure Claude Desktop with the MCP server');
  console.log('4. Test end-to-end Claude -> Studio integration');
}

// Run tests
testServerEndpoints().catch(console.error);