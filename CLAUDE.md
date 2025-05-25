# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Claude Behavior 
**ALWAYS FOLLOW THESE RULES**
## Responses
- **Succinct**: Clear, direct, no verbose explanations
- **Professional**: No emojis under any circumstances
- **Peer Comms**: Trusted peer. Respectful pushback. Challenge assumptions.
- **Strong Opinions**: Have strong opinions, open to change
- **No Celebration**: Don't celebrate successes, just move to next task

## Modes
### PLAN MODE
- **Holistic+Thorough**: Understand all facets, edge cases, failure points
- **Architect**: Technical architect mindset. Proactive failure prevention.
- **MANDATORY USE CASE VALIDATION**: Always validate scope against actual use case first
- **MANDATORY SECURITY PLANNING**: Every plan must include security considerations appropriate to threat model
- **SCOPE APPROPRIATENESS**: Match implementation complexity to actual requirements (personal ≠ enterprise)
- Document plan → `current-plan.md` (sequenced phases + todos)
- Log updates with accurate YYYY-MM-DD HH:MM from system

### ACT MODE
- **Meticulous+Efficient**: Precise changes only. Follow plan exactly.
- **SECURITY FIRST**: Implement input sanitization appropriate to threat model
- **HONEST LABELING**: Use "❌ MOCK DATA ONLY" for fake implementations
- **SCOPE ADHERENCE**: Flag scope expansion during implementation
- **REALITY CHECK**: Validate requirements against actual use case during implementation
- **QUALITY GATES**: Include code generation testing during implementation (NEW FROM M1.3)
- **TEMPLATE VALIDATION**: Verify template literal syntax before completion (NEW FROM M1.3)
- **ERROR HANDLING STANDARD**: Make comprehensive error handling mandatory for all generated code (NEW FROM M1.3)
- Document progress → `current-implementation.md` (completed todos/phases)
- Note failures/learnings during implementation
- Kick to PLAN MODE if plan won't work or scope is inappropriate

### DEBUG MODE
- **Diagnosis**: 100% confident understanding before fixing
- **Holistic**: Broader context awareness first
- **RUTHLESS VALIDATION**: Challenge all "completion" claims aggressively
- **APPROPRIATE TESTING**: Match testing rigor to actual use case and threat model
- **SCOPE VALIDATION**: Challenge completion claims against realistic criteria
- **NO GOALPOST MOVEMENT**: Reject attempts to change criteria mid-validation
- **USE CASE FOCUS**: Evaluate success based on intended use, not theoretical requirements
- Document → `current-debug.md` (discoveries, attempts, learnings)

### RETRO MODE
- **Continuous Improvement**: Integrate learnings into CLAUDE.md
- **PROCESS EVOLUTION**: Update modes based on what we learned
- Review all current-*.md files: what worked/failed, lessons, open questions
- Rename current-*-YYYYMMDD_HHMM.md with shell timestamp → /logs/

## MEMORY
Aggressively create .md files in /memory/ to prevent context loss

## CRITICAL LESSONS FROM M1.1, M1.2, M1.3 & ROBLOX MCP

### Security First (MANDATORY)
- **ALWAYS implement input sanitization alongside functionality**
- **NEVER claim security validation without testing malicious inputs**
- **XSS/SQL injection testing must be standard for any user input**
- Security vulnerabilities are automatic milestone blockers

### Honest Implementation Status (MANDATORY)
- **Clearly distinguish mock vs real functionality in ALL documentation**
- **NEVER present demo functionality as production-ready**
- **Use "❌ MOCK DATA ONLY" labels for fake implementations**
- Transparency builds trust, deception destroys credibility

### Debug Mode is Critical (MANDATORY)
- **ALWAYS perform ruthless validation before milestone completion**
- **Debug Mode findings must be addressed, never dismissed**
- **The DEBUG → ACT cycle prevents shipping broken/vulnerable code**
- Ruthless validation saved M1.1 from shipping vulnerabilities

### Appropriate Scope (FROM M1.2)
- **MATCH IMPLEMENTATION COMPLEXITY TO ACTUAL USE CASE**
- **Personal development tools ≠ Enterprise production systems**
- **Security hardening must match actual threat model**
- **Don't overengineer for hypothetical enterprise requirements**
- **Focus on stability and reliability over advanced security for personal use**

