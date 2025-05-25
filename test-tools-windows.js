/**
 * Windows test script for MCP tools
 * Run this from Windows while the server is running
 */

// Test function that works in Windows Node.js
async function testTool(tool, args) {
  console.log(`\n🔧 Testing ${tool}...`);
  
  try {
    const response = await fetch('http://localhost:3000/test-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, args })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ ${tool} result:`, result);
      return result;
    } else {
      console.log(`❌ ${tool} failed:`, response.status);
    }
  } catch (error) {
    console.log(`❌ ${tool} error:`, error.message);
  }
}

async function testConnectivity() {
  console.log('🔗 Testing server connectivity...');
  
  try {
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Server is healthy:', result);
      return true;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing MCP Tools from Windows');
  console.log('==================================');
  
  const connected = await testConnectivity();
  if (!connected) {
    console.log('💡 Make sure the server is running: npm run studio-server:test');
    return;
  }
  
  console.log('\n📝 Testing MCP Tools...');
  
  // Test each tool
  await testTool('get_workspace', { maxDepth: 3 });
  await testTool('run_code', { code: 'print("Hello from MCP!")' });
  await testTool('create_part', { name: 'TestPart', material: 'Neon', color: 'Bright red' });
  await testTool('insert_model', { query: 'car' });
  await testTool('manage_datastore', { operation: 'read', datastoreName: 'TestStore', key: 'testKey' });
  await testTool('create_gui', { componentType: 'ScreenGui', properties: { name: 'TestGUI' } });
  
  console.log('\n✨ All tests completed!');
  console.log('💡 Check Roblox Studio to see if any changes were made');
}

main().catch(console.error);