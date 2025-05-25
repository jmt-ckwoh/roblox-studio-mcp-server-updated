# M1.4: Cursor/Codegen Integration for Roblox Development

## Vision & Objectives

Enable seamless integration between Cursor IDE and Roblox Studio for professional game development workflows. Focus on file management, code editing, and debugging visibility to support AI-assisted development.

## Core Requirements Analysis

### Primary Use Cases
1. **File Discovery**: Cursor needs to understand project structure and locate specific scripts
2. **Code Reading**: Cursor needs to read existing code to understand context and patterns
3. **Code Editing**: Cursor needs to modify scripts with proper change tracking
4. **Debug Visibility**: Cursor needs to see runtime behavior and test results
5. **Test Execution**: Cursor should ideally run tests and interpret results

### Technical Constraints
- Studio plugin architecture (HTTP polling, no direct file system access)
- Roblox security model (limited API access, no arbitrary file operations)
- Change history integration for undo/redo support
- Server/client execution context separation
- Console output capture limitations

## Implementation Strategy

### Phase 1: File Management Foundation (Priority: HIGH)

#### Tool 1: `get_workspace_files`
**Purpose**: Comprehensive file discovery and project structure analysis
**Implementation Details**:
- Recursively traverse entire workspace hierarchy
- Filter for script types: Script, LocalScript, ModuleScript
- Return structured data: path, type, parent hierarchy, last modified
- Include metadata: description, disabled state, className
- Support filtering by script type and location

**Input Schema**:
```json
{
  "filter_type": "Script|LocalScript|ModuleScript|all",
  "include_disabled": boolean,
  "max_depth": number,
  "start_path": "optional workspace path"
}
```

**Output Schema**:
```json
{
  "files": [
    {
      "name": "string",
      "full_path": "string",
      "type": "Script|LocalScript|ModuleScript", 
      "parent_path": "string",
      "is_disabled": boolean,
      "last_modified": "timestamp",
      "description": "string"
    }
  ],
  "total_count": number,
  "scan_time": "timestamp"
}
```

#### Tool 2: `get_file_content`
**Purpose**: Read script source code with metadata
**Implementation Details**:
- Locate script by exact path or fuzzy name matching
- Return source code with line numbers and metadata
- Include change history information if available
- Support both absolute and relative path resolution

**Input Schema**:
```json
{
  "file_path": "exact path or script name",
  "include_metadata": boolean,
  "line_numbers": boolean
}
```

**Output Schema**:
```json
{
  "file_path": "string",
  "source_code": "string",
  "line_count": number,
  "last_modified": "timestamp",
  "metadata": {
    "type": "Script|LocalScript|ModuleScript",
    "is_disabled": boolean,
    "description": "string"
  }
}
```

#### Tool 3: `update_file_content`
**Purpose**: Edit script content with change tracking
**Implementation Details**:
- Support full replacement and partial updates
- Integrate with Studio's change history system
- Validate script syntax before applying changes
- Return confirmation with change details

**Input Schema**:
```json
{
  "file_path": "string",
  "new_content": "string",
  "change_description": "string",
  "create_undo_point": boolean,
  "validate_syntax": boolean
}
```

**Output Schema**:
```json
{
  "success": boolean,
  "file_path": "string",
  "lines_changed": number,
  "change_id": "string",
  "validation_result": {
    "is_valid": boolean,
    "errors": ["string"]
  }
}
```

### Phase 2: Development Visibility Tools (Priority: HIGH)

#### Tool 4: `get_console_output`
**Purpose**: Capture runtime console logs for debugging
**Implementation Details**:
- Monitor both server and client console outputs
- Buffer recent messages (last 100-500 lines)
- Support filtering by log level and source
- Include timestamps and execution context

**Technical Approach**:
- Hook into LogService.MessageOut event
- Maintain circular buffers for server/client logs
- Distinguish between print(), warn(), error() outputs
- Capture script errors and stack traces

**Input Schema**:
```json
{
  "context": "server|client|both",
  "log_level": "all|info|warning|error",
  "max_lines": number,
  "since_timestamp": "optional",
  "filter_pattern": "optional regex"
}
```

**Output Schema**:
```json
{
  "server_logs": [
    {
      "timestamp": "string",
      "level": "info|warning|error",
      "message": "string",
      "source_script": "optional string"
    }
  ],
  "client_logs": ["same structure"],
  "total_server_lines": number,
  "total_client_lines": number,
  "capture_time": "timestamp"
}
```

### Phase 3: Test Execution Research (Priority: MEDIUM)

