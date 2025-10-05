// TypeScript type definitions for Overcast Video Classroom Application
// Based on data-model.md - Phase 1 design artifacts
// WHY: Type safety prevents runtime errors, type guards validate business rules

// ============================================================================
// CORE ENTITIES
// ============================================================================

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

// ============================================================================
// API CONTRACTS
// ============================================================================

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
 * Request body to mute all participants in a classroom.
 * WHY: Instructor action to mute all students at once (FR-009).
 */
export interface MuteAllParticipantsRequest {
  /** Whether to mute (true) or unmute (false) */
  muted: boolean;
  
  /** Session ID of instructor making request (for authorization) */
  instructorSessionId: string;
  
  /** Classroom ID (1-6) */
  classroomId: string;
  
  /** Whether to exclude instructors from mute action (default: true) */
  excludeInstructors?: boolean;
}

/**
 * Request body to join a classroom.
 * WHY: Student/instructor action to join a classroom (FR-008).
 */
export interface JoinRoomRequest {
  /** User's display name */
  name: string;
  
  /** User's role (student or instructor) */
  role: 'student' | 'instructor';
}

/**
 * Request body to leave a classroom.
 * WHY: Student/instructor action to leave a classroom (FR-008).
 */
export interface LeaveRoomRequest {
  /** Session ID of the user leaving */
  sessionId: string;
}

/**
 * Connection state for Daily.co video calls.
 * WHY: Track connection status for UI feedback.
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Classroom configuration for video calls.
 * WHY: Core classroom data needed for Daily.co integration.
 */
export interface Classroom {
  /** Unique classroom identifier */
  id: string;
  
  /** Display name of the classroom */
  name: string;
  
  /** Daily.co room URL for video calls */
  dailyRoomUrl: string;
  
  /** Maximum number of participants allowed */
  maxCapacity: number;
}

/**
 * Response from mute operation.
 * WHY: Confirms action succeeded or provides error details.
 */
export interface MuteParticipantResponse {
  success: boolean;
  message?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

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

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

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

/**
 * Validates user name meets requirements.
 * WHY: Enforces FR-015 (1-50 character name requirement).
 */
export function isValidUserName(name: string): boolean {
  return name.length >= 1 && name.length <= 50;
}

/**
 * Derives ClassroomState from Daily.co participants.
 * WHY: Computes aggregate state from Daily's source of truth.
 */
export function deriveClassroomState(
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
