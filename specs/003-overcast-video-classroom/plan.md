# Implementation Plan: Overcast Video Classroom Application

**Branch**: `003-overcast-video-classroom` | **Date**: 2025-10-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `E:\env\AI_Project\Class2\overcast\specs\003-overcast-video-classroom\spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ Technical stack specified by user (Next.js, Daily.co, Tailwind, Vercel)
   → Structure: Next.js web application
3. Fill the Constitution Check section
   → ✅ Evaluating against constitution principles
4. Evaluate Constitution Check section
   → ✅ No violations - approach aligns with simplicity and newcomer-friendly principles
5. Execute Phase 0 → research.md
   → IN PROGRESS
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → PENDING
7. Re-evaluate Constitution Check
   → PENDING
8. Plan Phase 2 → Describe task generation approach
   → PENDING
9. STOP - Ready for /tasks command
   → PENDING
```

## Summary
Build a video-based classroom application called Overcast that provides a main lobby with 6 classrooms (Cohort 1-6). Users can join classrooms as either students or instructors, with instructors receiving additional controls for muting participants and creating breakout rooms. The application uses Daily.co for video infrastructure, Next.js for the framework, Tailwind CSS for styling with a futuristic black/teal aesthetic, and runs locally without a database using pre-configured Daily room URLs.

## Technical Context
**Language/Version**: TypeScript 5.x with Next.js 15.x (App Router)  
**Primary Dependencies**: 
- @daily-co/daily-react (video hooks and provider)
- @daily-co/daily-js (Daily call object and types)
- jotai (state management, required by daily-react)
- Next.js 15.x (React framework with App Router)
- Tailwind CSS v4 (styling with futuristic theme)
- React 19.x (UI library)

**Storage**: No database - configuration via environment variables for 6 pre-defined Daily.co room URLs  
**Testing**: Jest + React Testing Library (unit/component), Playwright (integration/E2E)  
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge) via local Next.js dev server, deployable to Vercel  
**Project Type**: Web application (Next.js with App Router)  
**Performance Goals**: 
- <2s initial page load
- <500ms lobby → classroom transition
- Support 10 concurrent participants per classroom with stable video quality

**Constraints**: 
- No backend database (all config via env vars)
- Must work locally with pre-defined Daily.co URLs
- 10 participant maximum per classroom
- 6 classrooms total (Cohort 1-6)

**Scale/Scope**: 
- 6 concurrent classroom sessions
- Up to 60 total users (10 per classroom)
- Small-scale local/accelerator deployment

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Simplicity First
✅ **PASS**: Using Daily.co abstracts complex WebRTC implementation. Next.js provides batteries-included routing and API routes. No custom video infrastructure or complex state management beyond Daily's requirements.

### Single File Preference
✅ **PASS**: Will consolidate related functionality:
- Lobby component with mode selection in single file
- Classroom component with video feed and controls in single file
- Daily configuration and room mapping in single constants file
- Tailwind config with custom theme in single file

### Comment-Driven Development
✅ **PASS**: Plan includes comprehensive comments for:
- WHY we use Daily.co hooks patterns
- HOW the role system works (student vs instructor)
- Explanation of classroom lifecycle (on-demand sessions)
- Documentation of futuristic styling decisions

### Newcomer-Friendly Architecture
✅ **PASS**: 
- Clear separation: pages (routing) → components (UI) → lib (config)
- Descriptive naming: `Lobby`, `Classroom`, `InstructorControls`, `VideoFeed`
- Daily.co React hooks provide clear, documented API
- Tailwind classes are self-documenting

### Test-Driven Clarity
✅ **PASS**: Tests will demonstrate:
- "User enters name and sees 6 classrooms"
- "Instructor can mute participant"
- "Student can unmute themselves"
- Integration tests validate complete user workflows

**Initial Constitution Check**: ✅ PASS

## Project Structure

