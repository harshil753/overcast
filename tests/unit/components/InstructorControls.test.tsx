/**
 * Component Test: InstructorControls
 * 
 * Tests the InstructorControls component for instructor classroom management
 * WHY: Instructors need controls to manage participants (mute/unmute)
 * 
 * This test follows TDD approach - it MUST FAIL initially since the component
 * doesn't exist yet. The component will be implemented in Phase 3.6 (T026).
 * 
 * Expected: ❌ Test MUST FAIL (component not created yet)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Daily.co hooks - these will be provided by @daily-co/daily-react
jest.mock('@daily-co/daily-react', () => ({
  useParticipants: jest.fn(),
  useDaily: jest.fn()
}));

// Import the component that doesn't exist yet
// This import will fail until T026 is implemented
import InstructorControls from '@/app/components/InstructorControls';

describe('InstructorControls Component', () => {
  // Mock participant data
  const mockParticipants = [
    {
      session_id: 'participant-1',
      user_name: 'Alice Student',
      audio: true,
      video: true,
      local: false
    },
    {
      session_id: 'participant-2',
      user_name: 'Bob Student',
      audio: false,
      video: true,
      local: false
    },
    {
      session_id: 'participant-3',
      user_name: 'Charlie Student',
      audio: true,
      video: false,
      local: false
    }
  ];

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock useParticipants to return test data
    const { useParticipants } = require('@daily-co/daily-react');
    useParticipants.mockReturnValue(mockParticipants);
  });

  /**
   * Test 1: Renders participant list
   * WHY: Instructors need to see all participants to manage them
   */
  test('renders participant list from Daily.co hook', () => {
    const mockInstructorSession = 'instructor-session-123';
    const mockClassroomId = '1';

    render(
      <InstructorControls 
        instructorSessionId={mockInstructorSession}
        classroomId={mockClassroomId}
      />
    );

    // Should display all participants by name
    expect(screen.getByText('Alice Student')).toBeInTheDocument();
    expect(screen.getByText('Bob Student')).toBeInTheDocument();
    expect(screen.getByText('Charlie Student')).toBeInTheDocument();
  });

  /**
   * Test 2: Shows mute button for each participant
   * WHY: Each participant should have a mute/unmute control
   */
  test('shows mute button for each participant', () => {
    const mockInstructorSession = 'instructor-session-123';
    const mockClassroomId = '1';

    render(
      <InstructorControls 
        instructorSessionId={mockInstructorSession}
        classroomId={mockClassroomId}
      />
    );

    // Should have a mute button for each participant
    const muteButtons = screen.getAllByRole('button', { name: /mute|unmute/i });
    expect(muteButtons).toHaveLength(mockParticipants.length);
  });

  /**
   * Test 3: Clicking mute button calls mute handler
   * WHY: Mute button should trigger API call to mute participant
   */
  test('clicking mute button calls mute handler', async () => {
    const mockInstructorSession = 'instructor-session-123';
    const mockClassroomId = '1';
    const mockOnMute = jest.fn();

    // Mock fetch for the mute API call
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ) as jest.Mock;

    render(
      <InstructorControls 
        instructorSessionId={mockInstructorSession}
        classroomId={mockClassroomId}
        onMuteParticipant={mockOnMute}
      />
    );

    // Find the first mute/unmute button
    const muteButtons = screen.getAllByRole('button', { name: /mute|unmute/i });
    const firstButton = muteButtons[0];

    // Click the button
    fireEvent.click(firstButton);

    // Should call the mute handler or make API call
    await waitFor(() => {
      expect(mockOnMute || global.fetch).toHaveBeenCalled();
    });
  });

  /**
   * Test 4: Button states (muted vs unmuted)
   * WHY: Visual feedback for current mute state of each participant
   */
  test('displays correct button state based on audio state', () => {
    const mockInstructorSession = 'instructor-session-123';
    const mockClassroomId = '1';

    render(
      <InstructorControls 
        instructorSessionId={mockInstructorSession}
        classroomId={mockClassroomId}
      />
    );

    // Alice (audio: true) should show "Mute" button
    const aliceSection = screen.getByText('Alice Student').closest('div');
    expect(aliceSection).toHaveTextContent(/mute/i);

    // Bob (audio: false) should show "Unmute" button
    const bobSection = screen.getByText('Bob Student').closest('div');
    expect(bobSection).toHaveTextContent(/unmute/i);
  });

  /**
   * Test 5: Handles empty participant list gracefully
   * WHY: Should not crash when no participants are present
   */
  test('handles empty participant list gracefully', () => {
    const { useParticipants } = require('@daily-co/daily-react');
    useParticipants.mockReturnValue([]);

    const mockInstructorSession = 'instructor-session-123';
    const mockClassroomId = '1';

    render(
      <InstructorControls 
        instructorSessionId={mockInstructorSession}
        classroomId={mockClassroomId}
      />
    );

    // Should show a message or empty state
    expect(screen.getByText(/no participants|empty/i)).toBeInTheDocument();
  });

  /**
   * Test 6: Displays audio/video state indicators
   * WHY: Instructors need to see participant media states
   */
  test('displays audio and video state indicators', () => {
    const mockInstructorSession = 'instructor-session-123';
    const mockClassroomId = '1';

    render(
      <InstructorControls 
        instructorSessionId={mockInstructorSession}
        classroomId={mockClassroomId}
      />
    );

    // Should display audio state (mic on/off icon or text)
    // Alice has audio on, Bob has audio off
    const aliceAudioIndicator = screen.getByText('Alice Student')
      .closest('div')
      ?.querySelector('[data-testid="audio-indicator"]');
    
    const bobAudioIndicator = screen.getByText('Bob Student')
      .closest('div')
      ?.querySelector('[data-testid="audio-indicator"]');

    expect(aliceAudioIndicator || bobAudioIndicator).toBeTruthy();
  });

  /**
   * Test 7: Excludes local participant (instructor)
   * WHY: Instructor shouldn't see mute control for themselves
   */
  test('excludes local participant from control list', () => {
    const { useParticipants } = require('@daily-co/daily-react');
    
    const participantsWithLocal = [
      ...mockParticipants,
      {
        session_id: 'instructor-session-123',
        user_name: 'Instructor',
        audio: true,
        video: true,
        local: true  // This is the instructor
      }
    ];
    
    useParticipants.mockReturnValue(participantsWithLocal);

    const mockInstructorSession = 'instructor-session-123';
    const mockClassroomId = '1';

    render(
      <InstructorControls 
        instructorSessionId={mockInstructorSession}
        classroomId={mockClassroomId}
      />
    );

    // Should only show 3 participants (not the local instructor)
    const muteButtons = screen.getAllByRole('button', { name: /mute|unmute/i });
    expect(muteButtons).toHaveLength(mockParticipants.length);
    
    // Should not show instructor in list
    expect(screen.queryByText('Instructor')).not.toBeInTheDocument();
  });

  /**
   * Test 8: Error handling for failed mute action
   * WHY: Should provide feedback if mute operation fails
   */
  test('displays error message when mute action fails', async () => {
    const mockInstructorSession = 'instructor-session-123';
    const mockClassroomId = '1';

    // Mock fetch to return error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Failed to mute participant' })
      })
    ) as jest.Mock;

    render(
      <InstructorControls 
        instructorSessionId={mockInstructorSession}
        classroomId={mockClassroomId}
      />
    );

    // Click a mute button
    const muteButtons = screen.getAllByRole('button', { name: /mute|unmute/i });
    fireEvent.click(muteButtons[0]);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });
});