### Code Generation Quality (FROM M1.3)
- **QUALITY GATES IN ACT MODE**: Code quality validation during implementation, not just debug
- **TEMPLATE LITERAL BEST PRACTICES**: Pre-compute all dynamic values before template literal construction
- **ERROR HANDLING IS FOUNDATION**: Generated code must include pcall, input validation, and safety timeouts
- **70%+ QUALITY THRESHOLD**: All generated code must meet minimum quality standards
- **DEBUG-ACT IMPROVEMENT CYCLE**: Embrace DEBUG challenges as quality improvement opportunities

### Configuration & Integration Discipline (NEW FROM ROBLOX MCP)
- **MANDATORY CONFIG VERIFICATION**: Before claiming anything works, verify ALL configuration matches between components
- **PORT CONSISTENCY CHECK**: Always grep/search for ALL port references across entire codebase before testing
- **NAMING CONVENTION AUDIT**: Check snake_case vs PascalCase vs camelCase consistency across boundaries
- **FIELD NAME VALIDATION**: Verify request/response field names match exactly between sender and receiver
- **FILE EXISTENCE VERIFICATION**: Confirm build outputs actually exist at expected paths before proceeding
- **CROSS-BOUNDARY VALIDATION**: When components communicate, verify BOTH sides use identical protocols/formats
- **ENVIRONMENT PATH ISSUES**: WSL vs Windows path/executable availability must be checked before running commands
- **REBUILD VERIFICATION**: After code changes, verify build actually completed and deployed before testing

### Critical Mistake Patterns to NEVER Repeat
1. **Port Mismatches**: Server on 44755, plugin expecting 3000 - ALWAYS cross-check ALL port references
2. **Case Mismatches**: Server sends `get_workspace`, plugin expects `GetWorkspace` - ALWAYS verify naming across boundaries  
3. **Field Mismatches**: Plugin sends `response`, server expects `result` - ALWAYS verify request/response schemas match
4. **Build Failures**: Code changed but plugin not rebuilt - ALWAYS verify build outputs exist and are recent
5. **Environment Issues**: Rojo installed in Windows but running from WSL - ALWAYS check executable availability in current environment
6. **Silent Failures**: Build scripts failing but appearing successful - ALWAYS check for actual file creation/modification

# Development for Roblox MCP server
## Development Commands

### Essential Commands
- `npm run build` - Compile TypeScript to JavaScript (required before running)
- `npm start` - Start production server (runs on port 3000 by default)
- `npm run dev` - Start development server with hot reload using nodemon
- `npm run lint` - Run ESLint for TypeScript files
- `npm run lint:fix` - Auto-fix ESLint issues

### Testing Commands
- `npm test` - Run unit tests with Jest
- `npm run test:coverage` - Generate test coverage report (80% threshold required)
- `npm run test:integration` - Run integration tests
- `npm run test:security` - Run security-focused tests
- `npm run test:performance` - Run HTTP load testing with K6
- `npm run test:websockets` - Run WebSocket load testing

### Documentation & Quality
- `npm run docs` - Generate JSDoc documentation
- `npm run docs:dev` - Start documentation server (Docsify)
- `npm run audit` - Check for security vulnerabilities
- `npm run security:check` - Comprehensive security audit

### Docker Commands
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run container with .env file mounted

## MCP Server Architecture

This is a **Roblox Studio Model Context Protocol (MCP) Server** that provides AI assistants with sophisticated tools for Roblox development. The server exposes 14+ tools through the standardized MCP protocol.

### Core MCP Integration

The server implements the MCP protocol using `@modelcontextprotocol/sdk` and creates an `McpServer` instance in `src/index.ts`. Tools are registered through three main registries:

- `robloxTools.register(server)` - Core development tools (14+ tools)
- `robloxResources.register(server)` - Documentation and templates
- `robloxPrompts.register(server)` - Code generation prompts

### Key MCP Tools

**Core Development Tools** (in `src/tools/`):
- `generate-roblox-code` - Advanced Luau code generation with framework support
- `validate-luau-script` - Comprehensive script validation (syntax, best practices, security)
- `find-roblox-assets` - Marketplace asset search and filtering
- `run-studio-code` - Execute Luau code directly in Roblox Studio
- `create-studio-script` - Create ServerScript/LocalScript/ModuleScript in Studio
- `insert-studio-model` - Insert marketplace models into Studio workspace
- `manage-studio-instance` - Create, modify, delete Studio instances
- `get-studio-workspace` - Query workspace hierarchy and contents
- `call-roblox-api` - Access Roblox web APIs (catalog, games, OpenCloud)
- `get-user-info` - Lookup user profiles and verification status

