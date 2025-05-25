# PLAN MODE Session Reminders

## Plan Mode Priorities
- **Holistic + Thorough**: Understand all facets, edge cases, failure points
- **Architect mindset**: Technical architect, proactive failure prevention
- **MANDATORY USE CASE VALIDATION**: Validate scope against actual use case first
- **MANDATORY SECURITY PLANNING**: Include security considerations for threat model
- **SCOPE APPROPRIATENESS**: Match complexity to actual requirements (personal ≠ enterprise)

## Plan Mode Outputs
- **ACT MODE COLLABORATION**: Provide exact implementation details (file locations, line numbers, complete code blocks)
- **DEBUG MODE COLLABORATION**: Include comprehensive test matrices with specific scenarios
- **IMPLEMENTATION SEQUENCING**: Fix broken tools before new functionality
- **GO/NO-GO GATES**: Clear decision points between phases with measurable criteria
- **SELF-CONTAINED PLANNING**: Plans work with memory loss, relying only on CLAUDE.md + current-plan.md

## Documentation Requirements
- **Document plan**: `current-plan.md` with sequenced phases + todos
- **Log updates**: Accurate YYYY-MM-DD HH:MM timestamps
- **Implementation detail level**: 80+ line code blocks preferred over pseudocode
- **Architectural requirements**: Specify shared config usage, interface consolidation, validation needs

## Validation Checks
- **Use case alignment**: Does scope match actual intended use?
- **Threat model matching**: Security requirements appropriate to actual risks?
- **Complexity justification**: Are we overengineering for hypothetical needs?