### Documentation (this feature)
```
specs/003-overcast-video-classroom/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output - Daily.co integration research
├── data-model.md        # Phase 1 output - TypeScript interfaces
├── quickstart.md        # Phase 1 output - Local development guide
├── contracts/           # Phase 1 output - API endpoint schemas
│   ├── rooms-api.yaml
│   └── participants-api.yaml
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
app/
├── page.tsx                  # Landing/name entry page
├── lobby/
│   └── page.tsx              # Main lobby (6 classrooms, mode toggle)
├── classroom/
│   └── [id]/
│       └── page.tsx          # Dynamic classroom pages (Cohort 1-6)
├── api/
│   ├── rooms/
│   │   └── route.ts          # GET /api/rooms - List classrooms with status
│   └── participants/
│       └── [sessionId]/
│           └── mute/
│               └── route.ts  # POST /api/participants/:id/mute
├── components/
│   ├── Lobby.tsx             # Lobby UI with classroom grid
│   ├── Classroom.tsx         # Video feed container with Daily provider
│   ├── VideoFeed.tsx         # Participant video tiles
│   ├── InstructorControls.tsx  # Mute controls panel
│   └── ParticipantList.tsx   # List of participants with controls
├── globals.css              # Tailwind imports + futuristic theme
└── layout.tsx               # Root layout with branding

lib/
├── types.ts                 # TypeScript interfaces for app
├── daily-config.ts          # Daily room URL mappings (from env)
├── constants.ts             # App constants (max participants, room names)
└── utils.ts                 # Helper functions

tests/
├── contract/
│   ├── test_rooms.test.ts           # API contract tests
│   └── test_participants.test.ts    # Participant API tests
├── integration/
│   ├── test_student_journey.test.ts       # E2E student flow
│   ├── test_instructor_journey.test.ts    # E2E instructor flow
│   └── test_classroom_switching.test.ts   # Room navigation
└── unit/
    ├── components/
    │   ├── Lobby.test.tsx
    │   └── InstructorControls.test.tsx
    └── utils.test.ts
```

**Structure Decision**: Next.js App Router structure chosen because:
- App directory provides file-system routing for lobby and dynamic classrooms
- API routes via route handlers for Vercel serverless deployment
- Components directory for reusable UI following single-responsibility
- Lib directory for non-UI logic (config, types, utils)
- Tests directory mirrors implementation structure
- Aligns with constitutional single-file preference (related logic consolidated)

## Phase 0: Outline & Research

### Research Topics

1. **Daily.co Integration Patterns**
   - Decision: Use @daily-co/daily-react hooks
   - Rationale: Provides React-native integration, handles cleanup, manages call lifecycle
   - Key hooks: `useDaily()`, `useParticipants()`, `useDevices()`, `DailyProvider`
   - Alternatives: daily-js directly (more boilerplate), other video SDKs (more complex)

2. **Next.js 15 App Router Best Practices**
   - Decision: Use App Router with Server Components where possible, Client Components for interactivity
   - Rationale: Modern Next.js pattern, better performance, improved DX
   - Server Components: Layout, static content
   - Client Components: Video feed, interactive controls (require 'use client')
   - Alternatives: Pages Router (legacy), pure React SPA (lose SSR benefits)

3. **State Management Approach**
   - Decision: Use jotai (required by daily-react) + React Context for user session
   - Rationale: Minimal, atomic state management; required peer dependency
   - User session (name, role) in Context API (simple, built-in)
   - Daily state managed by daily-react hooks automatically
   - Alternatives: Redux (overkill), Zustand (extra dependency)