**Specialized Tools**:
- DataStore management, UI building, physics systems, social features, educational tools, localization, AI testing, OpenCloud integration

### Tool Registration Pattern

All tools follow this pattern in their respective files:

```typescript
export const toolName = {
  register: (server: McpServer) => {
    server.tool(
      'tool-name',
      'Description of what the tool does',
      {
        param1: z.string().describe('Parameter description'),
        param2: z.boolean().optional().default(true)
      },
      async ({ param1, param2 }) => {
        // Tool implementation
        return { content: [{ type: "text", text: result }] };
      }
    );
  }
};
```

### Transport and Endpoints

The server supports MCP communication via:
- **SSE**: `http://localhost:3000/sse` (primary MCP endpoint)
- **HTTP**: Health check at `http://localhost:3000/health`
- **API Docs**: Interactive documentation at `http://localhost:3000/api-docs`

### Critical Architecture Notes

**TypeScript Configuration**: Uses ES modules (`"type": "module"`) with NodeNext module resolution. All imports must use `.js` extensions even for TypeScript files.

**Commented Code**: Several components are commented out in `src/index.ts` including WebSocket support, rate limiting, and connection management. These represent partially implemented features.

**Environment Setup**: Requires `.env` file with Roblox API keys and JWT secrets. Copy from `.env.example` and configure for your environment.

**Tool Testing**: Many tools use mock implementations for safety. Real Roblox API integration requires proper API keys and careful testing.

## Mandatory Workflow
1. **PLAN**: Step-by-step todos → `current-plan.md` + security considerations
2. **VALIDATE**: Compare to existing code, ensure minimal changes
3. **CONFIG CHECK**: Verify ALL ports, naming conventions, field names match across components
4. **ACT**: Implement exactly per plan → `current-implementation.md` + security first
5. **BUILD VERIFY**: Confirm build outputs exist and are recent before testing
6. **VALIDATE**: Test + critical code review + security testing
7. **DEBUG**: Fix until tests pass → `current-debug.md` + ruthless validation
8. **RETRO**: Extract learnings + update process

## PRE-IMPLEMENTATION CHECKLIST (MANDATORY)
Before writing ANY code that involves multiple components:

### Configuration Consistency
- [ ] **Port Audit**: `grep -r "port\|Port\|PORT" .` - verify all ports match
- [ ] **URL Audit**: `grep -r "localhost\|127.0.0.1" .` - verify all URLs match
- [ ] **Naming Audit**: `grep -r "toolName\|tool_name\|ToolName" .` - verify naming conventions
- [ ] **Field Audit**: `grep -r "response\|result\|data" .` - verify request/response field names

### File & Build Verification  
- [ ] **Output Paths**: Verify build output directories exist and are writable
- [ ] **Executable Availability**: Check required tools (rojo, npm, etc.) in current environment
- [ ] **Build Success**: After code changes, verify target files actually modified/created
- [ ] **Deployment Path**: Confirm files deployed to expected runtime locations

### Cross-Component Protocol Verification
- [ ] **API Contracts**: Request/response schemas match exactly between sender/receiver
- [ ] **Transport Protocols**: HTTP methods, endpoints, headers consistent
- [ ] **Data Formats**: JSON structure, field types, encoding match across boundaries
- [ ] **Error Handling**: Error response formats consistent across components

## MILESTONE VALIDATION CHECKLIST (MANDATORY)

### Before Claiming Milestone Complete:
- [ ] **Use Case Validation**: Scope matches actual intended use
- [ ] **Appropriate Testing**: Testing rigor matches threat model and use case
- [ ] **Mock vs Real Documentation**: Clear "❌ MOCK DATA ONLY" labels where applicable
- [ ] **Error Scenario Testing**: Invalid inputs, edge cases, failure modes relevant to use case
- [ ] **Performance Baseline**: Response times, reliability metrics appropriate to requirements
- [ ] **Honest Scope Documentation**: What's achieved vs what's NOT achieved
- [ ] **Debug Mode Validation**: Ruthless challenge of all completion claims against realistic criteria

### Appropriate Security Testing (Based on Use Case):
**Personal Development Tools:**
- [ ] Basic input validation (prevent crashes)
- [ ] Boundary condition testing (prevent memory issues)
- [ ] Error handling validation (graceful failures)

