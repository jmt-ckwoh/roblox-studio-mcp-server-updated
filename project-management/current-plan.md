# M1.5: Development Visibility Tools - Comprehensive Implementation Plan

*Created: 2025-05-25 14:30*
*Mode: PLAN*
*Status: ACTIVE*

## Vision & Objectives

Complete the Cursor/AI development integration workflow by adding console output capture and fixing existing tool response format issues. This milestone transforms the MCP server from a file management system into a complete development environment integration.

## Success Definition

**PRIMARY GOAL**: Enable real-time debugging visibility for AI-assisted Roblox development
**SECONDARY GOAL**: Fix all existing tool response format issues for 100% tool reliability

### Success Criteria
- [ ] `get_console_output` captures live Studio print/warn/error messages
- [ ] Console filtering by log level and source context works
- [ ] `run_code` and `manage_datastore` return valid JSON responses (no 500 errors)
- [ ] All 9 Studio tools working reliably
- [ ] Sub-2 second response times maintained
- [ ] End-to-end Cursor development workflow functional

## Use Case Validation

### Primary Use Case: AI-Assisted Development Workflow
1. **Discovery**: AI uses `get_workspace_files` to understand project structure
2. **Analysis**: AI uses `get_file_content` to read existing code patterns  
3. **Modification**: AI uses `update_file_content` to make targeted changes
4. **Testing**: AI uses `run_code` to execute test code
5. **Debugging**: AI uses `get_console_output` to see execution results and errors
6. **Iteration**: AI refines code based on console feedback

### Scope Appropriateness
- **Target**: Personal development tools for Roblox Studio integration
- **Complexity**: Medium - console capture requires event handling, response fixes are simple
- **Security**: Basic input validation appropriate for personal use
- **Performance**: Sub-2s responses for individual developer workflow

## Technical Architecture Analysis

### Current State Assessment
- **✅ Working Infrastructure**: M1.4 file management tools, HTTP polling, Studio plugin
- **✅ JSON Response System**: HttpService:JSONEncode working for complex data structures
- **✅ Error Handling**: pcall patterns established, change history integration working
- **⚠️ Response Format Issues**: Two tools returning 500 errors due to format inconsistencies
- **❌ Console Capture**: No debugging visibility into Studio execution context

### M1.5 Architecture Requirements

#### Console Output Capture System
```
Studio LogService.MessageOut → Plugin Buffer → HTTP Response → Server Tool → MCP Client
```

**Technical Components**:
1. **Studio Plugin**: LogService event handlers with circular buffer
2. **HTTP Endpoint**: New tool endpoint for console data retrieval
3. **Server Tool**: MCP tool with filtering and formatting capabilities
4. **Buffer Management**: Configurable size, retention policies, performance optimization

#### Response Format Consistency
```
Existing Pattern: JSON-encoded responses for complex data
Problem Pattern: Non-JSON responses causing server 500 errors
Solution: Standardize all tool responses through consistent formatting
```

## Implementation Plan

### Phase 0: Response Format Analysis & Fixes (Priority: P0-CRITICAL)
*Target: 0.5 session | Complexity: Small*
*ACT MODE FEEDBACK: Fix existing broken tools BEFORE adding new functionality*

#### 0.1 Current Failure Investigation
**Objective**: Understand specific failure modes of broken tools
**Files to Examine**:
- `studio-plugin/src/Tools/RunCode.luau`
- `studio-plugin/src/Tools/ManageDatastore.luau`
- Server logs during tool execution
- HTTP response format analysis

**Investigation Steps**:
1. **Test Current Failures**: Execute both tools, capture exact error responses
2. **Response Format Analysis**: Compare broken tool responses vs working tool responses
3. **Error Source Identification**: Server-side 500 errors vs plugin-side response format issues
4. **Pattern Identification**: Are failures consistent with specific response types?

**Expected Findings**:
- Response format inconsistencies in plugin implementations
- Missing or malformed JSON encoding for complex responses
- Error handling that doesn't follow M1.4 HttpService:JSONEncode pattern

