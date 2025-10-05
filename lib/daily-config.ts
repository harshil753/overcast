// Daily.co room configuration for Overcast Video Classroom Application
// Manages the 6 pre-defined Daily room URLs for local development
// WHY: Single source of truth for classroom configuration, environment-based

import { Classroom } from './types';
import { CLASSROOM_NAMES, MAX_PARTICIPANTS_PER_ROOM } from './constants';

/**
 * Validates that all required Daily.co room environment variables are set
 * WHY: Fail fast with helpful error messages rather than runtime errors
 */
function validateEnvironmentVariables(): void {
  const requiredVars = [
    'NEXT_PUBLIC_DAILY_ROOM_1',
    'NEXT_PUBLIC_DAILY_ROOM_2',
    'NEXT_PUBLIC_DAILY_ROOM_3',
    'NEXT_PUBLIC_DAILY_ROOM_4',
    'NEXT_PUBLIC_DAILY_ROOM_5',
    'NEXT_PUBLIC_DAILY_ROOM_6',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(
      '⚠️ Missing environment variables (using fallback URLs):\n' +
      missingVars.map(v => `  - ${v}`).join('\n') +
      '\n\nFor production, set these in your .env.local file.' +
      '\nSee env.example for the expected format.'
    );
    // Always use fallback URLs in development
    console.warn('⚠️ Using fallback Daily.co URLs for development');
  }
}

// Validate environment variables on module load
validateEnvironmentVariables();

/**
 * Array of all 6 classroom configurations
 * Maps environment variables to Classroom objects with proper typing
 * WHY: Type-safe configuration that components can import and use
 */
export const CLASSROOMS: Classroom[] = [
  {
    id: 'cohort-1',
    name: CLASSROOM_NAMES[0],
    dailyRoomUrl: process.env.NEXT_PUBLIC_DAILY_ROOM_1 || 'https://overcast.daily.co/cohort-1',
    maxCapacity: MAX_PARTICIPANTS_PER_ROOM,
  },
  {
    id: 'cohort-2',
    name: CLASSROOM_NAMES[1],
    dailyRoomUrl: process.env.NEXT_PUBLIC_DAILY_ROOM_2 || 'https://overcast.daily.co/cohort-2',
    maxCapacity: MAX_PARTICIPANTS_PER_ROOM,
  },
  {
    id: 'cohort-3',
    name: CLASSROOM_NAMES[2],
    dailyRoomUrl: process.env.NEXT_PUBLIC_DAILY_ROOM_3 || 'https://overcast.daily.co/cohort-3',
    maxCapacity: MAX_PARTICIPANTS_PER_ROOM,
  },
  {
    id: 'cohort-4',
    name: CLASSROOM_NAMES[3],
    dailyRoomUrl: process.env.NEXT_PUBLIC_DAILY_ROOM_4 || 'https://overcast.daily.co/cohort-4',
    maxCapacity: MAX_PARTICIPANTS_PER_ROOM,
  },
  {
    id: 'cohort-5',
    name: CLASSROOM_NAMES[4],
    dailyRoomUrl: process.env.NEXT_PUBLIC_DAILY_ROOM_5 || 'https://overcast.daily.co/cohort-5',
    maxCapacity: MAX_PARTICIPANTS_PER_ROOM,
  },
  {
    id: 'cohort-6',
    name: CLASSROOM_NAMES[5],
    dailyRoomUrl: process.env.NEXT_PUBLIC_DAILY_ROOM_6 || 'https://overcast.daily.co/cohort-6',
    maxCapacity: MAX_PARTICIPANTS_PER_ROOM,
  },
];

/**
 * Get a specific classroom configuration by ID
 * WHY: Validates classroom ID and returns undefined for invalid IDs
 * 
 * @param id - Classroom ID (1-6)
 * @returns Classroom config or undefined if not found
 */
export function getClassroomById(id: string): Classroom | undefined {
  return CLASSROOMS.find(classroom => classroom.id === id);
}

/**
 * Get all classroom IDs
 * WHY: Useful for validation and iteration
 */
export function getAllClassroomIds(): string[] {
  return CLASSROOMS.map(c => c.id);
}

/**
 * Get all Daily room URLs
 * WHY: Useful for batch operations or validation
 */
export function getAllDailyRoomUrls(): string[] {
  return CLASSROOMS.map(c => c.dailyRoomUrl);
}