#### Research Task: Automated Test Execution
**Objective**: Determine feasibility of running tests from MCP server
**Investigation Areas**:
1. Popular Roblox testing frameworks (TestEZ, Jest-Lua, custom solutions)
2. Test discovery patterns in workspace
3. Test execution triggering mechanisms
4. Result collection and reporting methods
5. Integration with existing CI/CD workflows

**Potential Implementation**:
- Tool 5: `discover_tests` - Find test files and suites
- Tool 6: `run_tests` - Execute test suites and collect results
- Tool 7: `get_test_results` - Retrieve detailed test outcomes

### Phase 4: Bug Fixes & Integration (Priority: MEDIUM)

#### Fix Existing Tool Issues
1. **run_code tool**: Fix response format causing 500 errors
2. **manage_datastore tool**: Fix response format causing 500 errors

#### Cursor Integration Setup
1. Configure MCP server for Cursor (vs Claude Desktop)
2. Test end-to-end workflow with all new tools
3. Performance optimization for large codebases
4. Error handling and recovery mechanisms

## Implementation Timeline

### Week 1: File Management Foundation
- Day 1-2: Implement `get_workspace_files` with comprehensive scanning
- Day 3-4: Implement `get_file_content` with metadata support
- Day 5-7: Implement `update_file_content` with change history integration

### Week 2: Development Visibility
- Day 1-3: Implement console output capture system
- Day 4-5: Test and refine console monitoring
- Day 6-7: Research test execution frameworks and patterns

### Week 3: Integration & Polish
- Day 1-2: Fix existing tool response format issues
- Day 3-4: Configure and test Cursor integration
- Day 5-7: Performance testing and optimization

## Success Criteria

### Functional Requirements
- [ ] Cursor can discover all scripts in a Roblox project
- [ ] Cursor can read any script's source code
- [ ] Cursor can edit scripts with proper change tracking
- [ ] Cursor can monitor console output during development
- [ ] All tools respond within 2 seconds for typical operations
- [ ] Error handling provides clear feedback for common failures

### Technical Requirements
- [ ] All tools follow consistent input/output schemas
- [ ] Integration with Studio's undo/redo system
- [ ] Proper error handling and recovery
- [ ] Performance acceptable for projects with 100+ scripts
- [ ] Compatible with Cursor's MCP client implementation

### User Experience Requirements
- [ ] Intuitive tool naming and parameter structure
- [ ] Clear documentation with examples
- [ ] Responsive feedback for long-running operations
- [ ] Graceful degradation when Studio connection is lost

## Risk Assessment & Mitigation

### High Risk: Console Output Capture
**Risk**: Roblox may limit or restrict console monitoring capabilities
**Mitigation**: Research LogService API thoroughly, implement fallback mechanisms

### Medium Risk: File Update Performance
**Risk**: Large file updates may cause Studio lag or timeouts
**Mitigation**: Implement chunked updates, progress reporting, timeout handling

### Medium Risk: Cursor MCP Compatibility
**Risk**: Cursor's MCP implementation may differ from Claude Desktop
**Mitigation**: Test early with Cursor, maintain compatibility documentation

### Low Risk: Test Framework Integration
**Risk**: Popular test frameworks may not be compatible with plugin architecture
**Mitigation**: Focus on common patterns, provide extensible framework

## Dependencies & Prerequisites

### Technical Dependencies
- Existing MCP server infrastructure (HTTP polling, UUID correlation)
- Roblox Studio plugin development environment
- Rojo build system for plugin deployment
- TypeScript compilation and build pipeline

### Knowledge Dependencies
- Roblox Studio API documentation (LogService, ChangeHistoryService)
- Cursor MCP integration requirements
- Popular Roblox testing framework patterns
- Performance optimization techniques for Studio plugins

## Measurement & Monitoring

### Performance Metrics
- Tool response time (target: <2s for 95th percentile)
- File scanning performance (target: <5s for 100 scripts)
- Console capture latency (target: <100ms from log to capture)
- Memory usage in Studio (target: <50MB plugin overhead)

### Success Metrics
- Number of files successfully discovered and managed
- Console output capture accuracy and completeness
- Integration stability (uptime, error rates)
- Developer productivity improvement (qualitative feedback)

## Future Roadmap (Post-M1.4)

### Enhanced Development Tools
- Advanced debugging: breakpoints, variable inspection
- Performance profiling integration
- Asset management and optimization
- Collaboration tools for team development

### AI-Powered Features
- Intelligent code completion suggestions
- Automated refactoring recommendations  
- Pattern detection and best practice enforcement
- Automated test generation

### Production Features
- CI/CD pipeline integration
- Automated deployment to Roblox platform
- Performance monitoring and alerting
- Analytics and usage tracking