#### 0.2 Apply Proven M1.4 Response Pattern
**Implementation Pattern** (from M1.4 success):
```lua
-- Standard response format for ALL tools
local function createStandardResponse(success, result, errorMessage)
    local response = {
        success = success,
        result = success and result or nil,
        error = not success and errorMessage or nil,
        timestamp = tick()
    }
    
    -- CRITICAL: Use HttpService:JSONEncode for complex responses
    return typeof(response) == "table" and HttpService:JSONEncode(response) or tostring(response)
end
```

**Files to Fix**:
- `studio-plugin/src/Tools/RunCode.luau`
- `studio-plugin/src/Tools/ManageDatastore.luau`

#### 0.3 Response Format Validation
**Testing Protocol**:
- [ ] Execute fixed tools individually with success scenarios
- [ ] Execute fixed tools with error scenarios
- [ ] Verify server receives valid JSON (no 500 errors)
- [ ] Confirm existing working tools still function
- [ ] Test response format consistency across all tools

### Phase 1: Console Output Capture Implementation (Priority: P0)
*Target: 1 session | Complexity: Medium*

#### 1.1 Studio Plugin Console System
**Files to Modify**:
- `studio-plugin/src/Tools/GetConsoleOutput.luau` (NEW)
- `studio-plugin/src/Main.server.luau` (tool integration)

**Plugin Integration in Main.server.luau**:
```lua
-- ADD to existing tool handler chain (around line 30-40, after other tool handlers)
elseif toolName == "GetConsoleOutput" then
    local GetConsoleOutput = require(script.Tools.GetConsoleOutput)
    response = GetConsoleOutput(toolParams)
```

**Technical Approach**:
*ACT MODE FEEDBACK: Need actual LogService event signatures and implementation details*

```lua
-- GetConsoleOutput.luau - Complete Implementation
local HttpService = game:GetService("HttpService")
local LogService = game:GetService("LogService")
local RunService = game:GetService("RunService")

-- Circular buffer with configurable size
local ConsoleBuffer = {
    server_logs = {},
    max_size = 500,
    current_index = 1,
    total_count = 0
}

-- LogService.MessageOut event signature: (message: string, messageType: Enum.MessageType)
-- messageType values: Enum.MessageType.MessageOutput, MessageWarning, MessageError, MessageInfo
local function addLogEntry(message, messageType)
    local logEntry = {
        timestamp = tick(),
        message = tostring(message),
        level = messageType.Name:lower():gsub("message", ""), -- "messageoutput" -> "output", "messageerror" -> "error"
        source_script = debug.traceback():match("([^%.]+%.luau)") or "unknown"
    }
    
    -- Add to circular buffer with proper wraparound
    ConsoleBuffer.server_logs[ConsoleBuffer.current_index] = logEntry
    ConsoleBuffer.current_index = (ConsoleBuffer.current_index % ConsoleBuffer.max_size) + 1
    ConsoleBuffer.total_count = ConsoleBuffer.total_count + 1
end

-- Connect to LogService events
LogService.MessageOut:Connect(addLogEntry)

-- Tool implementation function
local function GetConsoleOutput(params)
    local success, result = pcall(function()
        local context = params.context or "both"
        local log_level = params.log_level or "all"
        local max_lines = math.min(params.max_lines or 100, ConsoleBuffer.max_size)
        local since_timestamp = params.since_timestamp
        local filter_pattern = params.filter_pattern
        
        -- Collect logs from circular buffer
        local collected_logs = {}
        local count = 0
        
        for i = 1, ConsoleBuffer.max_size do
            if count >= max_lines then break end
            
            local log = ConsoleBuffer.server_logs[i]
            if log then
                -- Apply filters
                local include = true
                
                -- Log level filter
                if log_level ~= "all" and log.level ~= log_level then
                    include = false
                end
                
                -- Timestamp filter  
                if include and since_timestamp and log.timestamp < since_timestamp then
                    include = false
                end
                
                -- Pattern filter (with error handling)
                if include and filter_pattern then
                    local pattern_success, pattern_match = pcall(string.match, log.message, filter_pattern)
                    if not pattern_success or not pattern_match then
                        include = false
                    end
                end
                
                if include then
                    table.insert(collected_logs, log)
                    count = count + 1
                end
            end
        end
        
        -- Sort by timestamp (newest first)
        table.sort(collected_logs, function(a, b) return a.timestamp > b.timestamp end)
        
        return {
            server_logs = collected_logs,
            client_logs = {}, -- TODO: Implement client-side logging if possible
            total_server_lines = ConsoleBuffer.total_count,
            total_client_lines = 0,
            capture_time = tick()
        }
    end)
    
    -- Use standard response format
    local response = {
        success = success,
        result = success and result or nil,
        error = not success and tostring(result) or nil,
        timestamp = tick()
    }
    
    return HttpService:JSONEncode(response)
end

return GetConsoleOutput
```

