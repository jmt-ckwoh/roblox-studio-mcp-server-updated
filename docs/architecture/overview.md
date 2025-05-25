# Roblox Studio MCP Server - Architecture Documentation

*Last Updated: 2025-05-25 (M1.5 Systemic Improvements)*

## Overview

This document describes the architectural patterns and principles established in M1.5 to prevent systemic configuration and interface issues. These patterns are **MANDATORY** for all future development.

## Core Architectural Principles

### 1. Single Source of Truth (MANDATORY)
Every configuration value and protocol interface MUST have exactly one authoritative definition.

**Violations Result In**: Port mismatches, field name mismatches, configuration drift, silent failures

**Implementation**: All shared values centralized in `/src/shared/` directory

### 2. Build-Time Generation (MANDATORY)
Cross-component configuration MUST be auto-generated to prevent manual synchronization errors.

**Violations Result In**: Plugin-server mismatches, deployment failures, debugging confusion

**Implementation**: TypeScript configuration generates Luau plugin configuration

### 3. Runtime Validation (MANDATORY)
All protocol boundaries MUST validate data format and structure.

**Violations Result In**: Silent failures, type safety violations, debugging nightmares

**Implementation**: Type guards at all HTTP endpoints and data boundaries

### 4. No Hardcoding Policy (MANDATORY)
Zero hardcoded ports, URLs, endpoints, timeouts, or other configuration values allowed.

**Violations Result In**: Deployment inflexibility, multi-environment failures, manual error-prone updates

**Implementation**: All configuration imported from shared sources or environment variables

## Architectural Components

### Shared Configuration System

#### `src/shared/studio-config.ts`
**Purpose**: Single source of truth for all configuration values

**Contents**:
- Server ports, hosts, endpoints
- Timeout values
- Environment variable integration
- Configuration validation functions

**Usage Pattern**:
```typescript
import { DEFAULT_STUDIO_CONFIG } from '../shared/studio-config.js';

class MyServer {
  private config = DEFAULT_STUDIO_CONFIG;
  
  start() {
    this.app.listen(this.config.server.port); // NEVER hardcode port
  }
}
```

**Auto-Generation**: Plugin configuration generated from this source

#### `src/shared/studio-protocol.ts`
**Purpose**: Single source of truth for all protocol interfaces

**Contents**:
- StudioCommand interface
- StudioResponse interface
- ResponseChannel interface
- Runtime validation functions

**Usage Pattern**:
```typescript
import { StudioResponse, validateStudioResponse } from '../shared/studio-protocol.js';

app.post('/response', (req, res) => {
  if (!validateStudioResponse(req.body)) {
    return res.status(400).json({ error: 'Invalid format' });
  }
  const response: StudioResponse = req.body; // Type-safe after validation
});
```

### Build-Time Generation System

#### Plugin Configuration Generation
**File**: `build-scripts/generate-plugin-config.ts`
**Purpose**: Generate Luau configuration from TypeScript shared config
**Output**: `studio-plugin/src/Config.luau`

**Generation Process**:
1. Import shared TypeScript configuration
2. Transform to Luau format with type conversions
3. Add auto-generation warnings
4. Write to plugin source directory

**Integration**: Run during build process to ensure synchronization

### Runtime Validation System

#### Protocol Boundary Protection
**Implementation**: Type guards at all HTTP endpoints
**Purpose**: Catch format mismatches immediately instead of silent failures

**Pattern**:
```typescript
import { validateStudioResponse } from '../shared/studio-protocol.js';

app.post('/endpoint', (req, res) => {
  // MANDATORY: Validate before processing
  if (!validateStudioResponse(req.body)) {
    return res.status(400).json({ error: 'Invalid response format' });
  }
  
  // Type-safe access after validation
  const data: StudioResponse = req.body;
  processData(data);
});
```

#### Type Safety Enforcement
**TypeScript Integration**: Shared interfaces prevent drift through import graph
**Runtime Checks**: Validation functions provide runtime safety
**Error Reporting**: Clear error messages for format violations

## Component Integration Patterns

### Server Architecture

#### Studio MCP Server (`src/studio-integration/studio-mcp-server.ts`)
- **Configuration**: Uses shared config for all ports, endpoints, timeouts
- **Interfaces**: Imports all protocol types from shared definitions
- **Validation**: Validates all incoming requests at HTTP boundaries
- **Error Handling**: Type-safe error responses using shared patterns

#### HTTP-Only Server (`src/studio-integration/http-only-server.ts`)
- **Configuration**: Uses shared config for consistency with MCP server
- **Tool Mapping**: Centralized toolNameMap for case conversion
- **Validation**: Same validation patterns as MCP server
- **Testing**: Simplified server for development and testing

### Plugin Architecture

#### Configuration Import (`studio-plugin/src/Config.luau`)
- **Auto-Generated**: Created from TypeScript shared config
- **Read-Only**: Contains warning against manual editing
- **Type Conversion**: Timeout values converted from milliseconds to seconds
- **Synchronization**: Always matches server configuration

#### Main Plugin (`studio-plugin/src/Main.server.luau`)
- **Configuration Usage**: Imports all values from generated config
- **No Hardcoding**: Zero hardcoded URLs, ports, or endpoints
- **Error Messages**: Uses configuration values in error messages
- **Flexibility**: Environment changes only require server config updates

## Development Workflow Integration

### Planning Phase Requirements
1. **Architectural Review**: How will feature use shared config and interfaces?
2. **Interface Design**: Will new protocols extend shared definitions?
3. **Validation Strategy**: Where will runtime validation be added?
4. **Generation Impact**: How will auto-generation be updated?

