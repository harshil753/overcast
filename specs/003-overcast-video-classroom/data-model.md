# Data Model: Overcast Video Classroom

**Feature**: 003-overcast-video-classroom  
**Date**: 2025-10-05  
**Phase**: 1 - Design & Contracts

## Overview
This document defines TypeScript interfaces and types for the Overcast video classroom application. Since we're not using a database, these represent in-memory state and API contracts.

---

## Core Entities

### 1. ClassroomConfig
**Purpose**: Configuration for each of the 6 available classrooms
**Location**: `lib/daily-config.ts`
**Lifecycle**: Static, loaded from environment variables at build/runtime

```typescript
/**
 * Represents a configured classroom/cohort.
 * WHY: Maps environment variables to application config for each of the 6 cohorts.
 */
export interface ClassroomConfig {
  /** Unique identifier (cohort-1, cohort-2, ..., cohort-6) */
  id: string;
  
  /** Display name for UI (Cohort 1, Cohort 2, ..., Cohort 6) */
  name: string;
  
  /** Daily.co room URL from environment variable */
  dailyUrl: string;
  
  /** Maximum participants allowed (10 per requirement FR-016) */
  maxParticipants: number;
}
```

**Validation Rules**:
- `id` MUST match pattern `cohort-[1-6]`
- `name` MUST be non-empty string
- `dailyUrl` MUST be valid Daily.co URL format (`https://*.daily.co/*`)
- `maxParticipants` MUST equal 10 (from clarification)

**Example**:
```typescript
const cohort1: ClassroomConfig = {
  id: 'cohort-1',
  name: 'Cohort 1',
  dailyUrl: 'https://overcast-demo.daily.co/cohort-1',
  maxParticipants: 10,
};
```

---

### 2. UserSession
**Purpose**: Tracks user's identity and role throughout the application
**Location**: `lib/types.ts`, managed in React Context
**Lifecycle**: Created on name entry, persists until browser close

```typescript
/**
 * Represents a user's session state.
 * WHY: Stores user-entered name and selected role (student/instructor).
 * Used to personalize UI and determine available controls.
 */
export interface UserSession {
  /** User-provided name (no authentication required per clarification) */
  name: string;
  
  /** Role selected in lobby: student (default) or instructor */
  role: UserRole;
  
  /** Daily.co session ID, assigned when user joins a classroom */
  sessionId: string | null;
  
  /** Currently joined classroom ID, null if in lobby */
  currentClassroom: string | null;
}

/**
 * User roles with different permission levels.
 * WHY: Enum ensures type safety and documents the two available roles.
 */
export type UserRole = 'student' | 'instructor';
```

**State Transitions**:
1. **Initial**: User lands on app → `{ name: '', role: 'student', sessionId: null, currentClassroom: null }`
2. **Name Entry**: User enters name → `{ name: 'John', role: 'student', sessionId: null, currentClassroom: null }`
3. **Join Classroom**: User clicks cohort → `{ name: 'John', role: 'student', sessionId: 'abc123', currentClassroom: 'cohort-1' }`
4. **Return to Lobby**: User leaves room → `{ name: 'John', role: 'student', sessionId: null, currentClassroom: null }`
5. **Switch Role**: User toggles to instructor → `{ name: 'John', role: 'instructor', sessionId: null, currentClassroom: null }`

**Validation Rules**:
- `name` MUST be 1-50 characters (required per FR-015)
- `role` MUST be exactly 'student' or 'instructor'
- `sessionId` is nullable (null when not in a classroom)
- `currentClassroom` MUST match a valid classroom ID or be null

---

### 3. Participant (from Daily.co)
**Purpose**: Represents a participant within a Daily.co call
**Location**: Provided by `@daily-co/daily-react` hooks
**Lifecycle**: Created when user joins call, removed when user leaves

