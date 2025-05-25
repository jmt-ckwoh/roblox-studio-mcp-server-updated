/**
 * M1.5 Comprehensive Validation Tests
 * Tests response format fixes, console capture, and architectural improvements
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:3000';

// Test configuration
const tests = {
    responseFormatFixes: [
        {
            name: 'RunCode - Simple Print Test',
            tool: 'run_code',
            params: {
                command: `
print("Hello from MCP!")
local x = 5 + 3
print("Result:", x)
warn("This is a warning")
error("This is a test error")
                `.trim()
            },
            expectedSuccess: false, // error() will make it fail, but should return structured response
            description: 'Test RunCode returns structured JSON instead of 500 error'
        },
        {
            name: 'RunCode - Success Case',
            tool: 'run_code', 
            params: {
                command: `
print("Success test")
local result = 10 * 2
print("Calculation result:", result)
return result
                `.trim()
            },
            expectedSuccess: true,
            description: 'Test RunCode success case with return value'
        },
        {
            name: 'ManageDatastore - Read Test',
            tool: 'manage_datastore',
            params: {
                operation: 'read',
                datastoreName: 'TestStore',
                key: 'testKey'
            },
            expectedSuccess: true, // Should succeed even if key doesn't exist
            description: 'Test ManageDatastore returns structured JSON instead of 500 error'
        }
    ],
    
    consoleCapture: [
        {
            name: 'Console Output Capture - Basic Test',
            tool: 'get_console_output',
            params: {
                context: 'both',
                log_level: 'all',
                max_lines: 50
            },
            expectedSuccess: true,
            description: 'Test new console capture functionality'
        },
        {
            name: 'Console Output Capture - Filter by Level',
            tool: 'get_console_output',
            params: {
                context: 'server',
                log_level: 'warning',
                max_lines: 20
            },
            expectedSuccess: true,
            description: 'Test console filtering by log level'
        },
        {
            name: 'Console Output Capture - Pattern Filter',
            tool: 'get_console_output',
            params: {
                context: 'both',
                log_level: 'all',
                max_lines: 30,
                filter_pattern: 'MCP'
            },
            expectedSuccess: true,
            description: 'Test console regex pattern filtering'
        }
    ],
    
    architecturalValidation: [
        {
            name: 'Tool List Verification',
            tool: 'get_workspace_files',
            params: {
                filter_type: 'all',
                max_depth: 2
            },
            expectedSuccess: true,
            description: 'Verify existing tools still work with architectural changes'
        }
    ]
};

// Utility functions
async function makeToolRequest(toolName, params) {
    const url = `${BASE_URL}/test-tool`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tool: toolName,
                args: params
            })
        });
        
        const data = await response.text();
        
        return {
            httpStatus: response.status,
            httpOk: response.ok,
            rawResponse: data,
            parsedResponse: tryParseJSON(data)
        };
    } catch (error) {
        return {
            httpStatus: 0,
            httpOk: false,
            error: error.message,
            rawResponse: null,
            parsedResponse: null
        };
    }
}

function tryParseJSON(text) {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function generateUUID() {
    return 'test-' + Math.random().toString(36).substr(2, 9);
}

// Test execution functions
async function runTestSuite(suiteName, testList) {
    console.log(`\n🧪 ========== ${suiteName.toUpperCase()} ==========`);
    
    const results = [];
    
    for (const test of testList) {
        console.log(`\n🔍 Testing: ${test.name}`);
        console.log(`📝 Description: ${test.description}`);
        console.log(`🛠️  Tool: ${test.tool}`);
        console.log(`📋 Params:`, JSON.stringify(test.params, null, 2));
        
        const startTime = Date.now();
        const result = await makeToolRequest(test.tool, test.params);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Analyze result
        const analysis = analyzeTestResult(test, result, duration);
        results.push({ test, result, analysis });
        
        // Print immediate results
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`🌐 HTTP Status: ${result.httpStatus}`);
        console.log(`✅ HTTP OK: ${result.httpOk}`);
        
        if (result.parsedResponse) {
            console.log(`📊 Response Structure: ${getResponseStructure(result.parsedResponse)}`);
            if (result.parsedResponse.success !== undefined) {
                console.log(`🎯 Tool Success: ${result.parsedResponse.success}`);
            }
            if (result.parsedResponse.error) {
                console.log(`🚨 Tool Error: ${result.parsedResponse.error}`);
            }
        } else {
            console.log(`❌ Failed to parse JSON response`);
            console.log(`📄 Raw response: ${result.rawResponse?.substring(0, 200)}...`);
        }
        
        console.log(`🏆 Test Result: ${analysis.passed ? '✅ PASS' : '❌ FAIL'}`);
        if (!analysis.passed) {
            console.log(`💥 Failure Reason: ${analysis.reason}`);
        }
        
        // Wait between tests to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
}

function analyzeTestResult(test, result, duration) {
    const analysis = {
        passed: false,
        reason: '',
        metrics: {
            duration,
            httpStatus: result.httpStatus,
            hasJsonResponse: !!result.parsedResponse,
            hasStructuredResponse: false
        }
    };
    
    // Check basic HTTP success
    if (!result.httpOk) {
        analysis.reason = `HTTP ${result.httpStatus} error`;
        return analysis;
    }
    
    // Check JSON parsing
    if (!result.parsedResponse) {
        analysis.reason = 'Response is not valid JSON';
        return analysis;
    }
    
    // Check for structured response (M1.5 requirement)
    const response = result.parsedResponse;
    if (typeof response.success === 'boolean') {
        analysis.metrics.hasStructuredResponse = true;
        
        // For response format tests, we mainly care that we get structured responses
        if (test.tool === 'run_code' || test.tool === 'manage_datastore') {
            analysis.passed = true;
            analysis.reason = 'Structured response received (M1.5 fix working)';
        }
        // For console capture, check that we get expected data structure
        else if (test.tool === 'get_console_output') {
            // Handle nested result structure from plugin response
            const consoleData = response.result?.result || response.result;
            if (response.success && consoleData && Array.isArray(consoleData.server_logs)) {
                analysis.passed = true;
                analysis.reason = 'Console capture working with expected data structure';
            } else {
                analysis.reason = 'Console capture response missing expected structure';
            }
        }
        // For other tools, just check success
        else {
            analysis.passed = response.success;
            analysis.reason = response.success ? 'Tool executed successfully' : `Tool failed: ${response.error}`;
        }
    } else {
        analysis.reason = 'Response missing required success field';
    }
    
    return analysis;
}

function getResponseStructure(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return typeof obj;
    }
    
    const keys = Object.keys(obj);
    return `{ ${keys.join(', ')} }`;
}

// Main test execution
async function runAllTests() {
    console.log('🚀 M1.5 Comprehensive Validation Test Suite');
    console.log('==========================================');
    console.log(`🌐 Testing server at: ${BASE_URL}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    // Check server health first
    console.log('\n🏥 Checking server health...');
    try {
        const healthResponse = await fetch(`${BASE_URL}/health`);
        if (healthResponse.ok) {
            console.log('✅ Server is healthy');
        } else {
            console.log('❌ Server health check failed');
            return;
        }
    } catch (error) {
        console.log('❌ Cannot reach server:', error.message);
        return;
    }
    
    const allResults = {};
    
    // Run test suites in sequence
    allResults.responseFormatFixes = await runTestSuite('Response Format Fixes (M1.5 Critical)', tests.responseFormatFixes);
    allResults.consoleCapture = await runTestSuite('Console Output Capture (M1.5 New Feature)', tests.consoleCapture);
    allResults.architecturalValidation = await runTestSuite('Architectural Validation', tests.architecturalValidation);
    
    // Generate summary report
    generateSummaryReport(allResults);
}

function generateSummaryReport(allResults) {
    console.log('\n📊 ========== SUMMARY REPORT ==========');
    
    let totalTests = 0;
    let totalPassed = 0;
    let criticalIssues = [];
    
    for (const [suiteName, results] of Object.entries(allResults)) {
        console.log(`\n📋 ${suiteName}:`);
        
        const suiteTotal = results.length;
        const suitePassed = results.filter(r => r.analysis.passed).length;
        
        console.log(`   ✅ Passed: ${suitePassed}/${suiteTotal}`);
        
        // Show failed tests
        const failed = results.filter(r => !r.analysis.passed);
        if (failed.length > 0) {
            console.log(`   ❌ Failed tests:`);
            for (const failure of failed) {
                console.log(`      - ${failure.test.name}: ${failure.analysis.reason}`);
                
                // Track critical issues
                if (failure.test.tool === 'run_code' || failure.test.tool === 'manage_datastore') {
                    criticalIssues.push(`${failure.test.name}: ${failure.analysis.reason}`);
                }
            }
        }
        
        totalTests += suiteTotal;
        totalPassed += suitePassed;
    }
    
    console.log(`\n🎯 OVERALL RESULTS:`);
    console.log(`   📊 Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalTests - totalPassed}`);
    console.log(`   📈 Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);
    
    if (criticalIssues.length > 0) {
        console.log(`\n🚨 CRITICAL ISSUES (M1.5 Core Features):`);
        for (const issue of criticalIssues) {
            console.log(`   💥 ${issue}`);
        }
    }
    
    // M1.5 specific validation
    console.log(`\n🏗️  M1.5 ARCHITECTURAL VALIDATION:`);
    console.log(`   🔧 Response Format Fixes: ${allResults.responseFormatFixes.every(r => r.analysis.metrics.hasStructuredResponse) ? '✅ WORKING' : '❌ BROKEN'}`);
    console.log(`   📺 Console Capture: ${allResults.consoleCapture.some(r => r.analysis.passed) ? '✅ WORKING' : '❌ BROKEN'}`);
    console.log(`   🏛️  Architectural Changes: ${totalPassed > totalTests * 0.8 ? '✅ STABLE' : '⚠️ UNSTABLE'}`);
    
    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
    console.log('==========================================');
}

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// ES module exports
export { runAllTests, makeToolRequest };

// Run the tests if this is the main module
if (process.argv[1] === __filename) {
    runAllTests().catch(console.error);
}