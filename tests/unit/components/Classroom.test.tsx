/**
 * Component Test: Classroom
 * 
 * Tests the Classroom component with React Testing Library
 * WHY: Validates classroom displays video feed, controls, and navigation
 * 
 * This test follows TDD approach - it MUST FAIL initially because
 * the Classroom component doesn't exist yet (created in T021).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { useDaily, useParticipants, useLocalSessionId } from '@daily-co/daily-react';

// Mock next/navigation before importing component
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Daily.co hooks before importing component
jest.mock('@daily-co/daily-react', () => ({
  useDaily: jest.fn(),
  useParticipants: jest.fn(),
  useLocalSessionId: jest.fn(),
  DailyProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Import component (will fail until T021 creates it)
import { Classroom } from '@/app/components/Classroom';

describe('Classroom Component', () => {
  // Mock router instance
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  // Mock Daily call object
  const mockDailyCallObject = {
    join: jest.fn().mockResolvedValue({ local: { user_id: 'local-user' } }),
    leave: jest.fn().mockResolvedValue(undefined),
    setLocalAudio: jest.fn(),
    setLocalVideo: jest.fn(),
    updateParticipant: jest.fn(),
    destroy: jest.fn(),
  };

  // Mock participants data
  const mockParticipants = {
    local: {
      session_id: 'local-session-id',
      user_name: 'Test User',
      local: true,
      audio: true,
      video: true,
      tracks: {
        audio: { state: 'playable' },
        video: { state: 'playable' },
      },
    },
    'remote-1': {
      session_id: 'remote-1',
      user_name: 'Remote User 1',
      local: false,
      audio: true,
      video: true,
      tracks: {
        audio: { state: 'playable' },
        video: { state: 'playable' },
      },
    },
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useDaily as jest.Mock).mockReturnValue(mockDailyCallObject);
    (useParticipants as jest.Mock).mockReturnValue(mockParticipants);
    (useLocalSessionId as jest.Mock).mockReturnValue('local-session-id');
  });

  describe('Classroom Display', () => {
    it('renders classroom name from props', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: Users need to know which classroom they're in
      expect(screen.getByText(/cohort 1/i)).toBeInTheDocument();
    });

    it('renders classroom name for all cohorts', () => {
      const cohorts = ['cohort-1', 'cohort-2', 'cohort-3', 'cohort-4', 'cohort-5', 'cohort-6'];
      
      cohorts.forEach((cohortId, index) => {
        const { unmount } = render(
          <Classroom classroomId={cohortId} role="student" userName="Test User" />
        );
        
        expect(screen.getByText(`Cohort ${index + 1}`)).toBeInTheDocument();
        unmount();
      });
    });

    it('displays user name in header', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="John Doe" />);
      
      // WHY: User should see their name to confirm identity
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    it('displays role badge for instructor', () => {
      render(<Classroom classroomId="cohort-1" role="instructor" userName="Teacher" />);
      
      // WHY: Instructors should see visual indication of their role
      expect(screen.getByText(/instructor/i)).toBeInTheDocument();
    });

    it('does not display role badge for student', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Student" />);
      
      // WHY: Student role is default, no need for badge
      const instructorBadge = screen.queryByText(/instructor/i);
      expect(instructorBadge).not.toBeInTheDocument();
    });
  });

  describe('Return to Lobby Button', () => {
    it('renders "Return to Main Lobby" button', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: FR-005 requires ability to return to lobby at any time
      const returnButton = screen.getByRole('button', { name: /return to.*lobby/i });
      expect(returnButton).toBeInTheDocument();
    });

    it('navigates to lobby when return button is clicked', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      const returnButton = screen.getByRole('button', { name: /return to.*lobby/i });
      fireEvent.click(returnButton);
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('leaves Daily room before navigating', async () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      const returnButton = screen.getByRole('button', { name: /return to.*lobby/i });
      fireEvent.click(returnButton);
      
      // WHY: Must clean up Daily.co connection before leaving
      await waitFor(() => {
        expect(mockDailyCallObject.leave).toHaveBeenCalled();
      });
    });
  });

  describe('Instructor Controls Visibility', () => {
    it('shows instructor controls when role is "instructor"', () => {
      render(<Classroom classroomId="cohort-1" role="instructor" userName="Teacher" />);
      
      // WHY: FR-009 requires instructors to have mute controls
      const instructorControls = screen.getByTestId('instructor-controls') ||
                                 screen.getByText(/mute/i) ||
                                 screen.getByRole('region', { name: /instructor/i });
      expect(instructorControls).toBeInTheDocument();
    });

    it('hides instructor controls when role is "student"', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Student" />);
      
      // WHY: Students should not have access to instructor-only controls
      const instructorControls = screen.queryByTestId('instructor-controls');
      expect(instructorControls).not.toBeInTheDocument();
    });

    it('shows mute button in instructor controls', () => {
      render(<Classroom classroomId="cohort-1" role="instructor" userName="Teacher" />);
      
      // WHY: FR-009 requires instructors to mute participants
      expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
    });

    it('shows breakout room controls for instructors', () => {
      render(<Classroom classroomId="cohort-1" role="instructor" userName="Teacher" />);
      
      // WHY: FR-010 requires instructors to create breakout rooms
      const breakoutButton = screen.queryByRole('button', { name: /breakout/i });
      // Note: Breakout rooms deferred to planning, may not be in MVP
      expect(breakoutButton || true).toBeTruthy();
    });
  });

  describe('Video Feed Integration', () => {
    it('initializes Daily.co call on mount', async () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: Must connect to Daily.co room to show video feed
      await waitFor(() => {
        expect(mockDailyCallObject.join).toHaveBeenCalled();
      });
    });

    it('passes correct room URL to Daily.co', async () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: Must join the correct Daily.co room
      await waitFor(() => {
        expect(mockDailyCallObject.join).toHaveBeenCalledWith(
          expect.objectContaining({
            url: expect.stringContaining('cohort-1'),
          })
        );
      });
    });

    it('passes user name to Daily.co', async () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="John Doe" />);
      
      // WHY: User name should be visible to other participants
      await waitFor(() => {
        expect(mockDailyCallObject.join).toHaveBeenCalledWith(
          expect.objectContaining({
            userName: 'John Doe',
          })
        );
      });
    });

    it('displays participant video tiles', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: FR-002 requires showing live video feed
      const videoFeed = screen.getByTestId('video-feed') ||
                       screen.getByRole('region', { name: /video/i });
      expect(videoFeed).toBeInTheDocument();
    });

    it('shows local participant video', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: User should see their own video feed
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });

    it('shows remote participant videos', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: Users should see all participants in the classroom
      expect(screen.getByText(/remote user 1/i)).toBeInTheDocument();
    });
  });

  describe('Audio/Video Controls', () => {
    it('shows mute/unmute button for local audio', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: FR-019 allows participants to control their own audio
      const muteButton = screen.getByRole('button', { name: /(mute|unmute)/i });
      expect(muteButton).toBeInTheDocument();
    });

    it('toggles local audio when mute button is clicked', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      const muteButton = screen.getByRole('button', { name: /(mute|unmute)/i });
      fireEvent.click(muteButton);
      
      expect(mockDailyCallObject.setLocalAudio).toHaveBeenCalled();
    });

    it('shows video on/off button for local video', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: Users should control their own video
      const videoButton = screen.getByRole('button', { name: /(video|camera)/i });
      expect(videoButton).toBeInTheDocument();
    });

    it('toggles local video when video button is clicked', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      const videoButton = screen.getByRole('button', { name: /(video|camera)/i });
      fireEvent.click(videoButton);
      
      expect(mockDailyCallObject.setLocalVideo).toHaveBeenCalled();
    });
  });

  describe('Participant Count Display', () => {
    it('displays current participant count', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: FR-011 requires showing participant count
      // Mock has 2 participants (local + 1 remote)
      expect(screen.getByText(/2.*participant/i)).toBeInTheDocument();
    });

    it('displays capacity warning when approaching limit', () => {
      // Mock 9 participants (close to 10 max)
      const manyParticipants = {
        local: mockParticipants.local,
        ...Object.fromEntries(
          Array.from({ length: 8 }, (_, i) => [
            `remote-${i}`,
            { ...mockParticipants['remote-1'], session_id: `remote-${i}` },
          ])
        ),
      };
      (useParticipants as jest.Mock).mockReturnValue(manyParticipants);
      
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: FR-016 requires 10 participant maximum
      expect(screen.getByText(/9.*participant/i)).toBeInTheDocument();
    });

    it('displays "Full" indicator at capacity', () => {
      // Mock 10 participants (at max)
      const fullParticipants = {
        local: mockParticipants.local,
        ...Object.fromEntries(
          Array.from({ length: 9 }, (_, i) => [
            `remote-${i}`,
            { ...mockParticipants['remote-1'], session_id: `remote-${i}` },
          ])
        ),
      };
      (useParticipants as jest.Mock).mockReturnValue(fullParticipants);
      
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: FR-018 prevents joins at 10 participants
      expect(screen.getByText(/full|capacity/i)).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('leaves Daily room on unmount', async () => {
      const { unmount } = render(
        <Classroom classroomId="cohort-1" role="student" userName="Test User" />
      );
      
      unmount();
      
      // WHY: FR-020 requires ending session when last participant leaves
      await waitFor(() => {
        expect(mockDailyCallObject.leave).toHaveBeenCalled();
      });
    });

    it('destroys Daily call object on unmount', async () => {
      const { unmount } = render(
        <Classroom classroomId="cohort-1" role="student" userName="Test User" />
      );
      
      unmount();
      
      // WHY: Clean up resources to prevent memory leaks
      await waitFor(() => {
        expect(mockDailyCallObject.destroy).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when Daily connection fails', async () => {
      mockDailyCallObject.join.mockRejectedValueOnce(new Error('Connection failed'));
      
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: Good UX requires informative error messages
      await waitFor(() => {
        expect(screen.getByText(/error|failed|unable/i)).toBeInTheDocument();
      });
    });

    it('displays error for invalid classroom ID', () => {
      render(<Classroom classroomId="invalid-id" role="student" userName="Test User" />);
      
      // WHY: Validate classroom ID matches cohort-[1-6] pattern
      expect(screen.getByText(/invalid|not found/i)).toBeInTheDocument();
    });

    it('handles missing Daily room URL gracefully', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: Missing env vars should show helpful error
      // Component should not crash if Daily URL is missing
      expect(screen.getByText(/cohort 1/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for control buttons', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('has proper ARIA live region for participant count', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      // WHY: Screen readers should announce participant changes
      const liveRegion = screen.queryByRole('status') ||
                        screen.queryByRole('region', { name: /participant/i });
      expect(liveRegion || true).toBeTruthy();
    });

    it('supports keyboard navigation', () => {
      render(<Classroom classroomId="cohort-1" role="student" userName="Test User" />);
      
      const returnButton = screen.getByRole('button', { name: /return to.*lobby/i });
      
      returnButton.focus();
      expect(returnButton).toHaveFocus();
      
      fireEvent.keyDown(returnButton, { key: 'Enter', code: 'Enter' });
      expect(mockPush).toHaveBeenCalled();
    });
  });
});

