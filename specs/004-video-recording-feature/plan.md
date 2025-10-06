# Implementation Plan: Video Recording Feature

**Branch**: `004-video-recording-feature` | **Date**: 2025-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/004-video-recording-feature/spec.md`

## Summary
Add video recording functionality to the existing Overcast video classroom application, enabling participants to record their classroom sessions locally with start/stop controls, multiple recording sessions per classroom, and download capabilities after leaving the classroom. The feature integrates with the existing Daily.co video infrastructure and Next.js classroom components.

## Technical Context
**Language/Version**: TypeScript 5.x with Next.js 15.x (App Router) - extends existing codebase
**Primary Dependencies**: 
- Existing: @daily-co/daily-react, @daily-co/daily-js, Next.js 15.x, Tailwind CSS
- New: Browser MediaRecorder API (no additional dependencies)
- jotai (already required by daily-react)

**Storage**: Browser localStorage for recording metadata, no server storage required
**Testing**: Extends existing Jest + Playwright test suite
**Target Platform**: Web browsers with MediaRecorder API support (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application extension (Next.js with App Router)
**Performance Goals**: 
- <100ms recording start/stop response
- Support 24-hour recording retention
- Minimal impact on existing video quality

**Constraints**: 
- Client-side only (no server storage)
- 24-hour automatic deletion
- Browser storage limitations
- MediaRecorder API browser compatibility

**Scale/Scope**: 
- Per-participant recording (not shared)
- Multiple recordings per classroom session
- Local storage only (no cloud sync)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Simplicity First ✅
Using browser MediaRecorder API (no complex video processing) - simplest approach for client-side recording

### Single File Preference ✅
Recording logic consolidated in RecordingControls component - related functionality kept together

### Comment-Driven Development ✅
Clear documentation of recording lifecycle and browser APIs - educational comments for newcomers

### Newcomer-Friendly Architecture ✅
Simple recording state management with clear error handling - approachable for junior developers

### Test-Driven Clarity ✅
Tests demonstrate recording start/stop/download workflows - living documentation

## Project Structure

### Documentation (this feature)
```
specs/004-video-recording-feature/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
app/
├── components/
│   ├── Classroom.tsx              # Add recording controls to existing component
│   ├── RecordingControls.tsx      # NEW: Start/stop recording UI
│   ├── RecordingManager.tsx       # NEW: Recording state and file management
│   └── DownloadManager.tsx        # NEW: Handle recording downloads
├── lib/
│   ├── recording-utils.ts         # NEW: MediaRecorder helpers
│   └── storage-utils.ts           # NEW: localStorage management
└── hooks/
    └── useRecording.ts           # NEW: Recording state hook
```

**Structure Decision**: Extends existing Next.js App Router structure with new recording components and utilities

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Browser MediaRecorder API patterns for video recording
   - Daily.co stream capture integration with MediaRecorder
   - localStorage management for recording metadata
   - File download patterns for recorded videos
   - Recording error handling and retry mechanisms
   - Browser compatibility and fallback strategies

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh cursor`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [No violations found] | [N/A] | [N/A] |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