**Input Schema**:
```json
{
    "context": "server|client|both",
    "log_level": "all|info|warning|error",
    "max_lines": 100,
    "since_timestamp": "optional",
    "filter_pattern": "optional regex"
}
```

**Output Schema**:
```json
{
    "server_logs": [
        {
            "timestamp": "number",
            "level": "info|warning|error",
            "message": "string",
            "source_script": "optional string"
        }
    ],
    "client_logs": [],
    "total_server_lines": "number",
    "total_client_lines": "number",
    "capture_time": "number"
}
```

#### 1.2 Server Tool Implementation
*ACT MODE FEEDBACK: Need specific implementation locations and code blocks*

**Files to Modify**:
- `src/studio-integration/studio-mcp-server.ts` (new tool registration)
- `src/studio-integration/http-only-server.ts` (tool name mapping)

**Exact Implementation Location - studio-mcp-server.ts**:
```typescript
// ADD to existing tool registration section around line 45-50
// After get_file_content and update_file_content tools

server.tool(
    'get-console-output',
    'Capture and filter console output from Roblox Studio for debugging',
    {
        context: z.enum(['server', 'client', 'both']).optional().default('both'),
        log_level: z.enum(['all', 'info', 'warning', 'error']).optional().default('all'),
        max_lines: z.number().optional().default(100),
        since_timestamp: z.number().optional(),
        filter_pattern: z.string().optional()
    },
    async ({ context, log_level, max_lines, since_timestamp, filter_pattern }) => {
        try {
            const toolRequest = {
                tool: 'get_console_output',
                params: { context, log_level, max_lines, since_timestamp, filter_pattern },
                requestId: generateUUID()
            };
            
            const response = await makeToolRequest(toolRequest);
            
            if (!response.success) {
                throw new Error(response.error || 'Console output capture failed');
            }
            
            return { content: [{ type: "text", text: JSON.stringify(response.result, null, 2) }] };
        } catch (error) {
            return { content: [{ type: "text", text: `Error capturing console output: ${error.message}` }] };
        }
    }
);
```

**Exact Implementation Location - http-only-server.ts**:
```typescript
// ADD to toolNameMap object around line 15-20
const toolNameMap: Record<string, string> = {
    'get_workspace_files': 'GetWorkspaceFiles',
    'get_file_content': 'GetFileContent', 
    'update_file_content': 'UpdateFileContent',
    'get_console_output': 'GetConsoleOutput',  // ADD THIS LINE
    // existing mappings...
};
```

**HTTP Polling Endpoint Structure**:
- **URL**: `http://localhost:3000/studio-command`
- **Method**: POST
- **Body**: `{ tool: 'get_console_output', params: {...}, requestId: 'uuid' }`
- **Response**: `{ success: boolean, result: object, error?: string }`

#### 1.3 Validation & Testing
**Testing Approach**:
1. **Plugin Implementation**: Verify Luau syntax and LogService integration
2. **Buffer Management**: Test circular buffer with overflow scenarios
3. **Server Integration**: Verify tool registration and name mapping
4. **Studio Testing**: Install plugin, generate console output, capture results
5. **Live Validation**: Confirm real-time console capture during script execution

### Phase 2: Response Format Bug Fixes (Priority: P0)
*Target: 0.5 session | Complexity: Small*

#### 2.1 Identify Response Format Issues
**Known Problems**:
- `run_code` tool returning 500 errors
- `manage_datastore` tool returning 500 errors

**Root Cause Analysis**:
- Response format inconsistencies in plugin-server communication
- Potential issues with error handling or JSON encoding
- May be related to complex response structures not properly formatted

