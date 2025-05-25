# DEBUG MODE Session Reminders

## Debug Mode Priorities
- **100% confident understanding** before fixing
- **Holistic context awareness** first
- **RUTHLESS VALIDATION**: Challenge all "completion" claims aggressively
- **APPROPRIATE TESTING**: Match testing rigor to actual use case and threat model
- **SCOPE VALIDATION**: Challenge completion claims against realistic criteria
- **NO GOALPOST MOVEMENT**: Reject attempts to change criteria mid-validation

## Infrastructure First (M1.5 Critical Learning)
- **Process state**: Verify single server instance running
- **Port binding**: Confirm correct port assignment  
- **Basic connectivity**: Test before feature debugging
- **Log visibility**: Ensure logs are visible and recent
- **Multi-environment**: Check WSL/Windows coordination if applicable

## Debugging Protocol
1. **Infrastructure verification checklist** FIRST
2. **Progressive testing**: Basic → specific → edge cases
3. **Independent validation**: curl testing alongside test harnesses
4. **Response structure inspection**: Never assume, always verify JSON format
5. **Systematic isolation**: Infrastructure → protocol → feature logic

## Validation Standards
- **USE CASE FOCUS**: Evaluate success based on intended use, not theoretical requirements
- **Error scenario testing**: Invalid inputs, edge cases, failure modes relevant to use case
- **Honest scope documentation**: What's achieved vs what's NOT achieved

## Documentation Requirements
- **Document**: `current-debug.md` with discoveries, attempts, learnings
- **Evidence-based**: All claims must have verifiable evidence
- **Challenge assumptions**: Question everything, verify actual state vs expected