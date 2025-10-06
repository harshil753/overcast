# Tasks: Video Recording Feature

**Input**: Design documents from `/specs/004-video-recording-feature/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `app/`, `lib/`, `tests/` at repository root
- Paths shown below assume Next.js App Router structure

## Phase 3.1: Setup
- [x] T001 Create recording utilities and types in lib/recording-utils.ts
- [x] T002 Create storage utilities in lib/storage-utils.ts  
- [x] T003 [P] Create recording hook in app/hooks/useRecording.ts
- [x] T004 [P] Create recording types in lib/types.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T005 [P] Contract test recording API in tests/contract/test_recording_api.test.ts
- [x] T006 [P] Integration test recording workflow in tests/integration/test_recording_workflow.test.ts
- [x] T007 [P] Integration test multiple recordings in tests/integration/test_multiple_recordings.test.ts
- [x] T008 [P] Integration test recording error handling in tests/integration/test_recording_errors.test.ts
- [x] T009 [P] Unit test recording utilities in tests/unit/recording-utils.test.ts
- [x] T010 [P] Unit test storage utilities in tests/unit/storage-utils.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T011 [P] Recording model in lib/recording-utils.ts
- [x] T012 [P] RecordingFile model in lib/recording-utils.ts
- [x] T013 [P] RecordingState model in lib/recording-utils.ts
- [x] T014 RecordingControls component in app/components/RecordingControls.tsx
- [x] T015 RecordingManager component in app/components/RecordingManager.tsx
- [x] T016 DownloadManager component in app/components/DownloadManager.tsx
- [x] T017 Recording state management in app/hooks/useRecording.ts
- [x] T018 Storage operations in lib/storage-utils.ts
- [x] T019 MediaRecorder integration in lib/recording-utils.ts
- [x] T020 Error handling and retry logic in lib/recording-utils.ts

## Phase 3.4: Integration
- [x] T021 Integrate RecordingControls into Classroom.tsx
- [x] T022 Add recording state to UserSessionProvider
- [x] T023 Daily.co stream capture integration
- [x] T024 Recording notification system
- [x] T025 TTL cleanup system
- [x] T026 Browser compatibility checks

## Phase 3.5: Polish
- [x] T027 [P] Unit tests for RecordingControls in tests/unit/components/RecordingControls.test.tsx
- [x] T028 [P] Unit tests for RecordingManager in tests/unit/components/RecordingManager.test.tsx
- [x] T029 [P] Unit tests for DownloadManager in tests/unit/components/DownloadManager.test.tsx
- [x] T030 [P] Unit tests for useRecording hook in tests/unit/hooks/useRecording.test.ts
- [x] T031 Performance tests for recording start/stop (<100ms)
- [x] T032 [P] Update component documentation
- [x] T033 [P] Add recording feature to README.md
- [x] T034 Manual testing of complete recording workflow
- [x] T035 Browser compatibility validation

## Dependencies
- Tests (T005-T010) before implementation (T011-T020)
- T011-T013 (models) before T014-T016 (components)
- T014-T016 (components) before T021 (integration)
- T021 (Classroom integration) before T022 (UserSession)
- T022 (UserSession) before T023 (Daily.co integration)
- Implementation before polish (T027-T035)

## Parallel Example
```
# Launch T005-T010 together:
Task: "Contract test recording API in tests/contract/test_recording_api.test.ts"
Task: "Integration test recording workflow in tests/integration/test_recording_workflow.test.ts"
Task: "Integration test multiple recordings in tests/integration/test_multiple_recordings.test.ts"
Task: "Integration test recording error handling in tests/integration/test_recording_errors.test.ts"
Task: "Unit test recording utilities in tests/unit/recording-utils.test.ts"
Task: "Unit test storage utilities in tests/unit/storage-utils.test.ts"
```

## Task Details

### T001: Create recording utilities and types
**File**: `lib/recording-utils.ts`
**Description**: Create core recording utilities with MediaRecorder API integration, error handling, and retry logic. Include TypeScript interfaces for Recording, RecordingFile, and RecordingState entities.

### T002: Create storage utilities  
**File**: `lib/storage-utils.ts`
**Description**: Implement localStorage management for recording metadata with TTL cleanup, JSON serialization, and storage quota handling.

### T003: Create recording hook
**File**: `app/hooks/useRecording.ts`
**Description**: Create React hook for recording state management with start/stop/retry functionality and error handling.

### T004: Create recording types
**File**: `lib/types.ts`
**Description**: Add TypeScript type definitions for recording entities, status enums, and API interfaces.

### T005: Contract test recording API
**File**: `tests/contract/test_recording_api.test.ts`
**Description**: Test recording API endpoints (start, stop, list, download, cleanup) with proper request/response validation.

### T006: Integration test recording workflow
**File**: `tests/integration/test_recording_workflow.test.ts`
**Description**: Test complete recording workflow from start to download with browser automation.

### T007: Integration test multiple recordings
**File**: `tests/integration/test_multiple_recordings.test.ts`
**Description**: Test multiple recording sessions in same classroom with proper state management.

### T008: Integration test recording error handling
**File**: `tests/integration/test_recording_errors.test.ts`
**Description**: Test error scenarios including permission denial, storage full, and retry mechanisms.

### T009: Unit test recording utilities
**File**: `tests/unit/recording-utils.test.ts`
**Description**: Test MediaRecorder integration, error handling, and retry logic functions.

### T010: Unit test storage utilities
**File**: `tests/unit/storage-utils.test.ts`
**Description**: Test localStorage operations, TTL cleanup, and storage quota management.

### T011: Recording model
**File**: `lib/recording-utils.ts`
**Description**: Implement Recording entity with validation rules, state transitions, and business logic.

### T012: RecordingFile model
**File**: `lib/recording-utils.ts`
**Description**: Implement RecordingFile entity for blob management and download URL generation.

### T013: RecordingState model
**File**: `lib/recording-utils.ts`
**Description**: Implement RecordingState entity for user session state tracking.

### T014: RecordingControls component
**File**: `app/components/RecordingControls.tsx`
**Description**: Create UI component with start/stop recording buttons, visual indicators, and error messages.

### T015: RecordingManager component
**File**: `app/components/RecordingManager.tsx`
**Description**: Create component for recording state management and file operations.

### T016: DownloadManager component
**File**: `app/components/DownloadManager.tsx`
**Description**: Create component for recording download functionality and file management.

### T017: Recording state management
**File**: `app/hooks/useRecording.ts`
**Description**: Implement React hook with recording state, error handling, and retry logic.

### T018: Storage operations
**File**: `lib/storage-utils.ts`
**Description**: Implement localStorage CRUD operations with TTL management and cleanup.

### T019: MediaRecorder integration
**File**: `lib/recording-utils.ts`
**Description**: Implement MediaRecorder API integration with Daily.co stream capture.

### T020: Error handling and retry logic
**File**: `lib/recording-utils.ts`
**Description**: Implement exponential backoff retry mechanism and error recovery strategies.

### T021: Integrate RecordingControls into Classroom
**File**: `app/components/Classroom.tsx`
**Description**: Add RecordingControls component next to Leave Room button with proper positioning.

### T022: Add recording state to UserSessionProvider
**File**: `app/components/UserSessionProvider.tsx`
**Description**: Extend user session context to include recording state and classroom ID.

### T023: Daily.co stream capture integration
**File**: `app/components/RecordingManager.tsx`
**Description**: Integrate Daily.co video/audio elements with MediaRecorder for stream capture.

### T024: Recording notification system
**File**: `app/components/RecordingManager.tsx`
**Description**: Implement notifications for new participants when recording is active.

### T025: TTL cleanup system
**File**: `lib/storage-utils.ts`
**Description**: Implement automatic cleanup of expired recordings with user notification.

### T026: Browser compatibility checks
**File**: `lib/recording-utils.ts`
**Description**: Add feature detection and graceful degradation for unsupported browsers.

### T027: Unit tests for RecordingControls
**File**: `tests/unit/components/RecordingControls.test.tsx`
**Description**: Test component rendering, button states, and user interactions.

### T028: Unit tests for RecordingManager
**File**: `tests/unit/components/RecordingManager.test.tsx`
**Description**: Test recording state management and file operations.

### T029: Unit tests for DownloadManager
**File**: `tests/unit/components/DownloadManager.test.tsx`
**Description**: Test download functionality and file management.

### T030: Unit tests for useRecording hook
**File**: `tests/unit/hooks/useRecording.test.ts`
**Description**: Test hook state management and error handling.

### T031: Performance tests for recording start/stop
**File**: `tests/performance/recording-performance.test.ts`
**Description**: Validate recording start/stop response time under 100ms requirement.

### T032: Update component documentation
**File**: `app/components/README.md`
**Description**: Add documentation for new recording components with usage examples.

### T033: Add recording feature to README
**File**: `README.md`
**Description**: Update project README with recording feature documentation and usage.

### T034: Manual testing of complete recording workflow
**File**: `tests/manual/recording-workflow.md`
**Description**: Manual testing checklist for complete recording workflow validation.

### T035: Browser compatibility validation
**File**: `tests/compatibility/browser-support.md`
**Description**: Validate recording functionality across supported browsers.

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Follow Overcast Constitution principles
- Use existing codebase patterns and conventions

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - recording-api.yaml → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Recording entity → model creation task [P]
   - RecordingFile entity → model creation task [P]
   - RecordingState entity → model creation task [P]
   
3. **From User Stories**:
   - Recording workflow → integration test [P]
   - Multiple recordings → integration test [P]
   - Error handling → integration test [P]

4. **Ordering**:
   - Setup → Tests → Models → Components → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