#### 2.2 Apply M1.4 JSON Response Pattern
**Solution Pattern** (from M1.4 success):
```lua
-- In plugin tool implementations
local success, result = pcall(function()
    -- Tool implementation
    return toolResult
end)

local response = {
    success = success,
    result = success and result or nil,
    error = not success and tostring(result) or nil
}

-- CRITICAL: Use HttpService:JSONEncode for complex responses
return typeof(response) == "table" and HttpService:JSONEncode(response) or tostring(response)
```

**Files to Fix**:
- `studio-plugin/src/Tools/RunCode.luau`
- `studio-plugin/src/Tools/ManageDatastore.luau`

#### 2.3 Response Format Validation
**Testing Protocol**:
1. **Individual Tool Testing**: Test each fixed tool independently
2. **Error Scenario Testing**: Verify error responses format correctly
3. **Integration Testing**: Confirm server receives valid JSON responses
4. **End-to-End Testing**: Verify tools work through full MCP stack

### Phase 3: Integration & Validation (Priority: P0)
*Target: 0.5 session | Complexity: Small*

#### 3.1 Full System Integration
**Components to Verify**:
- All 9 tools returning valid responses
- Console output capture working reliably
- Performance maintained under normal usage
- Error handling graceful for all failure scenarios

#### 3.2 End-to-End Workflow Validation
**Test Scenario**: Complete AI development workflow
1. Use `get_workspace_files` to discover project structure
2. Use `get_file_content` to read existing script
3. Use `update_file_content` to modify script with console output
4. Use `run_code` to execute test code that generates output
5. Use `get_console_output` to capture and analyze execution results
6. Verify all steps complete successfully with valid responses

## Configuration Verification Checklist
*ACT MODE FEEDBACK: Need specific expected results for each audit*

### Pre-Implementation Configuration Audit

#### Port Consistency Verification
```bash
grep -r "port\|Port\|PORT" . --exclude-dir=node_modules
```
**Expected Results**:
- `src/studio-integration/http-only-server.ts`: PORT = 3000
- `studio-plugin/src/Main.server.luau`: SERVER_URL = "http://localhost:3000"
- No references to other ports (44755, 8080, etc.)

#### Tool Name Consistency Verification  
```bash
grep -r "get_console_output\|GetConsoleOutput" . --exclude-dir=node_modules
```
**Expected Results AFTER implementation**:
- `src/studio-integration/studio-mcp-server.ts`: 'get-console-output' tool registration
- `src/studio-integration/http-only-server.ts`: 'get_console_output': 'GetConsoleOutput' mapping
- `studio-plugin/src/Tools/GetConsoleOutput.luau`: tool implementation
- `studio-plugin/src/Main.server.luau`: GetConsoleOutput tool handler

#### Response Format Consistency Verification
```bash
grep -r "HttpService:JSONEncode\|tostring(" studio-plugin/src/Tools/ 
```
**Expected Results**:
- All tools use HttpService:JSONEncode for table responses
- No tools use tostring() on table objects
- Consistent error response format across all tools

#### Build Output Verification
```bash
ls -la studio-plugin.rbxm && stat -c %Y studio-plugin.rbxm
```
**Expected Results**:
- Plugin file exists and timestamp is recent (within last 5 minutes of build)
- File size > 0 (not empty/corrupted build)

### Cross-Component Protocol Verification

#### Tool Registration Verification
- [ ] `get_console_output` tool exists in studio-mcp-server.ts tool list
- [ ] Tool schema matches plugin implementation parameters
- [ ] Tool uses same error handling pattern as working tools

#### Name Mapping Verification  
- [ ] toolNameMap includes 'get_console_output': 'GetConsoleOutput'
- [ ] Case conversion working for both directions (server→plugin, plugin→server)
- [ ] No orphaned tool names (server tools without plugin handlers)

#### JSON Response Format Verification
- [ ] All tools return { success: boolean, result?: any, error?: string }
- [ ] HttpService:JSONEncode used for complex responses
- [ ] Error responses follow same structure as success responses

## Risk Assessment & Mitigation

### HIGH RISK: LogService API Limitations
- **Risk**: LogService.MessageOut may not capture all output types or have access restrictions
- **Mitigation**: Research comprehensive LogService documentation, test all output types
- **Fallback**: Custom print/warn/error wrapper functions if needed
- **Detection**: Test with various output methods (print, warn, error, script errors)

