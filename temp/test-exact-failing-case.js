/**
 * Test the exact failing case from earlier
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
            console.log(`Found ${parsed.total_count} files`);
            if (parsed.files && parsed.files.length > 0) {
                console.log('First few files:');
                parsed.files.slice(0, 3).forEach(file => {
                    console.log(`  - ${file.type}: ${file.full_path}`);
                });
                if (parsed.files.length > 3) {
                    console.log(`  ... and ${parsed.files.length - 3} more`);
                }
            }
        } catch {
            console.log(result.result);
        }
    } else {
        console.log('❌ Failed:', result.error || 'Unknown error');
    }
    
    return result;
}

async function runTests() {
    console.log('🔍 Testing Exact Earlier Failing Cases\n');
    
    // This was the exact test that failed earlier
    console.log('📂 Testing entire game scan (the one that failed with ReplicatedStorage)...');
    await testFileTool('get_workspace_files', {
        start_path: '',  // Empty = scan from game root
        filter_type: 'all',
        max_depth: 3
    });
    
    console.log('\n🏁 Complete!');
}

runTests().catch(console.error);