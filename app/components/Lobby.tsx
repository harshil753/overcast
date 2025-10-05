'use client';

/**
 * Lobby Component
 * 
 * Main navigation hub where users select a classroom and role.
 * WHY: FR-001 requires displaying 6 available classrooms in a lobby view.
 * Users can switch between student and instructor roles before joining.
 * 
 * Layout: Grid of 6 classroom cards (3 columns x 2 rows on desktop)
 * Features:
 * - Student/Instructor mode toggle
 * - Classroom cards showing name, participant count, capacity
 * - Disabled state for full classrooms (10 max per FR-016)
 * - Navigation to classroom on card click
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ClassroomSummary, UserRole } from '@/lib/types';
import { CLASSROOM_IDS, CLASSROOM_NAMES, APP_NAME, API_ENDPOINTS } from '@/lib/constants';
import { useUserSession } from './UserSessionProvider';

// ============================================================================
// TYPES
// ============================================================================

interface LobbyProps {
  /** Optional initial classroom data (for SSR or testing) */
  initialClassrooms?: ClassroomSummary[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Lobby({ initialClassrooms }: LobbyProps) {
  const router = useRouter();
  const { session, setRole, setCurrentClassroom } = useUserSession();
  
  // State
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>(initialClassrooms || []);
  const [isLoading, setIsLoading] = useState(!initialClassrooms);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(session?.role || 'student');

  /**
   * Fetch classroom data from API
   * WHY: Displays real-time participant counts and capacity status
   */
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(API_ENDPOINTS.ROOMS);
        if (!response.ok) {
          throw new Error(`Failed to fetch classrooms: ${response.statusText}`);
        }
        
        const data = await response.json();
        setClassrooms(data.classrooms);
      } catch (err) {
        console.error('[Lobby] Error fetching classrooms:', err);
        setError('Failed to load classrooms. Please refresh the page.');
        
        // Fallback: Show empty classrooms
        const fallbackClassrooms: ClassroomSummary[] = CLASSROOM_IDS.map((id, index) => ({
          id,
          name: CLASSROOM_NAMES[index],
          participantCount: 0,
          isAtCapacity: false,
        }));
        setClassrooms(fallbackClassrooms);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassrooms();
    
    // Refresh every 10 seconds for live participant counts
    const interval = setInterval(fetchClassrooms, 10000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Handle role toggle
   * WHY: FR-006 requires users to select role before joining classroom
   */
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setRole(role);
  };

  /**
   * Handle classroom join
   * WHY: FR-002 requires navigation to classroom on card click
   */
  const handleJoinClassroom = (classroomId: string) => {
    // Update session with selected classroom
    setCurrentClassroom(classroomId);
    
    // Navigate to classroom page
    // WHY: Next.js 15 App Router pattern for dynamic routes
    router.push(`/classroom/${classroomId}`);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Branding */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-white mb-2">
            {APP_NAME}
          </h1>
          <p className="text-gray-400 text-sm">
            Select a classroom to join
          </p>
        </header>

        {/* Role Toggle */}
        <div className="mb-8 flex justify-center">
          <div 
            className="inline-flex bg-[#1a1a1a] border border-[#333333] rounded-lg p-1"
            role="group"
            aria-label="Role selection"
          >
            <button
              onClick={() => handleRoleChange('student')}
              data-testid="role-toggle-student"
              aria-pressed={selectedRole === 'student'}
              className={`
                px-6 py-2 rounded-md font-medium transition-all duration-200
                ${
                  selectedRole === 'student'
                    ? 'bg-[#00FFD1] text-black'
                    : 'text-gray-400 hover:text-white'
                }
              `}
            >
              Student
            </button>
            <button
              onClick={() => handleRoleChange('instructor')}
              data-testid="role-toggle-instructor"
              aria-pressed={selectedRole === 'instructor'}
              className={`
                px-6 py-2 rounded-md font-medium transition-all duration-200
                ${
                  selectedRole === 'instructor'
                    ? 'bg-[#00FFD1] text-black'
                    : 'text-gray-400 hover:text-white'
                }
              `}
            >
              Instructor
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && classrooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#00FFD1] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading classrooms...</p>
          </div>
        ) : (
          <>
            {/* Classroom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((classroom) => (
                <ClassroomCard
                  key={classroom.id}
                  classroom={classroom}
                  onJoin={handleJoinClassroom}
                  role={selectedRole}
                />
              ))}
            </div>

            {/* Info Footer */}
            <div className="mt-8 text-center text-gray-500 text-sm">
              <p>
                {selectedRole === 'instructor' 
                  ? 'Instructors can mute participants and manage the classroom' 
                  : 'Join as a student to participate in the classroom'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CLASSROOM CARD COMPONENT
// ============================================================================

interface ClassroomCardProps {
  classroom: ClassroomSummary;
  onJoin: (classroomId: string) => void;
  role: UserRole;
}

function ClassroomCard({ classroom, onJoin, role }: ClassroomCardProps) {
  const { id, name, participantCount, isAtCapacity } = classroom;

  return (
    <button
      onClick={() => onJoin(id)}
      disabled={isAtCapacity}
      data-classroom-id={id}
      className={`
        bg-[#1a1a1a] border rounded-xl p-6 text-left
        transition-all duration-300
        ${
          isAtCapacity
            ? 'border-gray-700 opacity-50 cursor-not-allowed'
            : 'border-[#333333] hover:border-[#00FFD1] hover:shadow-lg hover:shadow-[#00FFD1]/10 hover:-translate-y-1'
        }
      `}
      aria-label={`Join ${name}`}
    >
      {/* Classroom Name */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">
          {name}
        </h3>
        <div className={`
          w-3 h-3 rounded-full
          ${participantCount > 0 ? 'bg-[#00FFD1]' : 'bg-gray-600'}
        `} />
      </div>

      {/* Participant Count */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Participants</span>
          <span className="font-mono">{participantCount}/10</span>
        </div>
        
        {/* Capacity Bar */}
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className={`
              h-2 rounded-full transition-all duration-300
              ${
                isAtCapacity
                  ? 'bg-red-500'
                  : participantCount >= 7
                  ? 'bg-yellow-500'
                  : 'bg-[#00FFD1]'
              }
            `}
            style={{ width: `${(participantCount / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Join Button */}
      <div className={`
        py-2 px-4 rounded-lg text-center font-medium text-sm
        ${
          isAtCapacity
            ? 'bg-gray-800 text-gray-500'
            : 'bg-[#00FFD1]/10 text-[#00FFD1]'
        }
      `}>
        {isAtCapacity ? 'Full' : `Join as ${role === 'instructor' ? 'Instructor' : 'Student'}`}
      </div>

      {/* Status Badge */}
      {participantCount > 0 && !isAtCapacity && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          Active session
        </div>
      )}
    </button>
  );
}

// Default export for easier imports
export default Lobby;