### MEDIUM RISK: Buffer Memory Management
- **Risk**: Console buffer may consume excessive memory with high-volume logging
- **Mitigation**: Implement configurable buffer size, automatic cleanup, memory monitoring
- **Monitoring**: Track buffer size and plugin memory usage during testing
- **Fallback**: Reduce buffer size or implement streaming if memory issues occur

### LOW RISK: Response Format Regression
- **Risk**: Fixing response format might break other functionality
- **Mitigation**: Apply proven M1.4 pattern, test thoroughly before deployment
- **Validation**: Test all existing tools after applying fixes
- **Rollback**: Maintain backup of working implementations

## Performance Requirements

### Response Time Targets
- **get_console_output**: <1 second for 100 log entries
- **Fixed tools**: <2 seconds (maintain current performance)
- **Buffer operations**: <100ms overhead per log entry
- **Memory usage**: <10MB additional plugin memory for console buffer

### Scalability Considerations
- **Log Volume**: Handle up to 500 log entries efficiently
- **Filtering Performance**: Regex pattern matching should not impact Studio performance
- **Concurrent Access**: Multiple console reads should not conflict

## Security Considerations

### Input Validation (Personal Development Scope)
- **Console Filters**: Validate regex patterns to prevent ReDoS attacks
- **Buffer Size**: Limit maximum buffer size to prevent memory exhaustion
- **Log Content**: No sensitive data exposure through console capture
- **Access Control**: Console access through authenticated MCP session only

### Error Handling
- **Invalid Filters**: Graceful handling of malformed regex patterns
- **Buffer Overflow**: Safe handling when logs exceed buffer capacity
- **API Failures**: Proper error responses when LogService unavailable

## Documentation Requirements

### Tool Documentation Updates
- **get_console_output**: Complete usage examples with filtering scenarios
- **Fixed Tools**: Updated status from ⚠️ to ✅ in user guide
- **Workflow Examples**: End-to-end debugging workflow documentation
- **Troubleshooting**: Common console capture issues and solutions

### Technical Documentation
- **LogService Integration**: Document event handling patterns and limitations
- **Buffer Management**: Document memory usage and performance characteristics
- **Error Recovery**: Document failure modes and recovery procedures

## Dependencies & Prerequisites

### Technical Dependencies
- **M1.4 Infrastructure**: File management tools and HTTP polling system
- **Studio Plugin Framework**: Existing plugin structure and build system
- **LogService API**: Roblox Studio LogService.MessageOut event availability
- **JSON Encoding**: HttpService:JSONEncode for response formatting

### Knowledge Dependencies
- **LogService Documentation**: Complete understanding of available events and data
- **Buffer Management**: Circular buffer implementation best practices
- **Error Handling**: Studio plugin error handling and recovery patterns

## Comprehensive Test Matrix
*DEBUG MODE FEEDBACK: Need specific test scenarios and measurements*

### Phase 0 Validation: Response Format Fixes

#### Current Failure Analysis Tests
- [ ] **Execute run_code tool**: Capture exact HTTP status and response body
- [ ] **Execute manage_datastore tool**: Capture exact HTTP status and response body  
- [ ] **Compare working vs broken**: Analyze response differences with get_workspace_files
- [ ] **Server log analysis**: Check server-side error logs during tool execution

#### Response Format Fix Validation
- [ ] **Success scenario**: Execute fixed tools with valid inputs, verify JSON response
- [ ] **Error scenario**: Execute fixed tools with invalid inputs, verify error JSON format
- [ ] **Regression testing**: Verify all previously working tools still function correctly
- [ ] **Schema validation**: Confirm response structure matches { success, result?, error? }

### Phase 1 Validation: Console Output Capture

#### LogService Integration Tests
- [ ] **Basic capture**: Execute `print("test")` in Studio, verify capture in get_console_output
- [ ] **Error capture**: Execute `error("test error")` in Studio, verify error level capture
- [ ] **Warning capture**: Execute `warn("test warning")` in Studio, verify warning level capture
- [ ] **Script error capture**: Create syntax error script, verify compilation error capture
- [ ] **Multiple output types**: Mix print/warn/error calls, verify all captured correctly

