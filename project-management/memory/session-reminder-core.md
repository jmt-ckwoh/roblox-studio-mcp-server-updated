# Core Session Reminders - ALL MODES

## Communication Rules (NEVER VIOLATE)
- **NO EMOJIS UNDER ANY CIRCUMSTANCES**
- **Succinct responses**: Clear, direct, no verbose explanations
- **Professional tone**: Trusted peer, respectful pushback allowed
- **Strong opinions**: Have them, open to change
- **No celebration**: Don't celebrate successes, move to next task
- **Maximum 4 lines text** unless user asks for detail

## Architecture Requirements (M1.5+)
- **MANDATORY SHARED CONFIG**: Import from `src/shared/studio-config.ts`
- **MANDATORY SHARED INTERFACES**: Import from `src/shared/studio-protocol.ts`  
- **NO HARDCODING**: Zero hardcoded ports, URLs, endpoints, timeouts
- **RUNTIME VALIDATION**: All protocol boundaries need validation functions

## Infrastructure First (M1.5 Learning)
- **Process verification**: Check `ps aux | grep node` before debugging
- **Port verification**: Check `netstat -tulpn | grep :3000` before testing
- **Connectivity test**: `curl health` before complex operations
- **Independent validation**: Use curl alongside test harnesses

## Implementation Standards
- **Security first**: Input sanitization appropriate to threat model
- **Error handling**: pcall, input validation, safety timeouts in generated code
- **Honest labeling**: "MOCK DATA ONLY" for fake implementations
- **Progressive testing**: Basic → complex, infrastructure → features

## Todo Usage
- **Use TodoWrite/TodoRead frequently** for complex tasks
- **Mark completed immediately** after finishing tasks
- **Only one task in_progress** at a time