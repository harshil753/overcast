'use client';

import React from 'react';
import { Participant } from '@/lib/types';

/**
 * ParticipantList Component
 * 
 * Reusable component for displaying a list of participants.
 * WHY: Reusable participant display, used in InstructorControls and VideoFeed
 * 
 * Features:
 * - Shows participant names and status
 * - Displays role badges (student/instructor)
 * - Shows audio/video state icons
 * - Compact list with teal highlights for instructors
 * 
 * Props:
 * - participants: Array of participant objects
 * - showRoleBadges: Whether to display role badges (default: true)
 * - compact: Whether to use compact layout (default: false)
 * - highlightInstructors: Whether to highlight instructor participants (default: true)
 */
interface ParticipantListProps {
  participants: Participant[];
  showRoleBadges?: boolean;
  compact?: boolean;
  highlightInstructors?: boolean;
}

export default function ParticipantList({
  participants,
  showRoleBadges = true,
  compact = false,
  highlightInstructors = true
}: ParticipantListProps) {
  /**
   * Gets the current audio state for a participant.
   * WHY: Determines if participant is currently muted
   */
  const isParticipantMuted = (participant: Participant): boolean => {
    return participant.tracks.audio.state === 'off';
  };

  /**
   * Gets the current video state for a participant.
   * WHY: Shows video status indicator
   */
  const isParticipantVideoOff = (participant: Participant): boolean => {
    return participant.tracks.video.state === 'off';
  };

  /**
   * Determines if a participant is an instructor.
   * WHY: Instructors get special styling and role badges
   */
  const isInstructor = (participant: Participant): boolean => {
    // In our app, instructors are identified by having owner: true
    // or by being the local participant with instructor role
    return participant.owner || (participant.local && participant.user_name.includes('Instructor'));
  };

  /**
   * Gets the appropriate styling for a participant based on their role.
   * WHY: Visual distinction between students and instructors
   */
  const getParticipantStyling = (participant: Participant): string => {
    const baseClasses = compact 
      ? 'flex items-center space-x-2 p-2 rounded-md transition-colors'
      : 'flex items-center space-x-3 p-3 rounded-lg transition-colors';
    
    const roleClasses = isInstructor(participant) && highlightInstructors
      ? 'bg-teal-900/20 border border-teal-500/30 hover:border-teal-500/50'
      : 'bg-gray-900/30 border border-gray-700 hover:border-gray-600';
    
    return `${baseClasses} ${roleClasses}`;
  };

  if (participants.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400 text-sm">No participants</p>
      </div>
    );
  }

  return (
    <div className="participant-list">
      {/* Header */}
      {!compact && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-300">
            Participants ({participants.length})
          </h4>
        </div>
      )}

      {/* Participant Items */}
      <div className={`space-y-2 ${compact ? 'space-y-1' : ''}`}>
        {participants.map((participant: Participant) => {
          const isMuted = isParticipantMuted(participant);
          const isVideoOff = isParticipantVideoOff(participant);
          const isInstructorParticipant = isInstructor(participant);

          return (
            <div
              key={participant.session_id}
              className={getParticipantStyling(participant)}
            >
              {/* Status Indicators */}
              <div className="flex items-center space-x-2">
                {/* Audio indicator */}
                <div
                  className={`w-2 h-2 rounded-full ${
                    isMuted ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  title={isMuted ? 'Muted' : 'Unmuted'}
                />
                
                {/* Video indicator */}
                <div
                  className={`w-2 h-2 rounded-full ${
                    isVideoOff ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  title={isVideoOff ? 'Video off' : 'Video on'}
                />
              </div>

              {/* Participant Name */}
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium truncate ${
                  isInstructorParticipant && highlightInstructors
                    ? 'text-teal-300'
                    : 'text-white'
                }`}>
                  {participant.user_name}
                </span>
              </div>

              {/* Role Badge */}
              {showRoleBadges && isInstructorParticipant && (
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Instructor
                  </span>
                </div>
              )}

              {/* Local indicator */}
              {participant.local && (
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    You
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info (only in non-compact mode) */}
      {!compact && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {participants.filter(p => !isInstructor(p)).length} student{participants.filter(p => !isInstructor(p)).length !== 1 ? 's' : ''}
            </span>
            <span>
              {participants.filter(p => isInstructor(p)).length} instructor{participants.filter(p => isInstructor(p)).length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}