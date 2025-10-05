'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, use } from 'react';
import Classroom from '@/app/components/Classroom';
import { UserSession, isValidClassroomId } from '@/lib/types';
import { getClassroomById } from '@/lib/daily-config';
import { ERROR_MESSAGES } from '@/lib/constants';

/**
 * Loading fallback component for classroom page
 * Displayed while the Classroom component initializes
 */
function LoadingClassroom() {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-white text-lg mb-2">Loading classroom...</p>
        <p className="text-gray-400 text-sm">Please wait...</p>
      </div>
    </div>
  );
}

/**
 * Error component for invalid classroom
 */
function InvalidClassroom({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-4">Classroom Not Found</h1>
        <p className="text-gray-400 mb-6">
          The classroom "{classroomId}" does not exist. Please select a valid classroom from the lobby.
        </p>
        <button
          onClick={() => router.push('/lobby')}
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-black font-medium rounded-lg transition-colors"
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
}

/**
 * Classroom page content component
 * Separated to allow Suspense boundary for useSearchParams()
 */
function ClassroomPageContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Unwrap the params Promise using React.use()
  // WHY: Next.js 15+ wraps dynamic route params in a Promise for better streaming support.
  // React.use() suspends the component until the params are available.
  const { id } = use(params);

  // Validate classroom ID
  if (!isValidClassroomId(id)) {
    return <InvalidClassroom classroomId={id} />;
  }

  // Get classroom configuration
  const classroomConfig = getClassroomById(id);
  if (!classroomConfig) {
    return <InvalidClassroom classroomId={id} />;
  }

  // Extract user data from URL parameters
  // WHY: We pass user data via URL params from the lobby page.
  // This approach works for local development without requiring authentication.
  // In production, this would be replaced with proper session management.
  const userName = searchParams.get('name') || 'Anonymous';
  const userRole = (searchParams.get('role') || 'student') as 'student' | 'instructor';
  const sessionId = searchParams.get('sessionId') || crypto.randomUUID();

  // Construct user session object
  const userSession: UserSession = {
    name: userName,
    role: userRole,
    sessionId: sessionId,
    currentClassroom: id
  };

  /**
   * Handle leaving the classroom
   * 
   * WHY: When a user clicks "Return to Main Lobby", we need to:
   * 1. Disconnect from Daily.co (handled by Classroom component)
   * 2. Navigate back to the main lobby
   * 
   * The Classroom component will clean up the Daily connection
   * before calling this handler.
   */
  const handleLeaveClassroom = () => {
    router.push('/lobby');
  };

  return (
    <div className="h-screen bg-black">
      {/* Classroom Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {classroomConfig.name}: Class Session
            </h1>
            <p className="text-sm text-gray-400">
              Classroom ID: {id} • Role: {userRole}
            </p>
          </div>
          
          <button
            onClick={handleLeaveClassroom}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-medium rounded-lg transition-colors"
          >
            Return to Main Lobby
          </button>
        </div>
      </div>

      {/* Classroom Component */}
      <Classroom 
        classroomId={id}
        userSession={userSession}
        onLeave={handleLeaveClassroom}
      />
    </div>
  );
}

/**
 * Dynamic classroom page component
 * 
 * This page is accessed via /classroom/[id] where [id] is the classroom ID.
 * It renders the Classroom component which handles:
 * - Daily.co video integration via DailyProvider
 * - Real-time participant management using Daily React hooks
 * - Video feed display and controls
 * - Instructor controls (if user role is instructor)
 * 
 * User data is passed via URL search parameters from the lobby page.
 * 
 * @param params - Next.js dynamic route params containing classroom ID (Promise in Next.js 15+)
 */
export default function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoadingClassroom />}>
      <ClassroomPageContent params={params} />
    </Suspense>
  );
}
