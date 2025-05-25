/**
 * Test file editing functionality
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

async function runEditTest() {
    console.log('📝 Testing File Editing Functionality\n');
    
    const testScriptPath = 'StarterPlayer.StarterPlayerScripts.RoomSelectClient';
    
    // Step 1: Read original content
    console.log('📖 Step 1: Reading original file content...');
    const originalContent = await testFileTool('get_file_content', {
        file_path: testScriptPath,
        include_metadata: true
    });
    
    if (!originalContent.success) {
        console.log('❌ Cannot proceed - failed to read original file');
        return;
    }
    
    const originalData = JSON.parse(originalContent.result);
    const originalLineCount = originalData.line_count;
    const firstLine = originalData.source_code.split('\n')[0];
    
    console.log(`📊 Original file: ${originalLineCount} lines`);
    console.log(`📄 First line: "${firstLine}"`);
    
    // Step 2: Create test content (add a comment at the top)
    const testComment = '-- TEST EDIT: This comment was added by MCP file editing test';
    const newContent = testComment + '\n' + originalData.source_code;
    
    console.log('\n📝 Step 2: Updating file with test comment...');
    await testFileTool('update_file_content', {
        file_path: testScriptPath,
        new_content: newContent,
        change_description: 'MCP Test: Added test comment',
        create_undo_point: true,
        validate_syntax: true
    });
    
    // Step 3: Read modified content to verify
    console.log('\n📖 Step 3: Reading modified file to verify edit...');
    const modifiedContent = await testFileTool('get_file_content', {
        file_path: testScriptPath,
        include_metadata: true
    });
    
    if (modifiedContent.success) {
        const modifiedData = JSON.parse(modifiedContent.result);
        const newLineCount = modifiedData.line_count;
        const newFirstLine = modifiedData.source_code.split('\n')[0];
        
        console.log(`📊 Modified file: ${newLineCount} lines`);
        console.log(`📄 New first line: "${newFirstLine}"`);
        
        // Check if edit was successful
        if (newFirstLine === testComment && newLineCount === originalLineCount + 1) {
            console.log('\n🎉 EDIT TEST SUCCESSFUL!');
            console.log('✅ Comment was added correctly');
            console.log('✅ Line count increased by 1');
            console.log('✅ File editing is working properly');
            
            // Step 4: Restore original content
            console.log('\n🔄 Step 4: Restoring original content...');
            await testFileTool('update_file_content', {
                file_path: testScriptPath,
                new_content: originalData.source_code,
                change_description: 'MCP Test: Restored original content',
                create_undo_point: true,
                validate_syntax: true
            });
            
            console.log('✅ Original content restored');
            
        } else {
            console.log('\n❌ EDIT TEST FAILED!');
            console.log(`Expected first line: "${testComment}"`);
            console.log(`Actual first line: "${newFirstLine}"`);
            console.log(`Expected line count: ${originalLineCount + 1}`);
            console.log(`Actual line count: ${newLineCount}`);
        }
    } else {
        console.log('❌ Failed to read modified content');
    }
    
    console.log('\n🏁 File editing test complete!');
    console.log('💡 Check Studio to see if undo history was created properly');
}

runEditTest().catch(console.error);/**
 * Test file reading specifically
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
    console.log('📄 Testing File Reading with Known Script Paths\n');
    
    // Test 1: Try to read RoomSelectClient (we know it exists)
    await testFileTool('get_file_content', {
        file_path: 'StarterPlayer.StarterPlayerScripts.RoomSelectClient',
        include_metadata: true
    });
    
    // Test 2: Try shorter path
    await testFileTool('get_file_content', {
        file_path: 'RoomSelectClient',
        include_metadata: true
    });
    
    // Test 3: Try to scan ServerScriptService with lower depth to avoid deep ModuleScripts
    await testFileTool('get_workspace_files', {
        start_path: 'ServerScriptService',
        filter_type: 'Script',  // Only Scripts, not ModuleScripts
        max_depth: 2
    });
    
    console.log('\n🏁 File reading tests complete!');
}

runTests().catch(console.error);/**
 * Test script for new file management tools
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
    console.log('🚀 Testing File Management Tools\n');
    
    // Test 1: List workspace files
    await testFileTool('get_workspace_files', {
        filter_type: 'all',
        max_depth: 3
    });
    
    // Test 2: Try to get content of a common script (might not exist)
    await testFileTool('get_file_content', {
        file_path: 'Workspace.Script',
        include_metadata: true
    });
    
    // Test 3: Test with a script that definitely won't exist
    await testFileTool('get_file_content', {
        file_path: 'NonExistentScript'
    });
    
    console.log('\n🏁 File management tool tests complete!');
    console.log('Note: These tools require Roblox Studio to be running with the MCP plugin installed.');
}

runTests().catch(console.error);