```typescript
/**
 * Daily.co participant object (simplified for our use case).
 * WHY: Daily.co provides this structure; we document relevant fields.
 * Full type from @daily-co/daily-js: DailyParticipant
 */
export interface Participant {
  /** Unique Daily session identifier */
  session_id: string;
  
  /** User's display name (from UserSession.name) */
  user_name: string;
  
  /** Whether this is the local user */
  local: boolean;
  
  /** Whether this user owns the room (not used in our app) */
  owner: boolean;
  
  /** Video and audio track states */
  tracks: {
    video: {
      state: TrackState;
      subscribed?: boolean;
    };
    audio: {
      state: TrackState;
      subscribed?: boolean;
    };
  };
}

/**
 * Possible states for audio/video tracks.
 * WHY: Determines if we render video tile or placeholder.
 */
export type TrackState = 
  | 'playable'      // Track is active and can be rendered
  | 'loading'       // Track is initializing
  | 'interrupted'   // Temporary network issue
  | 'off'           // User disabled camera/mic
  | 'blocked';      // Browser denied permissions
```

**WHY we don't modify this structure**:
Daily.co owns this data model. We consume it as-is through `useParticipants()` hook.

---

### 4. ClassroomState
**Purpose**: Aggregate state for a classroom (derived from Daily participants)
**Location**: `lib/types.ts`, computed in components
**Lifecycle**: Computed on-demand from Daily.co state

```typescript
/**
 * Aggregate state for a classroom.
 * WHY: Provides UI with participant count and capacity status
 * without exposing full participant details.
 */
export interface ClassroomState {
  /** Classroom identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Current number of participants */
  participantCount: number;
  
  /** Whether classroom has reached 10 participant limit (FR-016) */
  isAtCapacity: boolean;
  
  /** Whether anyone is currently in the classroom */
  isActive: boolean;
}
```

**Derivation Logic**:
```typescript
// WHY: Compute ClassroomState from Daily.co participants
// This keeps state synchronized with Daily's source of truth
function deriveClassroomState(
  config: ClassroomConfig,
  participants: Participant[]
): ClassroomState {
  return {
    id: config.id,
    name: config.name,
    participantCount: participants.length,
    isAtCapacity: participants.length >= config.maxParticipants,
    isActive: participants.length > 0,
  };
}
```

---

## API Types

### API Response: GET /api/rooms

```typescript
/**
 * Response from GET /api/rooms endpoint.
 * WHY: Provides lobby with list of all classrooms and their status.
 */
export interface RoomsResponse {
  classrooms: ClassroomSummary[];
}

/**
 * Summary of a classroom's current state.
 * WHY: Lighter payload than full ClassroomState for lobby display.
 */
export interface ClassroomSummary {
  id: string;
  name: string;
  participantCount: number;
  isAtCapacity: boolean;
}
```

### API Request/Response: POST /api/participants/[sessionId]/mute

```typescript
/**
 * Request body to mute a participant.
 * WHY: Instructor action to mute student (FR-009).
 */
export interface MuteParticipantRequest {
  /** Whether to mute (true) or unmute (false) */
  muted: boolean;
  
  /** Session ID of instructor making request (for authorization) */
  instructorSessionId: string;
}

/**
 * Response from mute operation.
 * WHY: Confirms action succeeded or provides error details.
 */
export interface MuteParticipantResponse {
  success: boolean;
  message?: string;
}
```

---

## Helper Types

### InstructorAction
**Purpose**: Type-safe instructor control actions

```typescript
/**
 * Actions available to instructors.
 * WHY: Enum prevents typos and documents available instructor actions.
 */
export type InstructorAction = 
  | 'mute-participant'
  | 'unmute-participant'
  | 'mute-all'           // Future enhancement
  | 'create-breakout';   // Future enhancement (FR-010 deferred)

/**
 * Payload for instructor actions.
 * WHY: Type-safe action dispatch pattern.
 */
export interface InstructorActionPayload {
  action: InstructorAction;
  targetSessionId?: string;  // For mute-participant
  breakoutConfig?: {         // For create-breakout (future)
    count: number;
    assignment: 'manual' | 'automatic';
  };
}
```

---

## Relationships

```
┌─────────────────┐
│ ClassroomConfig │ (1)
│   (Static)      │
└────────┬────────┘
         │
         │ contains
         │
         ▼
┌─────────────────┐     derived from     ┌──────────────┐
│ ClassroomState  │◄────────────────────│ Participant  │ (0..10)
│  (Computed)     │                      │ (from Daily) │
└─────────────────┘                      └──────┬───────┘
                                                │
                                                │ includes
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │ UserSession  │ (1)
                                         │ (Context)    │
                                         └──────────────┘

Legend:
- Static: Loaded from env vars, doesn't change
- Computed: Derived from other state
- Context: React Context Provider
- from Daily: Provided by Daily.co hooks
```

