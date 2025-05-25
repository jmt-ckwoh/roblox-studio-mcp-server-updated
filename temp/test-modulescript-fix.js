/**
 * Test ModuleScript fix specifically
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
    console.log('🔧 Testing ModuleScript Fix\n');
    
    // Test 1: ServerScriptService with all types (should include ModuleScripts)
    console.log('📂 Testing ServerScriptService with ALL script types...');
    await testFileTool('get_workspace_files', {
        start_path: 'ServerScriptService',
        filter_type: 'all',  // This should include ModuleScripts
        max_depth: 3
    });
    
    // Test 2: Just ModuleScripts
    console.log('\n📂 Testing ServerScriptService with ONLY ModuleScripts...');
    await testFileTool('get_workspace_files', {
        start_path: 'ServerScriptService', 
        filter_type: 'ModuleScript',
        max_depth: 3
    });
    
    console.log('\n🏁 ModuleScript fix test complete!');
}

runTests().catch(console.error);