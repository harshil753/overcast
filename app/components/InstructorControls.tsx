'use client';

import React, { useState, useCallback } from 'react';
import { useParticipantIds, useParticipantProperty } from '@daily-co/daily-react';
import { API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';

/**
 * InstructorControls Component
 * 
 * Provides instructor-only controls for classroom management.
 * WHY: Instructors need controls to manage participants (mute/unmute)
 * 
 * Features:
 * - Displays list of all participants (excluding instructor)
 * - Mute/unmute buttons for each participant
 * - Audio/video state indicators
 * - Error handling for failed mute operations
 * 
 * Props:
 * - instructorSessionId: Session ID of the instructor (for API authorization)
 * - classroomId: Current classroom ID
 * - onMuteParticipant?: Optional callback when mute action occurs
 */
interface InstructorControlsProps {
  instructorSessionId: string;
  classroomId: string;
  onMuteParticipant?: (sessionId: string, muted: boolean) => void;
}

export default function InstructorControls({
  instructorSessionId,
  classroomId,
  onMuteParticipant
}: InstructorControlsProps) {
  // Get participant IDs from Daily.co hook
  const participantIds = useParticipantIds();
  
  // Local state for UI feedback
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Filters out the local instructor from the participant list.
   * WHY: Instructor shouldn't see mute control for themselves
   */
  const studentParticipantIds = participantIds.filter(
    (id: string) => id !== 'local' // Filter out local participant
  );

  /**
   * Handles mute/unmute action for a participant.
   * WHY: Makes API call to mute participant and provides user feedback
   */
  const handleMuteParticipant = useCallback(async (
    participantSessionId: string,
    currentMutedState: boolean
  ) => {
    const newMutedState = !currentMutedState;
    
    // Set loading state for this participant
    setLoadingStates(prev => ({
      ...prev,
      [participantSessionId]: true
    }));
    
    // Clear previous messages
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        API_ENDPOINTS.PARTICIPANTS_MUTE(participantSessionId),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            muted: newMutedState,
            instructorSessionId: instructorSessionId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || ERROR_MESSAGES.MUTE_FAILED);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.MUTE_FAILED);
      }

      // Show success message
      setSuccessMessage(
        newMutedState 
          ? SUCCESS_MESSAGES.PARTICIPANT_MUTED 
          : SUCCESS_MESSAGES.PARTICIPANT_UNMUTED
      );

      // Call optional callback
      if (onMuteParticipant) {
        onMuteParticipant(participantSessionId, newMutedState);
      }

    } catch (error) {
      console.error('Failed to mute participant:', error);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : ERROR_MESSAGES.MUTE_FAILED
      );
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({
        ...prev,
        [participantSessionId]: false
      }));
    }
  }, [instructorSessionId, onMuteParticipant]);

  // Auto-clear messages after 3 seconds
  React.useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  return (
    <div className="instructor-controls">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Instructor Controls
        </h3>
        <p className="text-sm text-gray-400">
          Manage participants in this classroom
        </p>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded-lg">
          <p className="text-green-400 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Participant List */}
      <div className="space-y-3">
        {studentParticipantIds.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No participants in classroom</p>
          </div>
        ) : (
          studentParticipantIds.map((participantId: string) => {
            const isLoading = loadingStates[participantId] || false;

            return (
              <ParticipantRow
                key={participantId}
                participantId={participantId}
                isLoading={isLoading}
                onMute={handleMuteParticipant}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Individual participant row component
 * WHY: Separates participant rendering logic for better maintainability
 */
interface ParticipantRowProps {
  participantId: string;
  isLoading: boolean;
  onMute: (sessionId: string, currentMutedState: boolean) => void;
}

function ParticipantRow({ participantId, isLoading, onMute }: ParticipantRowProps) {
  // Get participant properties using Daily React hooks
  const [userName] = useParticipantProperty(participantId, 'user_name');
  const [audioState] = useParticipantProperty(participantId, 'tracks.audio.state');
  const [videoState] = useParticipantProperty(participantId, 'tracks.video.state');

  const isMuted = audioState === 'off';
  const isVideoOff = videoState === 'off';

  return (
    <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-teal-500/50 transition-colors">
      {/* Participant Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {/* Audio indicator */}
          <div
            data-testid="audio-indicator"
            className={`w-3 h-3 rounded-full ${
              isMuted ? 'bg-red-500' : 'bg-green-500'
            }`}
            title={isMuted ? 'Muted' : 'Unmuted'}
          />
          
          {/* Video indicator */}
          <div
            data-testid="video-indicator"
            className={`w-3 h-3 rounded-full ${
              isVideoOff ? 'bg-red-500' : 'bg-green-500'
            }`}
            title={isVideoOff ? 'Video Off' : 'Video On'}
          />
        </div>
        
        <div>
          <p className="text-white font-medium text-sm">
            {userName || 'Unknown User'}
          </p>
          <p className="text-gray-400 text-xs">
            {isMuted ? 'Muted' : 'Unmuted'} • {isVideoOff ? 'Video Off' : 'Video On'}
          </p>
        </div>
      </div>

      {/* Mute/Unmute Button */}
      <button
        data-testid={`mute-button-${participantId}`}
        onClick={() => onMute(participantId, isMuted)}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm transition-colors
          ${isMuted 
            ? 'bg-teal-600 hover:bg-teal-700 text-white' 
            : 'bg-orange-600 hover:bg-orange-700 text-white'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isMuted ? 'Unmute participant' : 'Mute participant'}
      >
        {isLoading ? (
          <span className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2">
            <span>{isMuted ? '🔊' : '🔇'}</span>
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </span>
        )}
      </button>
    </div>
  );
}