/**
 * GET /api/rooms/[roomId] endpoint - Get specific classroom details
 * 
 * Returns detailed information about a specific classroom including:
 * - Participant list with roles
 * - Current capacity
 * - Active status
 * 
 * WHY: Used when viewing classroom details or before joining.
 * Validates that the classroom ID is valid (1-6) and returns
 * current state from Daily.co API.
 */

import { NextResponse } from 'next/server';
import { getClassroomById } from '@/lib/daily-config';

interface RouteParams {
  params: Promise<{
    roomId: string;
  }>;
}

/**
 * Fetch detailed room information from Daily.co API
 * Includes participant list and room configuration
 */
async function fetchDailyRoomDetails(roomUrl: string) {
  const roomName = roomUrl.split('/').pop();
  
  try {
    // For now, return mock data since we don't have Daily API integration set up
    // In production, this would fetch real-time data from Daily.co API
    return {
      participants: [],
      instructors: [],
      students: [],
      participantCount: 0,
      isActive: false
    };
  } catch (error) {
    console.error(`Error fetching room details for ${roomName}:`, error);
    throw error;
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { roomId } = await params;

    // Validate room ID (must be 1-6)
    if (!roomId || !['1', '2', '3', '4', '5', '6'].includes(roomId)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid classroom ID. Must be between 1 and 6.',
          code: 'INVALID_ROOM_ID'
        },
        { status: 400 }
      );
    }

    // Get room configuration
    const room = getClassroomById(`cohort-${roomId}`);
    
    if (!room) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: `Classroom ${roomId} not found`,
          code: 'ROOM_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Fetch real-time room details from Daily.co
    const details = await fetchDailyRoomDetails(room.dailyRoomUrl);

    // Construct response matching OpenAPI schema
    return NextResponse.json({
      id: room.id,
      name: room.name,
      participantCount: details.participantCount,
      isActive: details.isActive,
      maxCapacity: room.maxCapacity,
      instructors: details.instructors,
      students: details.students,
      createdAt: new Date().toISOString() // Would track actual creation time in production
    });
  } catch (error) {
    console.error('Error in GET /api/rooms/[roomId]:', error);
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch classroom details'
      },
      { status: 500 }
    );
  }
}

