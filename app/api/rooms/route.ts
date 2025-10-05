/**
 * GET /api/rooms endpoint - List all available classrooms
 * 
 * Returns configuration and current status for all 6 classrooms (Cohort 1-6).
 * WHY: Lobby needs this data to display classroom grid with participant counts.
 * 
 * Contract: specs/003-overcast-video-classroom/contracts/rooms-api.yaml
 * Functional Requirements: FR-001, FR-011, FR-016, FR-018
 */

import { NextResponse } from 'next/server';
import { CLASSROOM_IDS, CLASSROOM_NAMES, MAX_PARTICIPANTS_PER_ROOM } from '@/lib/constants';
import type { RoomsResponse, ClassroomSummary } from '@/lib/types';

/**
 * GET handler for /api/rooms endpoint
 * 
 * Returns all 6 classrooms with their current status:
 * - id: Classroom identifier (cohort-1 through cohort-6)
 * - name: Display name (Cohort 1 through Cohort 6)
 * - participantCount: Current number of participants (0 for MVP)
 * - isAtCapacity: Whether room is at 10 participant limit (false for MVP)
 * 
 * WHY: MVP implementation stubs participant counts to 0 since we don't have
 * live Daily.co API integration yet. In production, this would:
 * 1. Query Daily.co REST API for each room's current participant count
 * 2. Calculate isAtCapacity based on actual counts vs MAX_PARTICIPANTS_PER_ROOM
 * 3. Cache results for ~5 seconds to avoid excessive API calls
 * 
 * Example production implementation:
 * ```typescript
 * const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
 *   headers: { 'Authorization': `Bearer ${process.env.DAILY_API_KEY}` }
 * });
 * const data = await response.json();
 * const participantCount = data.config?.max_participants_active || 0;
 * ```
 */
export async function GET(): Promise<NextResponse<RoomsResponse>> {
  try {
    // Build classroom summaries for all 6 classrooms
    // WHY: Map constants to ClassroomSummary objects matching API contract
    const classrooms: ClassroomSummary[] = CLASSROOM_IDS.map((id, index) => {
      // MVP: Stub participantCount to 0
      // Future: Query Daily.co API for live participant counts
      const participantCount = 0;
      
      // Calculate isAtCapacity based on participant count
      // WHY: FR-018 requires preventing joins when at capacity (10 participants)
      const isAtCapacity = participantCount >= MAX_PARTICIPANTS_PER_ROOM;

      return {
        id,
        name: CLASSROOM_NAMES[index],
        participantCount,
        isAtCapacity,
      };
    });

    // Return response matching RoomsResponse schema
    const response: RoomsResponse = {
      classrooms,
    };

    return NextResponse.json(response);
  } catch (error) {
    // Log error for debugging but don't expose internal details to client
    console.error('[API /api/rooms] Error generating classroom list:', error);
    
    // Return empty classrooms array on error
    return NextResponse.json({
      classrooms: []
    });
  }
}
