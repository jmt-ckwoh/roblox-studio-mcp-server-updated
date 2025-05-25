/**
 * Minimal test for get_workspace tool
 */

async function testGetWorkspace() {
  console.log('Testing get_workspace tool...');
  
  try {
    const response = await fetch('http://localhost:3000/test-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tool: 'get_workspace', 
        args: { maxDepth: 2 } 
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('SUCCESS:', result);
    } else {
      console.log('FAILED:', response.status);
    }
  } catch (error) {
    console.log('ERROR:', error.message);
  }
}

testGetWorkspace();