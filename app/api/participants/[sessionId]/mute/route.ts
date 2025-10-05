/**
 * POST /api/participants/[sessionId]/mute endpoint - Mute/unmute a participant
 * 
 * Contract: participants-api.yaml
 * WHY: Instructors need the ability to mute disruptive participants (FR-009, FR-012).
 * This is a "request to mute" rather than forced mute - participants can unmute themselves (FR-019).
 * 
 * Request Body:
 * - muted: boolean (required) - true to mute, false to unmute
 * - instructorSessionId: string (required) - session ID of instructor making request
 * 
 * Responses:
 * - 200: Success with { success: true, message?: string }
 * - 400: Bad request (missing/invalid fields)
 * - 403: Forbidden (non-instructor attempting to mute)
 * - 404: Participant not found
 * - 500: Server error
 * 
 * MVP Implementation Notes:
 * - Instructor validation is stubbed (always allows for local dev)
 * - Participant lookup is stubbed (assumes participant exists)
 * - In production, this would integrate with Daily.co API and participant database
 */

import { NextResponse } from 'next/server';

// Request/Response types matching OpenAPI contract
interface MuteParticipantRequest {
  muted: boolean;
  instructorSessionId: string;
}

interface MuteParticipantResponse {
  success: boolean;
  message?: string;
}

interface ErrorResponse {
  success: boolean;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Route params structure for Next.js 15 App Router
interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * Validate UUID format (basic check)
 * WHY: Session IDs should follow UUID pattern for security
 */
function isValidSessionId(sessionId: string): boolean {
  // Allow flexible format for MVP - can be UUID or any reasonable session identifier
  // In production, enforce strict UUID validation
  return sessionId && sessionId.length > 0 && sessionId.length < 256;
}

/**
 * Verify instructor permissions (MVP stub)
 * WHY: Only instructors should be able to mute participants (FR-012)
 * 
 * MVP: Returns true (trusts client-provided instructor role)
 * Production: Would query participant database to verify instructor role
 */
async function verifyInstructorPermissions(
  instructorSessionId: string
): Promise<boolean> {
  // Validate instructor session ID format
  if (!isValidSessionId(instructorSessionId)) {
    return false;
  }

  // MVP: Trust the client-provided instructor session ID
  // In production, this would:
  // 1. Query participant database by instructorSessionId
  // 2. Verify the participant has role='instructor'
  // 3. Return true only if verified as instructor
  
  return true;
}

/**
 * Check if participant exists (MVP stub)
 * WHY: Should return 404 if target participant doesn't exist
 * 
 * MVP: Returns true (assumes participant exists)
 * Production: Would query participant database or Daily.co API
 */
async function participantExists(sessionId: string): Promise<boolean> {
  // MVP: Assume participant exists for local development
  // In production, this would:
  // 1. Query participant database by sessionId
  // 2. OR call Daily.co API to check if participant is in meeting
  // 3. Return true only if participant found
  
  return true;
}

/**
 * Perform mute action via Daily.co (MVP stub)
 * WHY: This is where the actual muting would happen via Daily.co API
 * 
 * MVP: Returns success (actual muting handled client-side via Daily React hooks)
 * Production: Would call Daily.co REST API to update participant state
 */
async function muteParticipantViaDaily(
  sessionId: string,
  muted: boolean
): Promise<boolean> {
  // MVP: Log the action but don't call Daily.co API
  // Actual muting happens client-side via useParticipants() hook
  console.log(`[Mute Request] Session: ${sessionId}, Muted: ${muted}`);
  
  // In production, this would call Daily.co REST API:
  // POST https://api.daily.co/v1/meetings/{meetingId}/participants/{participantId}
  // Body: { updateParticipant: { setAudio: !muted } }
  
  return true;
}

/**
 * POST /api/participants/[sessionId]/mute
 * Mute or unmute a participant
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    // Extract sessionId from route params (Next.js 15 requires await)
    const { sessionId } = await params;

    // Validate target session ID format
    if (!isValidSessionId(sessionId)) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Invalid participant session ID',
        code: 'INVALID_SESSION_ID'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Parse and validate request body
    let body: MuteParticipantRequest;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate required field: muted (must be boolean)
    if (typeof body.muted !== 'boolean') {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Muted field is required and must be a boolean',
        code: 'INVALID_MUTED_FIELD'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate required field: instructorSessionId (must be string)
    if (!body.instructorSessionId || typeof body.instructorSessionId !== 'string') {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Instructor session ID is required',
        code: 'MISSING_INSTRUCTOR_ID'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Verify instructor permissions
    const hasPermission = await verifyInstructorPermissions(body.instructorSessionId);
    if (!hasPermission) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Only instructors can mute participants',
        code: 'INSUFFICIENT_PERMISSIONS'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Check if participant exists
    const exists = await participantExists(sessionId);
    if (!exists) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Participant not found in classroom',
        code: 'PARTICIPANT_NOT_FOUND'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Perform mute action via Daily.co API
    const success = await muteParticipantViaDaily(sessionId, body.muted);
    if (!success) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Failed to mute participant',
        code: 'SERVER_ERROR'
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Return success response matching contract
    const successResponse: MuteParticipantResponse = {
      success: true,
      message: `Participant ${body.muted ? 'muted' : 'unmuted'} successfully`
    };
    
    return NextResponse.json(successResponse, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    // Handle unexpected errors
    console.error('[Error] POST /api/participants/[sessionId]/mute:', error);
    
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Internal server error while processing mute request',
      code: 'SERVER_ERROR'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