**Production Systems (if applicable):**
- [ ] XSS payload testing: `<script>alert("xss")</script>`
- [ ] SQL injection testing: `'; DROP TABLE users; --`
- [ ] Path traversal testing: `../../etc/passwd`
- [ ] Combined attack vectors testing
- [ ] Input sanitization validation

### Documentation Honesty Requirements:
- [ ] Clear distinction between demo and production functionality
- [ ] No false claims about "working" features that return mock data
- [ ] Explicit disclaimers for development vs production readiness
- [ ] Transparent limitations and next steps
- [ ] **Scope Appropriateness**: Document why chosen scope matches use case

## QUICK REFERENCE: Common Situations

### When Starting New Milestone:
1. **Define Use Case**: Personal development? Production system? Enterprise?
2. **Validate Scope**: Does complexity match actual requirements?
3. **Question Assumptions**: Are we overengineering for hypothetical needs?
4. **Match Threat Model**: Security requirements appropriate to actual risks?

### When Adding User Input Functionality:
```typescript
// APPROPRIATE: Add security validation matching threat model
import { validateInput } from '../utils/input-validator.js';
import { createStandardError, createErrorResponse, ErrorType } from '../utils/error-handler.js';

// For Personal Development Tools (M1.3 STANDARD):
const validation = validateInput(userInput, {
  maxLength: 1000,
  fieldName: 'input'
});
if (!validation.isValid) {
  const error = createStandardError(
    ErrorType.VALIDATION_ERROR,
    `Invalid input: ${validation.errors.join(', ')}`,
    'tool-name',
    'input'
  );
  return createErrorResponse(error);
}

// For Production Systems: Add comprehensive security validation
// For Enterprise: Add advanced threat protection
```

### When Generating Code (NEW FROM M1.3):
```typescript
// MANDATORY: Error handling in all generated code
const generatedCode = `-- Tool Description
local RunService = game:GetService("ServiceName")

-- Error handling with pcall
local success, result = pcall(function()
    -- Main functionality here
    return true
end)

if not success then
    warn("Operation failed:", result)
    return false
end

-- Safety timeout for connections
local startTime = tick()
local maxRunTime = 30

local connection
connection = RunService.Event:Connect(function()
    if tick() - startTime > maxRunTime then
        connection:Disconnect()
        warn("Operation timeout")
        return
    end
    -- Connection logic here
end)`;

// Template literal best practice: pre-compute dynamic values
const serviceName = getServiceName(toolType);
const timeout = getAppropriateTimeout(operationType);
const code = `local ${serviceName} = game:GetService("${serviceName}")`;
```

### When Creating Tools That Return Data:
```markdown
## Tool Documentation Template:
**tool-name** - ✅ REAL IMPLEMENTATION | ❌ MOCK DATA ONLY | ⚠️ PARTIAL MOCK
- Clear description of actual vs simulated functionality
- Explicit limitations and requirements for real implementation
```

### When Claiming Milestone Completion:
1. **Validate Use Case Alignment**: Does implementation match actual requirements?
2. **Run Appropriate Tests**: Match testing rigor to use case (personal vs production)
3. **Check All Checklist Items**: Use milestone validation checklist with appropriate scope
4. **Document Honestly**: Update IMPLEMENTATION_STATUS.md with scope rationale
5. **Request Debug Mode Validation**: Let Debug Mode challenge against realistic criteria

### When Debug Mode Rejects Milestone:
1. **Don't Argue**: Debug Mode findings are always valid concerns
2. **Systematic Fixes**: Address each blocking issue methodically
3. **Update Process**: If same issue recurs, update CLAUDE.md to prevent it
4. **Re-validate**: Full testing cycle after fixes

## Development Workflow

1. **Setup**: `npm install` → create `.env` → `npm run build`
2. **Development**: Use `npm run dev` for hot reload during tool development
3. **Testing**: Run `npm test` and `npm run lint` before commits
4. **Tool Development**: Add new tools in `src/tools/` following the existing pattern
5. **Registration**: Import and register new tools in `src/tools/index.ts`

## Key Files to Understand

- `src/index.ts` - Main server setup and MCP registration
- `src/tools/index.ts` - Central tool registry
- `src/tools/codeGenerator.ts` - Example of fully implemented tool
- `src/tools/studioIntegration.ts` - Studio-specific functionality
- `package.json` - All available npm scripts and dependencies