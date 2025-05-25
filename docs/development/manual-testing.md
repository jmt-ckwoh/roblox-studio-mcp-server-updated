# M1.5 Manual Test Checklist

*Use this checklist to manually verify M1.5 improvements in Studio*

## Prerequisites
- ✅ Studio plugin loaded successfully (all 10 tools showing)
- ✅ Server connected (should see "Studio plugin is ready for Claude prompts!")
- ✅ MCP server running on port 3000

## Test 1: Response Format Fixes (CRITICAL)

### RunCode Tool Test
**Objective**: Verify RunCode returns structured JSON instead of 500 errors

**Test Case 1 - Success Scenario**:
1. Execute this code in Studio (via MCP tool):
```lua
print("Hello from MCP!")
local x = 5 + 3
print("Result:", x)
return x
```

**Expected Result**:
- Should return structured JSON response
- Should see success: true
- Should see result object with output and execution_time
- Should NOT get HTTP 500 error

**Test Case 2 - Error Scenario**:
1. Execute this code in Studio:
```lua
print("Testing error handling")
error("This is a test error")
```

**Expected Result**:
- Should return structured JSON response  
- Should see success: false
- Should see error message
- Should NOT get HTTP 500 error

### ManageDatastore Tool Test
**Objective**: Verify ManageDatastore returns structured JSON instead of 500 errors

**Test Case**: Read from non-existent key
1. Execute datastore read:
```json
{
  "operation": "read",
  "datastoreName": "TestStore", 
  "key": "nonExistentKey"
}
```

**Expected Result**:
- Should return structured JSON response
- Should see success: true (even if key doesn't exist)
- Should see result object with appropriate message
- Should NOT get HTTP 500 error

## Test 2: Console Output Capture (NEW FEATURE)

### Basic Console Capture Test
**Objective**: Verify new GetConsoleOutput tool works

**Setup**: First generate some console output by running this code:
```lua
print("Test message 1")
warn("Test warning 1") 
print("Test message 2")
```

**Test Case 1 - Basic Capture**:
1. Call get_console_output tool:
```json
{
  "context": "both",
  "log_level": "all",
  "max_lines": 50
}
```

**Expected Result**:
- Should return structured JSON response
- Should see success: true
- Should see result.server_logs array with recent messages
- Should see "Test message 1", "Test warning 1", "Test message 2" in logs

**Test Case 2 - Filter by Log Level**:
1. Call get_console_output with warning filter:
```json
{
  "context": "server", 
  "log_level": "warning",
  "max_lines": 20
}
```

**Expected Result**:
- Should only return warning-level messages
- Should see "Test warning 1" but not the print messages

**Test Case 3 - Pattern Filtering**:
1. Call get_console_output with pattern filter:
```json
{
  "context": "both",
  "log_level": "all", 
  "max_lines": 30,
  "filter_pattern": "MCP"
}
```

**Expected Result**:
- Should only return messages containing "MCP"
- Should see plugin startup messages with "MCP" in them

## Test 3: End-to-End Workflow Test

### Complete Development Workflow
**Objective**: Test the full AI development workflow

1. **Discovery**: Use get_workspace_files to see project structure
2. **Code Generation**: Use run_code to execute test code with console output
3. **Debugging**: Use get_console_output to capture execution results
4. **Iteration**: Modify code based on console feedback

**Test Scenario**:
1. Get workspace files:
```json
{
  "filter_type": "all",
  "max_depth": 3
}
```

2. Run code that generates output:
```lua
print("Starting calculation...")
local function fibonacci(n)
    print("Calculating fibonacci for n =", n)
    if n <= 1 then return n end
    return fibonacci(n-1) + fibonacci(n-2)
end

local result = fibonacci(5)
print("Fibonacci result:", result)
```

3. Capture the console output:
```json
{
  "context": "both",
  "log_level": "all",
  "max_lines": 20,
  "since_timestamp": 1640995200
}
```

**Expected Result**:
- All three tools should work seamlessly
- Console should capture the fibonacci calculation messages
- Should demonstrate real-time debugging capability

## Test 4: Performance & Reliability

### Response Time Test
**Objective**: Verify sub-2 second response times maintained

**Test**: Execute each tool and time the responses:
- RunCode: Should respond < 2 seconds
- ManageDatastore: Should respond < 2 seconds  
- GetConsoleOutput: Should respond < 1 second

### Memory Usage Test
**Objective**: Verify console buffer doesn't impact Studio performance

**Test**: 
1. Generate lots of console output (run a loop with prints)
2. Monitor Studio memory usage
3. Call get_console_output multiple times
4. Verify Studio remains responsive

## Success Criteria Checklist

### ✅ Original M1.5 Goals
- [ ] Console output captures live Studio print/warn/error messages
- [ ] Console filtering by log level and pattern works  
- [ ] RunCode returns valid responses (no 500 errors)
- [ ] ManageDatastore returns valid responses (no 500 errors)
- [ ] All 10 Studio tools working reliably
- [ ] Sub-2 second response times maintained
- [ ] End-to-end development workflow functional

### ✅ Architectural Improvements 
- [ ] No hardcoded configuration values causing issues
- [ ] Interface consistency maintained (no field mismatches)
- [ ] Runtime validation catching format errors
- [ ] Auto-generated config working correctly

## Troubleshooting

### If RunCode/ManageDatastore Still Return 500 Errors:
1. Check server logs for interface validation failures
2. Verify plugin rebuild included the response format fixes
3. Check for field name mismatches in server logs

### If Console Capture Not Working:
1. Verify GetConsoleOutput tool loaded in plugin
2. Check LogService.MessageOut event connection
3. Verify circular buffer implementation
4. Check for Luau syntax errors in GetConsoleOutput.luau

### If Configuration Issues:
1. Verify Config.luau exists in plugin
2. Check server and plugin using same port (3000)
3. Verify no hardcoded values causing conflicts

## Automated Test Option

Run the comprehensive automated test suite:
```bash
node test-m15-validation.js
```

This will execute all tests automatically and provide a detailed report.