#### Buffer Management Tests  
- [ ] **Normal volume**: Generate 50 log entries, verify all captured correctly
- [ ] **Buffer overflow**: Generate 600 log entries (>500 buffer), verify circular buffer behavior
- [ ] **Concurrent logging**: Generate logs while reading console output, verify no data loss
- [ ] **Memory usage**: Monitor Studio memory before/after buffer creation
- [ ] **Buffer persistence**: Restart Studio, verify buffer starts empty (no persistence)

#### Filtering Tests
- [ ] **Log level filtering**: Generate mixed logs, filter by 'error' only, verify results
- [ ] **Context filtering**: Test server vs client filtering (if client detection possible)
- [ ] **Timestamp filtering**: Generate logs, filter by time range, verify chronological accuracy
- [ ] **Regex filtering**: Generate logs with patterns, test regex filter functionality
- [ ] **Invalid regex handling**: Test malformed regex patterns, verify graceful error handling

#### Edge Case Tests
- [ ] **Empty buffer**: Call get_console_output on empty buffer, verify appropriate response
- [ ] **Large log messages**: Generate 1000+ character log entries, verify handling
- [ ] **High frequency logging**: Generate 100 logs/second for 10 seconds, test performance
- [ ] **Special characters**: Test logs with newlines, unicode, special characters
- [ ] **LogService unavailable**: Mock LogService failure, verify graceful degradation

### Performance Benchmark Tests

#### Baseline Measurements
- [ ] **Studio startup time**: Measure Studio startup without plugin
- [ ] **Studio memory usage**: Measure Studio memory without plugin  
- [ ] **Tool response time**: Measure existing tool response times

#### Console Capture Performance
- [ ] **Capture overhead**: Measure time difference with/without console capture active
- [ ] **Buffer memory usage**: Measure memory consumed by 500-entry buffer
- [ ] **Filtering performance**: Measure regex filtering time for 100-entry buffer
- [ ] **Response time**: Measure get_console_output response time for various buffer sizes

#### Large Project Performance  
- [ ] **Project with 10 scripts**: Test console capture performance
- [ ] **Project with 50 scripts**: Test console capture performance
- [ ] **Project with 100+ scripts**: Test console capture performance and memory usage
- [ ] **Concurrent tool usage**: Test console capture while using file management tools

### Integration & Workflow Tests

#### End-to-End Workflow Validation
1. **Discovery Phase**: Use get_workspace_files to find scripts
2. **Analysis Phase**: Use get_file_content to read script with console output
3. **Modification Phase**: Use update_file_content to add debug prints
4. **Execution Phase**: Use run_code to execute modified script  
5. **Debugging Phase**: Use get_console_output to capture execution output
6. **Verification**: Confirm debug output appears in console capture

#### Concurrent Access Tests
- [ ] **Multiple MCP clients**: Test multiple clients requesting console output simultaneously
- [ ] **Rapid requests**: Send get_console_output requests every 100ms for 10 seconds
- [ ] **Tool interleaving**: Alternate between console output and file management tools

#### Failure Recovery Tests
- [ ] **Studio restart**: Verify plugin reconnects and console capture resumes
- [ ] **Network interruption**: Test behavior during temporary server unavailability
- [ ] **Tool timeout**: Verify timeouts don't break subsequent tool usage
- [ ] **Invalid parameters**: Test all tools with invalid parameters, verify error handling

## Rollback & Recovery Plan
*DEBUG MODE FEEDBACK: Need rollback plan for performance issues*

### Rollback Triggers
- **Studio performance degradation**: >20% slowdown in normal operations
- **Memory issues**: Plugin consuming >50MB additional memory
- **Tool failures**: Any existing tool stops working after changes
- **Console capture failures**: LogService integration causes Studio crashes

### Rollback Procedure
1. **Immediate**: Disable console capture in plugin (comment out LogService handlers)
2. **Plugin rebuild**: Build plugin without GetConsoleOutput tool
3. **Server rollback**: Remove get_console_output tool registration
4. **Verification**: Confirm all existing tools still working
5. **Investigation**: Analyze logs to understand failure cause