**Key Relationships**:
1. **ClassroomConfig → ClassroomState**: Config is static, State is computed from current participants
2. **Participant → UserSession**: Each participant has corresponding user session (name, role)
3. **ClassroomState → Participant**: State aggregates participant data

---

## Validation & Constraints

### Business Rules

| Entity | Field | Constraint | Validation |
|--------|-------|------------|------------|
| ClassroomConfig | maxParticipants | Always 10 | `config.maxParticipants === 10` |
| UserSession | name | Required, 1-50 chars | `name.length > 0 && name.length <= 50` |
| UserSession | role | Must be student/instructor | `role === 'student' \|\| role === 'instructor'` |
| ClassroomState | participantCount | 0-10 inclusive | `count >= 0 && count <= 10` |
| ClassroomState | isAtCapacity | True when count >= 10 | `count >= config.maxParticipants` |

### Type Guards

```typescript
/**
 * Type guard to check if user is an instructor.
 * WHY: Used to conditionally show instructor controls.
 */
export function isInstructor(session: UserSession): boolean {
  return session.role === 'instructor';
}

/**
 * Type guard to check if classroom is full.
 * WHY: Prevents joining when at capacity (FR-018).
 */
export function isClassroomFull(
  state: ClassroomState,
  config: ClassroomConfig
): boolean {
  return state.participantCount >= config.maxParticipants;
}

/**
 * Type guard to validate classroom ID.
 * WHY: Ensures URL params map to actual classrooms.
 */
export function isValidClassroomId(id: string): boolean {
  return /^cohort-[1-6]$/.test(id);
}
```

---

## State Flow Diagram

```
┌─────────────┐
│ Landing     │
│ (Enter Name)│
└──────┬──────┘
       │ name entered
       ▼
┌─────────────┐
│ Lobby       │◄──────────┐
│ (6 Cohorts) │           │ return to lobby
└──────┬──────┘           │
       │ select cohort    │
       ▼                  │
┌─────────────┐           │
│ Classroom   │───────────┘
│ (Video Feed)│
└─────────────┘
       │
       │ leave (last participant)
       ▼
   [Session Ends - FR-020]
```

**State Persistence**:
- **UserSession**: Stored in React Context (memory only, lost on refresh)
- **Participant List**: Managed by Daily.co, synced via `useParticipants()` hook
- **Classroom Config**: Loaded from env vars, never changes at runtime

**Future Enhancement**: Consider localStorage for UserSession persistence across refreshes

---

## TypeScript File Organization

```typescript
// lib/types.ts
// WHY: Single file for all type definitions (Constitutional Single File Preference)
// Organized by entity category for easy navigation

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface UserSession { /* ... */ }
export type UserRole = 'student' | 'instructor';

export interface ClassroomState { /* ... */ }
export interface ClassroomSummary { /* ... */ }

export type TrackState = /* ... */;
export interface Participant { /* ... */ }

// ============================================================================
// API CONTRACTS
// ============================================================================

export interface RoomsResponse { /* ... */ }
export interface MuteParticipantRequest { /* ... */ }
export interface MuteParticipantResponse { /* ... */ }

// ============================================================================
// HELPER TYPES
// ============================================================================

export type InstructorAction = /* ... */;
export interface InstructorActionPayload { /* ... */ }

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

export function isInstructor(session: UserSession): boolean { /* ... */ }
export function isClassroomFull(/* ... */): boolean { /* ... */ }
export function isValidClassroomId(id: string): boolean { /* ... */ }
```

**WHY Single File**:
- Easy to find all types (newcomer-friendly)
- Organized by logical sections with comments
- Avoids excessive file fragmentation
- Maintains constitutional single-file preference

---

## Next Steps

1. ✅ Data model defined
2. → Create API contracts (OpenAPI schemas)
3. → Generate quickstart documentation
4. → Write contract tests

**Phase 1 Progress**: Data model complete, moving to contracts/

