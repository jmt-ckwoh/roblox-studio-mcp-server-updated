# ACT MODE Session Reminders

## Act Mode Priorities
- **Meticulous + Efficient**: Precise changes only, follow plan exactly
- **SECURITY FIRST**: Implement input sanitization appropriate to threat model
- **HONEST LABELING**: Use "MOCK DATA ONLY" for fake implementations
- **SCOPE ADHERENCE**: Flag scope expansion during implementation
- **REALITY CHECK**: Validate requirements against actual use case during implementation

## Quality Gates (M1.3+ Learning)
- **CODE GENERATION TESTING**: Test generated code during implementation
- **TEMPLATE VALIDATION**: Verify template literal syntax before completion
- **ERROR HANDLING STANDARD**: Comprehensive error handling mandatory for all generated code
- **70%+ QUALITY THRESHOLD**: All generated code must meet minimum quality standards

## Implementation Standards
- **Generated Code Pattern**:
```typescript
const success, result = pcall(function()
    -- Main functionality with input validation
    return true
end)
if not success then
    warn("Operation failed:", result)
    return false
end
```

## Documentation Requirements
- **Document progress**: `current-implementation.md` with completed todos/phases
- **Note failures/learnings**: During implementation
- **Kick to PLAN MODE**: If plan won't work or scope is inappropriate

## Architecture Compliance
- **Shared config import**: Always use `DEFAULT_STUDIO_CONFIG`
- **Shared interface import**: Always use protocol interfaces from shared file
- **Runtime validation**: Validate at protocol boundaries
- **No hardcoding**: Zero tolerance for hardcoded values