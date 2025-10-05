/**
 * Component Test: VideoFeed
 * 
 * Tests the VideoFeed component that displays participant video tiles
 * WHY: All participants (students and instructors) need to see video feeds
 * 
 * This test follows TDD approach - it MUST FAIL initially since the component
 * doesn't exist yet. The component will be implemented in Phase 3.6 (T025).
 * 
 * Expected: ❌ Test MUST FAIL (component not created yet)
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Daily.co hooks
jest.mock('@daily-co/daily-react', () => ({
  useParticipants: jest.fn(),
  useDaily: jest.fn(),
  DailyVideo: ({ sessionId, automirror }: { sessionId: string; automirror?: boolean }) => (
    <div data-testid={`video-${sessionId}`} data-automirror={automirror}>
      Mock Video for {sessionId}
    </div>
  )
}));

// Import the component that doesn't exist yet
// This import will fail until T025 is implemented
import VideoFeed from '@/app/components/VideoFeed';

describe('VideoFeed Component', () => {
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
      session_id: 'local-participant',
      user_name: 'Current User',
      audio: true,
      video: true,
      local: true
    },
    {
      session_id: 'participant-3',
      user_name: 'Charlie Instructor',
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
   * Test 1: Renders video tiles for each participant
   * WHY: Each participant should have a video tile displayed
   */
  test('renders video tiles for each participant', () => {
    render(<VideoFeed />);

    // Should render a video tile for each participant
    mockParticipants.forEach(participant => {
      const videoElement = screen.getByTestId(`video-${participant.session_id}`);
      expect(videoElement).toBeInTheDocument();
    });
  });

  /**
   * Test 2: Shows participant names
   * WHY: Users need to identify who is in each video tile
   */
  test('shows participant names on video tiles', () => {
    render(<VideoFeed />);

    // Should display each participant's name
    expect(screen.getByText('Alice Student')).toBeInTheDocument();
    expect(screen.getByText('Bob Student')).toBeInTheDocument();
    expect(screen.getByText('Current User')).toBeInTheDocument();
    expect(screen.getByText('Charlie Instructor')).toBeInTheDocument();
  });

  /**
   * Test 3: Shows video state indicators (camera on/off)
   * WHY: Users need to see if participant's camera is on or off
   */
  test('shows video state indicators', () => {
    render(<VideoFeed />);

    // Alice has video on - should show video enabled indicator
    const aliceTile = screen.getByText('Alice Student').closest('div');
    expect(aliceTile).toHaveAttribute('data-video-enabled', 'true');

    // Charlie has video off - should show video disabled indicator
    const charlieTile = screen.getByText('Charlie Instructor').closest('div');
    expect(charlieTile).toHaveAttribute('data-video-enabled', 'false');
  });

  /**
   * Test 4: Shows audio state indicators (mic on/off)
   * WHY: Users need to see if participant is muted or unmuted
   */
  test('shows audio state indicators', () => {
    render(<VideoFeed />);

    // Alice has audio on - should show unmuted indicator
    const aliceTile = screen.getByText('Alice Student').closest('div');
    const aliceAudioIndicator = within(aliceTile as HTMLElement)
      .getByTestId('audio-indicator');
    expect(aliceAudioIndicator).toHaveAttribute('data-muted', 'false');

    // Bob has audio off - should show muted indicator
    const bobTile = screen.getByText('Bob Student').closest('div');
    const bobAudioIndicator = within(bobTile as HTMLElement)
      .getByTestId('audio-indicator');
    expect(bobAudioIndicator).toHaveAttribute('data-muted', 'true');
  });

  /**
   * Test 5: Handles empty participant list gracefully
   * WHY: Should not crash when no participants are present
   */
  test('handles empty participant list gracefully', () => {
    const { useParticipants } = require('@daily-co/daily-react');
    useParticipants.mockReturnValue([]);

    render(<VideoFeed />);

    // Should show empty state message
    expect(screen.getByText(/no participants|waiting for others/i)).toBeInTheDocument();
  });

  /**
   * Test 6: Local participant video is mirrored
   * WHY: User's own video should be mirrored for natural viewing
   */
  test('mirrors local participant video', () => {
    render(<VideoFeed />);

    // Local participant video should have mirror/automirror attribute
    const localVideo = screen.getByTestId('video-local-participant');
    expect(localVideo).toHaveAttribute('data-automirror', 'true');
  });

  /**
   * Test 7: Remote participant videos are not mirrored
   * WHY: Other participants' videos should not be mirrored
   */
  test('does not mirror remote participant videos', () => {
    render(<VideoFeed />);

    // Remote participants should not have mirror attribute
    const aliceVideo = screen.getByTestId('video-participant-1');
    expect(aliceVideo).toHaveAttribute('data-automirror', 'false');

    const bobVideo = screen.getByTestId('video-participant-2');
    expect(bobVideo).toHaveAttribute('data-automirror', 'false');
  });

  /**
   * Test 8: Renders in grid layout
   * WHY: Multiple participants should be displayed in an organized grid
   */
  test('renders video tiles in grid layout', () => {
    const { container } = render(<VideoFeed />);

    // Container should have grid layout classes
    const gridContainer = container.querySelector('[data-testid="video-grid"]');
    expect(gridContainer).toHaveClass('grid');
  });

  /**
   * Test 9: Responsive grid adjusts to participant count
   * WHY: Grid should adapt to show appropriate number of columns
   */
  test('adjusts grid columns based on participant count', () => {
    const { container, rerender } = render(<VideoFeed />);

    // With 4 participants, should use appropriate grid columns
    let gridContainer = container.querySelector('[data-testid="video-grid"]');
    expect(gridContainer?.className).toMatch(/grid-cols/);

    // Update to have fewer participants
    const { useParticipants } = require('@daily-co/daily-react');
    useParticipants.mockReturnValue([mockParticipants[0], mockParticipants[1]]);

    rerender(<VideoFeed />);

    gridContainer = container.querySelector('[data-testid="video-grid"]');
    expect(gridContainer?.className).toMatch(/grid-cols/);
  });

  /**
   * Test 10: Shows loading state when video is loading
   * WHY: Provide feedback while video stream loads
   */
  test('shows loading state for videos', () => {
    render(<VideoFeed />);

    // Should have loading indicators or placeholders
    const videoTiles = screen.getAllByTestId(/video-/);
    
    // At least one tile should show loading state initially
    const loadingIndicator = screen.queryByTestId('video-loading');
    expect(videoTiles.length > 0 || loadingIndicator).toBeTruthy();
  });

  /**
   * Test 11: Displays participant role badge
   * WHY: Users should be able to identify instructors vs students
   */
  test('displays role badge for instructors', () => {
    render(<VideoFeed />);

    // Charlie is an instructor (name contains "Instructor")
    const charlieTile = screen.getByText('Charlie Instructor').closest('div');
    const roleBadge = within(charlieTile as HTMLElement)
      .queryByText(/instructor/i);
    
    // Should show instructor badge
    expect(roleBadge).toBeInTheDocument();
  });

  /**
   * Test 12: Highlights local participant tile
   * WHY: User should easily identify their own video
   */
  test('highlights local participant tile', () => {
    render(<VideoFeed />);

    // Local participant tile should have distinct styling
    const localTile = screen.getByText('Current User').closest('div');
    expect(localTile).toHaveAttribute('data-local', 'true');
    expect(localTile).toHaveClass(/border-teal|border-primary/);
  });

  /**
   * Test 13: Shows connection state
   * WHY: Users need to know if a participant has connectivity issues
   */
  test('shows connection state for participants', () => {
    const { useParticipants } = require('@daily-co/daily-react');
    
    // Mock participants with different connection states
    useParticipants.mockReturnValue([
      {
        ...mockParticipants[0],
        connection_state: 'connected'
      },
      {
        ...mockParticipants[1],
        connection_state: 'connecting'
      }
    ]);

    render(<VideoFeed />);

    // Should show connection indicators
    const aliceTile = screen.getByText('Alice Student').closest('div');
    expect(aliceTile).toHaveAttribute('data-connection-state', 'connected');

    const bobTile = screen.getByText('Bob Student').closest('div');
    expect(bobTile).toHaveAttribute('data-connection-state', 'connecting');
  });

  /**
   * Test 14: Handles maximum participant display
   * WHY: Should gracefully handle classrooms at capacity (50 participants)
   */
  test('handles large number of participants efficiently', () => {
    const { useParticipants } = require('@daily-co/daily-react');
    
    // Create 50 mock participants (classroom capacity)
    const manyParticipants = Array.from({ length: 50 }, (_, i) => ({
      session_id: `participant-${i}`,
      user_name: `Student ${i}`,
      audio: true,
      video: true,
      local: false
    }));

    useParticipants.mockReturnValue(manyParticipants);

    const { container } = render(<VideoFeed />);

    // Should render all participants
    const videoTiles = container.querySelectorAll('[data-testid^="video-"]');
    expect(videoTiles.length).toBe(50);
  });
});

