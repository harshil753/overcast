<!-- 
Sync Impact Report:
Version change: 0.0.0 → 1.0.0
Modified principles: All new (no previous principles)
Added sections: Simplicity First, Single File Preference, Comment-Driven Development, Newcomer-Friendly Architecture, Test-Driven Clarity
Templates requiring updates: ✅ plan-template.md (updated), ⚠ spec-template.md (pending), ⚠ tasks-template.md (pending)
Follow-up TODOs: Update remaining templates to align with new constitution principles
-->

# Overcast Constitution

## Core Principles

### I. Simplicity First
Every feature MUST start with the simplest working approach. Complex patterns require explicit justification and documentation. No premature optimization or over-engineering allowed. When multiple solutions exist, choose the one that requires the least mental overhead for a new developer to understand and modify.

### II. Single File Preference  
Related functionality MUST be kept together in the same file unless clear organizational benefits justify separation. File splits require explicit rationale. Avoid excessive hierarchies, unnecessary modules, or artificial separation that fragments understanding. When in doubt, consolidate rather than split.

### III. Comment-Driven Development
Non-trivial logic MUST include WHY comments explaining business decisions in accessible language. Complex patterns require educational explanations. Code should be self-documenting through descriptive naming and explanatory comments that teach newcomers the domain logic and reasoning behind implementation choices.

### IV. Newcomer-Friendly Architecture
Architecture MUST be approachable for junior developers. Use clear, descriptive naming without domain-specific jargon. Advanced patterns require explanation when first introduced. No implicit conventions or hidden abstractions. Every architectural decision should be obvious to someone new to the codebase.

### V. Test-Driven Clarity
Tests MUST serve as living documentation. Test names describe scenarios in plain language. Tests demonstrate complete user workflows. Test code follows the same simplicity principles as production code. Tests should be the first place a new developer looks to understand how the system works.

## Development Standards

### Code Organization
- Keep related components, utilities, and types in the same file
- Use descriptive file names that indicate purpose
- Group by feature, not by technical layer
- Avoid deep nesting - prefer flat structure

### Documentation Requirements
- Every function with business logic needs a comment explaining WHY
- Complex algorithms require step-by-step explanations
- API endpoints need usage examples
- Configuration options need clear descriptions

### Testing Standards
- Write tests that read like specifications
- Test names should describe user scenarios
- One test file per component/utility
- Integration tests demonstrate complete workflows

## Governance

This constitution supersedes all other development practices. All code reviews MUST verify compliance with these principles. Complexity must be justified with clear rationale. Violations require refactoring before merge approval.

**Version**: 1.0.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-01-27