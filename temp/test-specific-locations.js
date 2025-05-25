/**
 * Test file tools in specific script locations
 */

async function testFileTool(tool, args) {
    const response = await fetch('http://localhost:3000/test-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, args })
    });
    
    const result = await response.json();
    console.log(`\n🧪 Testing ${tool}:`);
    console.log('📤 Args:', JSON.stringify(args, null, 2));
    
    if (result.success) {
        console.log('✅ Success! Result:');
        try {
            const parsed = JSON.parse(result.result);
            console.log(JSON.stringify(parsed, null, 2));
        } catch {
            console.log(result.result);
        }
    } else {
        console.log('❌ Failed:', result.error || 'Unknown error');
    }
    
    return result;
}

async function runTests() {
    console.log('🔍 Testing Script Discovery in Specific Locations\n');
    
    // Test 1: Scan ServerScriptService
    console.log('📂 Scanning ServerScriptService...');
    await testFileTool('get_workspace_files', {
        start_path: 'ServerScriptService',
        filter_type: 'all',
        max_depth: 5
    });
    
    // Test 2: Scan StarterPlayer
    console.log('\n📂 Scanning StarterPlayer...');
    await testFileTool('get_workspace_files', {
        start_path: 'StarterPlayer',
        filter_type: 'all', 
        max_depth: 5
    });
    
    // Test 3: Try full game scan (might be slow)
    console.log('\n📂 Scanning entire game...');
    await testFileTool('get_workspace_files', {
        start_path: '',  // Should scan from game root
        filter_type: 'all',
        max_depth: 3
    });
    
    // Test 4: Try specific script path
    console.log('\n📄 Trying to read specific script...');
    await testFileTool('get_file_content', {
        file_path: 'ServerScriptService.betrayer',
        include_metadata: true
    });
    
    console.log('\n🏁 Location-specific tests complete!');
}

runTests().catch(console.error);