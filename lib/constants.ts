// Application constants for Overcast Video Classroom
// Centralized constants following constitutional single-file preference
// WHY: Centralized constants prevent magic numbers, easy to update

/**
 * Maximum number of participants allowed per classroom.
 * WHY: Based on clarification session 2025-10-05 (10 for small group sessions).
 * Requirement FR-016.
 */
export const MAX_PARTICIPANTS_PER_ROOM = 10;

/**
 * Array of classroom IDs matching the cohort-[1-6] pattern.
 * WHY: Used for validation and iteration over all 6 classrooms.
 * Must match environment variable naming: NEXT_PUBLIC_DAILY_ROOM_1 through ROOM_6.
 */
export const CLASSROOM_IDS = [
  'cohort-1',
  'cohort-2',
  'cohort-3',
  'cohort-4',
  'cohort-5',
  'cohort-6',
] as const;

/**
 * Display names for each classroom.
 * WHY: Human-readable names shown in lobby UI.
 * Index matches CLASSROOM_IDS (0='Cohort 1', 1='Cohort 2', etc.)
 */
export const CLASSROOM_NAMES = [
  'Cohort 1',
  'Cohort 2',
  'Cohort 3',
  'Cohort 4',
  'Cohort 5',
  'Cohort 6',
] as const;

/**
 * Total number of classrooms available in the application.
 * WHY: Derived from requirement FR-001 (display 6 classrooms).
 * Used for bounds checking and UI layout.
 */
export const TOTAL_CLASSROOMS = 6;

/**
 * Application name displayed in branding and metadata.
 * WHY: Consistent branding across all pages.
 */
export const APP_NAME = 'Overcast';

/**
 * Branding text displayed in footer.
 * WHY: Attribution to Overclock Accelerator per design requirements.
 */
export const BRAND_TEXT = 'Powered by the Overclock Accelerator';

/**
 * User name validation constraints.
 * WHY: Enforces FR-015 (name entry requirement with 1-50 character limit).
 */
export const USER_NAME_MIN_LENGTH = 1;
export const USER_NAME_MAX_LENGTH = 50;

/**
 * Default role for users when they first enter the lobby.
 * WHY: Most users will be students; instructors opt-in via toggle.
 */
export const DEFAULT_USER_ROLE = 'student' as const;

/**
 * Route paths for the application.
 * WHY: Centralized routing constants prevent typos in navigation.
 */
export const ROUTES = {
  HOME: '/',
  LOBBY: '/lobby',
  CLASSROOM: '/classroom',
  // Dynamic route pattern: /classroom/cohort-1, /classroom/cohort-2, etc.
} as const;

/**
 * API endpoint paths.
 * WHY: Centralized API paths for consistent client-server communication.
 */
export const API_ENDPOINTS = {
  ROOMS: '/api/rooms',
  PARTICIPANTS_MUTE: (sessionId: string) => `/api/participants/${sessionId}/mute`,
} as const;

/**
 * Local storage keys for persisting user session.
 * WHY: Allows user name/role to persist across page refreshes.
 */
export const STORAGE_KEYS = {
  USER_SESSION: 'overcast_user_session',
  USER_NAME: 'overcast_user_name',
  USER_ROLE: 'overcast_user_role',
} as const;

/**
 * UI animation and timing constants.
 * WHY: Consistent timing creates polished user experience.
 */
export const UI_TIMINGS = {
  TRANSITION_FAST: 200,      // ms - button hover, quick transitions
  TRANSITION_NORMAL: 300,    // ms - card hover, moderate transitions
  TRANSITION_SLOW: 500,      // ms - page transitions, slow animations
  TOAST_DURATION: 3000,      // ms - notification display time
  LOADING_DELAY: 500,        // ms - delay before showing loading spinner
} as const;

/**
 * Theme color constants (matches globals.css).
 * WHY: JavaScript access to theme colors for dynamic styling.
 */
export const THEME_COLORS = {
  BACKGROUND: '#000000',     // Black
  FOREGROUND: '#FFFFFF',     // White
  PRIMARY: '#00FFD1',        // Neon teal
  PRIMARY_DARK: '#00E6BC',   // Darker teal for hover states
  SECONDARY: '#FFBD17',      // Accent orange/yellow
  ACCENT: '#1a1a1a',         // Dark gray for cards
  BORDER: '#333333',         // Border color
  MUTED: '#666666',          // Muted text
  SUCCESS: '#00FFD1',        // Success messages (teal)
  WARNING: '#FFBD17',        // Warning messages (orange)
  ERROR: '#FF4444',          // Error messages (red)
} as const;

/**
 * Video quality settings for Daily.co.
 * WHY: Optimized for 10-participant classrooms, balances quality and bandwidth.
 */
export const VIDEO_SETTINGS = {
  MAX_WIDTH: 1280,
  MAX_HEIGHT: 720,
  MAX_FRAMERATE: 30,
} as const;

/**
 * Audio settings for Daily.co.
 * WHY: Enhanced audio quality for classroom environment.
 */
export const AUDIO_SETTINGS = {
  ECHO_CANCELLATION: true,
  NOISE_SUPPRESSION: true,
  AUTO_GAIN_CONTROL: true,
} as const;

/**
 * Connection timeout settings.
 * WHY: Prevents hanging connections, provides timely feedback to users.
 */
export const CONNECTION_TIMEOUTS = {
  DAILY_CONNECTION: 10000,   // ms - 10 seconds to connect to Daily.co
  DAILY_RECONNECT: 5000,     // ms - 5 seconds between reconnect attempts
  API_REQUEST: 8000,         // ms - 8 seconds for API requests
} as const;

/**
 * Error messages for user-facing feedback.
 * WHY: Consistent, helpful error messages improve UX.
 */
export const ERROR_MESSAGES = {
  CLASSROOM_FULL: 'This classroom is at capacity (10 participants). Please try another classroom.',
  CONNECTION_FAILED: 'Failed to connect to the classroom. Please check your internet connection.',
  INVALID_CLASSROOM: 'Classroom not found. Please select a valid classroom from the lobby.',
  INVALID_NAME: 'Please enter a name between 1 and 50 characters.',
  PERMISSION_DENIED: 'Camera/microphone permission denied. Please allow access to join the classroom.',
  MUTE_FAILED: 'Failed to mute participant. Please try again.',
  INSTRUCTOR_ONLY: 'This action is only available to instructors.',
} as const;

/**
 * Success messages for user feedback.
 * WHY: Positive feedback confirms actions completed successfully.
 */
export const SUCCESS_MESSAGES = {
  JOINED_CLASSROOM: 'Successfully joined classroom',
  LEFT_CLASSROOM: 'Left classroom',
  PARTICIPANT_MUTED: 'Participant muted',
  PARTICIPANT_UNMUTED: 'Participant unmuted',
} as const;

/**
 * Loading messages shown during async operations.
 * WHY: Informs users what's happening during wait times.
 */
export const LOADING_MESSAGES = {
  CONNECTING: 'Connecting to classroom...',
  INITIALIZING_VIDEO: 'Initializing video feed...',
  LOADING_CLASSROOMS: 'Loading classrooms...',
  JOINING: 'Joining classroom...',
  LEAVING: 'Leaving classroom...',
} as const;