4. **Tailwind v4 Futuristic Theme**
   - Decision: Custom CSS variables for black/teal/orange palette in globals.css
   - Rationale: v4 uses CSS-first config, easier to maintain custom colors
   - Black (#000000) background, teal (#00FFD1) highlights, orange (#FFBD17) accents
   - Geometric sans-serif fonts, high contrast, neon glow effects
   - Alternatives: CSS-in-JS (violates simplicity), component libraries (generic styling)

5. **Classroom URL Configuration**
   - Decision: Environment variables (DAILY_ROOM_1 through DAILY_ROOM_6)
   - Rationale: No database required, easy local setup, 12-factor app pattern
   - Config mapping in lib/daily-config.ts
   - Alternatives: JSON config file (less secure for URLs), hardcoded (inflexible)

6. **Vercel Serverless API Routes**
   - Decision: Minimal API routes for room listing and participant actions
   - Rationale: Vercel deploys route handlers as serverless functions automatically
   - GET /api/rooms - return configured classrooms
   - POST /api/participants/[id]/mute - Daily API proxy if needed
   - Alternatives: Separate backend (overcomplicated), client-only (security concerns)

7. **Testing Strategy**
   - Decision: Jest for unit/component, Playwright for E2E
   - Rationale: Jest integrates with Next.js, Playwright for full browser automation
   - Mock Daily.co in unit tests, use Daily test rooms for integration
   - Alternatives: Cypress (heavier), Testing Library only (no real browser testing)

**Output Location**: `specs/003-overcast-video-classroom/research.md`

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

### Data Model Entities

1. **ClassroomConfig**
   - `id`: string (cohort-1, cohort-2, ..., cohort-6)
   - `name`: string (Cohort 1, Cohort 2, ...)
   - `dailyUrl`: string (Daily.co room URL from env)
   - `maxParticipants`: number (10)

2. **UserSession**
   - `name`: string (user entered name)
   - `role`: 'student' | 'instructor'
   - `sessionId`: string (Daily session ID)
   - `currentClassroom`: string | null (classroom ID)

3. **Participant** (from Daily.co)
   - `session_id`: string
   - `user_name`: string
   - `tracks`: { video: TrackState, audio: TrackState }
   - `local`: boolean
   - `owner`: boolean

4. **ClassroomState**
   - `id`: string
   - `participants`: Participant[]
   - `isActive`: boolean (has participants)
   - `participantCount`: number

### API Contracts

**GET /api/rooms**
```yaml
summary: List all 6 classrooms with current status
responses:
  200:
    content:
      application/json:
        schema:
          type: object
          properties:
            classrooms:
              type: array
              items:
                type: object
                properties:
                  id: string
                  name: string
                  participantCount: number
                  isAtCapacity: boolean
```

**POST /api/participants/[sessionId]/mute**
```yaml
summary: Mute a participant (instructor action)
parameters:
  - name: sessionId
    in: path
    required: true
    schema:
      type: string
requestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          muted: boolean
responses:
  200:
    description: Participant muted successfully
  403:
    description: User is not an instructor
  404:
    description: Participant not found
```

### Test Scenarios

**Integration Tests**:
1. **Student Journey**: User enters name → sees lobby → joins classroom → views video → returns to lobby
2. **Instructor Journey**: User enters name → selects instructor mode → joins classroom → mutes participant → creates breakout room
3. **Classroom Capacity**: 10 users join classroom → 11th user sees "full" message
4. **Role Persistence**: User switches classrooms → role remains the same

**Contract Tests**:
- GET /api/rooms returns array of 6 classrooms
- POST /api/participants/:id/mute requires instructor role
- Classroom URLs are valid Daily.co format

**Output Locations**: 
- `specs/003-overcast-video-classroom/data-model.md`
- `specs/003-overcast-video-classroom/contracts/rooms-api.yaml`
- `specs/003-overcast-video-classroom/contracts/participants-api.yaml`
- `specs/003-overcast-video-classroom/quickstart.md`
- `tests/contract/` (test files)
- `tests/integration/` (test scenarios)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. **Setup Tasks** (3-4 tasks):
   - Initialize Next.js project with TypeScript
   - Install Daily.co dependencies (@daily-co/daily-react, @daily-co/daily-js, jotai)
   - Configure Tailwind v4 with futuristic theme
   - Set up environment variables for 6 Daily room URLs

2. **Type Definitions & Constants** (2-3 tasks [P]):
   - Create TypeScript interfaces in lib/types.ts
   - Define constants in lib/constants.ts
   - Create Daily config mapping in lib/daily-config.ts

3. **Contract Tests First** (2 tasks [P]):
   - Write API route tests for GET /api/rooms
   - Write API route tests for POST /api/participants/:id/mute

4. **API Implementation** (2 tasks):
   - Implement GET /api/rooms route handler
   - Implement POST /api/participants/:id/mute route handler

5. **Component Tests** (4 tasks [P]):
   - Test Lobby component rendering
   - Test Classroom component with mocked Daily
   - Test InstructorControls functionality
   - Test VideoFeed participant rendering

6. **UI Components** (5-6 tasks):
   - Create landing page with name entry (app/page.tsx)
   - Build Lobby component with 6 classroom grid
   - Build Classroom component with Daily provider
   - Build VideoFeed with participant tiles
   - Build InstructorControls panel
   - Create ParticipantList component

7. **Integration Tests** (3 tasks [P]):
   - Student journey E2E test
   - Instructor journey E2E test
   - Classroom switching test

8. **Styling & Polish** (2-3 tasks):
   - Apply futuristic theme (black/teal/orange)
   - Add responsive design for mobile/tablet
   - Implement loading states and error handling

**Ordering Strategy**:
- Setup → Types/Constants → Tests → Implementation → Styling
- Contract tests before API routes (TDD)
- Component tests before component implementation (TDD)
- Integration tests can run in parallel once components exist
- Mark [P] for parallel tasks (different files, no dependencies)

**Estimated Output**: 28-32 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations - tracking section not needed*

The chosen architecture maintains simplicity through:
- Using Daily.co's abstraction layer (no custom WebRTC)
- Next.js conventions (file-system routing, API routes)
- Single-file components (related logic consolidated)
- No database (environment-based config)
- Minimal state management (jotai + React Context)

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
- [ ] All NEEDS CLARIFICATION resolved (2 deferred to implementation: breakout room details)
- [x] Complexity deviations documented (none - no violations)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*

