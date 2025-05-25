/**
 * Test file editing - ADD TEST COMMENT WITHOUT RESTORING
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

async function addTestComment() {
    console.log('📝 Adding test comment to RoomSelectClient (NO RESTORE)\n');
    
    const testScriptPath = 'StarterPlayer.StarterPlayerScripts.RoomSelectClient';
    
    // Step 1: Read original content
    console.log('📖 Reading current file content...');
    const currentContent = await testFileTool('get_file_content', {
        file_path: testScriptPath,
        include_metadata: true
    });
    
    if (!currentContent.success) {
        console.log('❌ Cannot proceed - failed to read file');
        return;
    }
    
    const currentData = JSON.parse(currentContent.result);
    const currentLineCount = currentData.line_count;
    
    console.log(`📊 Current file: ${currentLineCount} lines`);
    
    // Step 2: Add test comment at the top
    const testComment = '-- 🧪 MCP EDIT TEST: This comment was added by the MCP file editing system!';
    const newContent = testComment + '\n' + currentData.source_code;
    
    console.log('\n📝 Adding test comment to top of file...');
    const editResult = await testFileTool('update_file_content', {
        file_path: testScriptPath,
        new_content: newContent,
        change_description: 'MCP Demo: Added visible test comment for Studio verification',
        create_undo_point: true,
        validate_syntax: true
    });
    
    if (editResult.success) {
        console.log('\n🎉 TEST COMMENT ADDED SUCCESSFULLY!');
        console.log('📍 Check Studio: StarterPlayer > StarterPlayerScripts > RoomSelectClient');
        console.log('🔍 Look for the test comment at the very top of the file');
        console.log('📈 Line count should have increased by 1');
        console.log('↩️  You can undo this change in Studio with Ctrl+Z');
    } else {
        console.log('❌ Failed to add test comment');
    }
}

addTestComment().catch(console.error);