### Implementation Phase Requirements
1. **Import Shared Config**: `import { DEFAULT_STUDIO_CONFIG } from '../shared/studio-config.js'`
2. **Import Shared Types**: `import { StudioResponse } from '../shared/studio-protocol.js'`
3. **Add Validation**: `if (!validateStudioResponse(data)) return error`
4. **Use Config Values**: `config.server.port` not hardcoded values

### Testing Phase Requirements
1. **Configuration Audit**: Verify no hardcoded values in implementation
2. **Interface Consistency**: Check all protocol types use shared definitions
3. **Validation Coverage**: Confirm all boundaries have runtime validation
4. **Generation Verification**: Test auto-generated configs match source

### Debug Phase Requirements
1. **Architectural Compliance**: Audit against M1.5 architectural principles
2. **Configuration Consistency**: Verify shared config usage across components
3. **Interface Consolidation**: Check for duplicate type definitions
4. **Build Artifact Integrity**: Validate generated files match expectations

## Anti-Patterns to Avoid

### ❌ Hardcoded Configuration
```typescript
// WRONG - Will cause deployment and maintenance issues
const SERVER_PORT = 3000;
const SERVER_URL = "http://localhost:3000";
```

### ❌ Duplicate Interface Definitions
```typescript
// WRONG - Will cause interface drift and type mismatches
interface StudioResponse {
  id: string;
  result: string; // Different from other definition!
}
```

### ❌ Missing Runtime Validation
```typescript
// WRONG - Will cause silent failures and debugging issues
app.post('/endpoint', (req, res) => {
  const data = req.body; // No validation!
  processData(data); // Potential runtime errors
});
```

### ❌ Manual Configuration Synchronization
```luau
-- WRONG - Will drift out of sync with server configuration
local SERVER_URL = "http://localhost:3000" -- Manually maintained!
```

## Correct Implementation Patterns

### ✅ Shared Configuration Usage
```typescript
// CORRECT - Single source of truth
import { DEFAULT_STUDIO_CONFIG } from '../shared/studio-config.js';

class Server {
  private config = DEFAULT_STUDIO_CONFIG;
  
  start() {
    this.app.listen(this.config.server.port);
  }
}
```

### ✅ Consolidated Interface Definitions
```typescript
// CORRECT - Import from shared source
import { StudioResponse, validateStudioResponse } from '../shared/studio-protocol.js';

// All components use same definition
function processResponse(response: StudioResponse) {
  // Type-safe processing
}
```

### ✅ Runtime Validation at Boundaries
```typescript
// CORRECT - Validate before processing
app.post('/endpoint', (req, res) => {
  if (!validateStudioResponse(req.body)) {
    return res.status(400).json({ error: 'Invalid format' });
  }
  
  const data: StudioResponse = req.body; // Type-safe after validation
  processData(data);
});
```

### ✅ Auto-Generated Configuration
```luau
-- CORRECT - Generated from TypeScript source
local Config = require(script.Config) -- Auto-generated file
local SERVER_URL = Config.SERVER_URL  -- Always matches server
```

## Migration Guide

### For Existing Components
1. **Replace hardcoded values** with shared config imports
2. **Consolidate duplicate interfaces** to shared protocol definitions
3. **Add runtime validation** at all protocol boundaries
4. **Update build process** to generate configurations

### For New Components
1. **Start with shared imports** for config and interfaces
2. **Add validation from day one** at all boundaries
3. **Follow established patterns** for consistency
4. **Document architectural decisions** in code comments

## Quality Metrics

### Configuration Compliance
- **Zero hardcoded ports**: All ports from shared config
- **Zero hardcoded URLs**: All URLs from shared config or generated
- **Zero hardcoded timeouts**: All timeouts from shared config

### Interface Consistency
- **Single interface definitions**: No duplicate types across codebase
- **Shared import usage**: All protocol types imported from shared source
- **Type safety coverage**: All boundaries use TypeScript types

### Runtime Safety
- **Validation coverage**: All HTTP endpoints validate input
- **Error reporting**: Clear error messages for format violations
- **Type safety**: All data access type-safe after validation

### Build Integration
- **Auto-generation working**: Plugin config matches server config
- **Build verification**: Generated files exist and are recent
- **Synchronization testing**: Cross-component consistency verified

## Future Improvements

### Planned Enhancements
1. **Build-time validation**: Fail builds on hardcoded value detection
2. **Interface duplication scanning**: AST analysis for duplicate types
3. **Configuration drift detection**: Compare generated vs expected configs
4. **Schema evolution**: Versioned protocol definitions for compatibility

### Monitoring Opportunities
1. **Configuration audit scripts**: Automated compliance checking
2. **Interface consistency checking**: Build-time verification
3. **Runtime validation metrics**: Track validation failures
4. **Generation integrity checks**: Verify auto-generation accuracy

---

## Summary

The M1.5 architectural improvements represent a fundamental shift from reactive bug fixing to proactive systemic prevention. By centralizing configuration, consolidating interfaces, adding runtime validation, and implementing build-time generation, we've eliminated entire classes of bugs that previously caused repeated failures.

**Key Success Factors**:
1. **Discipline**: Following architectural patterns consistently
2. **Automation**: Build-time generation prevents manual errors
3. **Validation**: Runtime checking catches issues immediately
4. **Documentation**: Clear patterns enable consistent implementation

**Maintenance Requirements**:
1. **Audit compliance** in all new code
2. **Update shared definitions** when protocols evolve
3. **Extend generation system** for new cross-component values
4. **Document architectural decisions** for future developers

This architecture provides a robust foundation for scalable, maintainable, and reliable multi-component development.