### Recovery Strategy  
- **Incremental approach**: Re-enable console capture with reduced buffer size
- **Performance monitoring**: Add performance metrics to identify bottlenecks
- **Alternative implementation**: Consider polling-based console capture vs event-based
- **Graceful degradation**: Console capture optional, file management tools remain primary

## Success Metrics & Validation

### Functional Validation  
- [ ] Console output appears in real-time during script execution
- [ ] Filtering by log level works correctly (info, warning, error)
- [ ] Context filtering distinguishes server vs client output (if feasible)
- [ ] Timestamp filtering returns appropriate date ranges
- [ ] Regex pattern filtering matches expected results
- [ ] Buffer management handles overflow gracefully
- [ ] All 9 tools return valid JSON responses
- [ ] No 500 errors from any tool
- [ ] Error scenarios handled gracefully

### Performance Validation
- [ ] Console capture adds <100ms overhead per log entry
- [ ] get_console_output responds in <1 second for 100 entries
- [ ] Plugin memory usage stays under 10MB additional overhead
- [ ] No Studio performance degradation during normal logging
- [ ] Concurrent console reads don't conflict

### Integration Validation
- [ ] End-to-end AI development workflow completes successfully
- [ ] All MCP tools accessible through Cursor/Claude integration
- [ ] Console debugging enables effective AI code iteration
- [ ] Response format consistency across all tools
- [ ] Error recovery maintains system stability

## Post-Implementation Actions

### Documentation Updates
- Update `mcp_claude_user_guide.md` with console capture workflow
- Update tool count from 7/9 to 9/9 working tools
- Add debugging workflow examples and best practices

### Process Improvements
- Document console capture patterns for future tool development
- Update CLAUDE.md with LogService integration learnings
- Enhance testing protocols with console output validation

### Next Phase Preparation
- M2.1 readiness assessment (all core tools working)
- Cursor integration testing preparation
- Real API integration planning with working foundation

---

## Implementation Timeline & Sequencing
*ACT/DEBUG MODE FEEDBACK: Layered validation approach with clear go/no-go decisions*

### Phase 0: Response Format Analysis & Fixes (0.5 session)
**Pre-Implementation Baseline Measurements** (DEBUG MODE requirement):
- [ ] Studio startup time (3 runs, average)
- [ ] Studio memory usage after 5 minutes idle  
- [ ] Existing tool response times (get_workspace_files, get_file_content)

**Implementation Steps**:
1. **Investigation**: Test current failures, analyze response formats
2. **Fix Implementation**: Apply standard response pattern to broken tools
3. **Validation**: Regression testing of all existing tools

**Go/No-Go Decision Point**: All existing tools must return valid JSON responses

### Phase 1: Console Output Basic Implementation (1 session)
**Implementation Steps**:
1. **GetConsoleOutput.luau**: Create plugin tool with LogService integration
2. **Server Integration**: Add tool registration and name mapping
3. **Basic Testing**: Verify print/warn/error capture works

**5-Minute Smoke Test** (DEBUG MODE requirement):
- [ ] Execute print("test") in Studio, verify capture
- [ ] Execute warn("test") in Studio, verify capture  
- [ ] Execute error("test") in Studio, verify capture
- [ ] Verify no Studio performance degradation
- [ ] Verify memory usage reasonable

**Go/No-Go Decision Point**: Basic console capture functional with acceptable performance

### Phase 2: Comprehensive Validation (0.5 session)
**Only execute if Phase 1 smoke test passes**

**Comprehensive Test Matrix Execution**:
- [ ] Buffer management tests (overflow, wraparound)
- [ ] Filtering tests (log level, timestamp, regex)
- [ ] Performance benchmarks (response time, memory usage)
- [ ] Edge case handling (large messages, special characters)
- [ ] Integration workflow testing

**Rollback Testing**:
- [ ] Test rollback procedure by commenting out LogService handlers
- [ ] Verify plugin rebuild process restores baseline performance
- [ ] Confirm rollback procedure documentation accuracy

**Total Target**: 2 sessions with clear validation gates between phases

---

*Plan Complete: 2025-05-25 14:30*
*Status: Ready for Implementation*
*Next Action: Begin Phase 1 - Console Output Capture Implementation*