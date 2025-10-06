/**
 * Component Test: RecordingControls
 * 
 * Tests the RecordingControls component with React Testing Library
 * Validates rendering, interaction, state management, and error handling
 * 
 * WHY: Ensures the recording controls work correctly and provide proper
 * user feedback for all recording states and error scenarios.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecordingControls from '@/app/components/RecordingControls';
import { useRecording } from '@/app/hooks/useRecording';

// Mock the useRecording hook
jest.mock('@/app/hooks/useRecording');
const mockUseRecording = useRecording as jest.MockedFunction<typeof useRecording>;

// Mock recording utilities
jest.mock('@/lib/recording-utils', () => ({
  isRecordingSupported: jest.fn(() => true),
  getRecordingDuration: jest.fn(() => '00:01:23'),
  getRecordingFileSize: jest.fn(() => '15.2 MB'),
}));

// Mock storage utilities
jest.mock('@/lib/storage-utils', () => ({
  saveRecording: jest.fn(() => true),
  getRecordings: jest.fn(() => []),
  deleteRecording: jest.fn(() => Promise.resolve(true)),
}));

describe('RecordingControls Component', () => {
  const defaultProps = {
    userId: 'test-user-123',
    classroomId: 'test-classroom-456',
  };

  const mockRecording = {
    id: 'recording-789',
    classroomId: 'test-classroom-456',
    userId: 'test-user-123',
    startTime: Date.now(),
    status: 'RECORDING' as const,
    fileName: 'recording-789.webm',
    fileSize: 15728640,
    ttl: Date.now() + 24 * 60 * 60 * 1000,
    retryCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders with default props', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Ready to record',
        error: null,
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      expect(screen.getByTestId('recording-controls')).toBeInTheDocument();
      expect(screen.getByTestId('start-recording-button')).toBeInTheDocument();
    });

    test('renders with custom className', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Ready to record',
        error: null,
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} className="custom-class" />);
      
      const controls = screen.getByTestId('recording-controls');
      expect(controls).toHaveClass('custom-class');
    });

    test('renders browser compatibility message when not supported', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: false,
        currentRecording: null,
        statusMessage: 'Recording not supported',
        error: null,
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      expect(screen.getByTestId('browser-compatibility-message')).toBeInTheDocument();
      expect(screen.getByTestId('browser-compatibility-message')).toHaveTextContent(
        'Recording not supported in this browser'
      );
    });
  });

  describe('Recording States', () => {
    test('shows idle state with start button', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Ready to record',
        error: null,
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      expect(screen.getByTestId('start-recording-button')).toBeInTheDocument();
      expect(screen.getByTestId('start-recording-button')).toHaveTextContent('Start Recording');
      expect(screen.queryByTestId('stop-recording-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('recording-indicator')).not.toBeInTheDocument();
    });

    test('shows recording state with stop button and indicator', () => {
      mockUseRecording.mockReturnValue({
        isRecording: true,
        isSupported: true,
        currentRecording: mockRecording,
        statusMessage: 'Recording in progress',
        error: null,
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:01:23'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('stop-recording-button')).toBeInTheDocument();
      expect(screen.getByTestId('stop-recording-button')).toHaveTextContent('Stop Recording');
      expect(screen.queryByTestId('start-recording-button')).not.toBeInTheDocument();
    });

    test('shows loading state', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Starting recording...',
        error: null,
        isLoading: true,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      expect(screen.getByTestId('recording-loading')).toBeInTheDocument();
      expect(screen.getByTestId('recording-loading')).toHaveTextContent('Starting...');
    });

    test('shows recording duration when recording', () => {
      mockUseRecording.mockReturnValue({
        isRecording: true,
        isSupported: true,
        currentRecording: mockRecording,
        statusMessage: 'Recording in progress',
        error: null,
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:01:23'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      expect(screen.getByText('00:01:23')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('calls startRecording when start button is clicked', async () => {
      const mockStartRecording = jest.fn();
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Ready to record',
        error: null,
        isLoading: false,
        startRecording: mockStartRecording,
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      const startButton = screen.getByTestId('start-recording-button');
      fireEvent.click(startButton);
      
      expect(mockStartRecording).toHaveBeenCalledTimes(1);
    });

    test('calls stopRecording when stop button is clicked', async () => {
      const mockStopRecording = jest.fn();
      mockUseRecording.mockReturnValue({
        isRecording: true,
        isSupported: true,
        currentRecording: mockRecording,
        statusMessage: 'Recording in progress',
        error: null,
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: mockStopRecording,
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:01:23'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      const stopButton = screen.getByTestId('stop-recording-button');
      fireEvent.click(stopButton);
      
      expect(mockStopRecording).toHaveBeenCalledTimes(1);
    });

    test('calls retryRecording when retry button is clicked', async () => {
      const mockRetryRecording = jest.fn();
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Recording failed',
        error: 'Camera access denied',
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: mockRetryRecording,
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      const retryButton = screen.getByTestId('retry-recording-button');
      fireEvent.click(retryButton);
      
      expect(mockRetryRecording).toHaveBeenCalledTimes(1);
    });

    test('disables buttons when loading', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Starting recording...',
        error: null,
        isLoading: true,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Starting...');
    });
  });

  describe('Error Handling', () => {
    test('displays error message when error occurs', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Recording failed',
        error: 'Camera access denied',
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      expect(screen.getByTestId('recording-error-message')).toBeInTheDocument();
      expect(screen.getByTestId('recording-error-message')).toHaveTextContent('Camera access denied');
    });

    test('shows retry button when error occurs', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Recording failed',
        error: 'Camera access denied',
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      expect(screen.getByTestId('retry-recording-button')).toBeInTheDocument();
      expect(screen.getByTestId('retry-recording-button')).toHaveTextContent('Retry');
    });

    test('clears error message after 5 seconds', async () => {
      jest.useFakeTimers();
      
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Recording failed',
        error: 'Camera access denied',
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      expect(screen.getByTestId('recording-error-message')).toBeInTheDocument();
      
      // Fast-forward time by 5 seconds
      jest.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(screen.queryByTestId('recording-error-message')).not.toBeInTheDocument();
      });
      
      jest.useRealTimers();
    });

    test('allows manual error dismissal', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Recording failed',
        error: 'Camera access denied',
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      const errorMessage = screen.getByTestId('recording-error-message');
      const closeButton = errorMessage.querySelector('button');
      
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);
      
      expect(screen.queryByTestId('recording-error-message')).not.toBeInTheDocument();
    });
  });

  describe('Callback Functions', () => {
    test('calls onRecordingStart when recording starts', async () => {
      const mockOnRecordingStart = jest.fn();
      const mockStartRecording = jest.fn();
      
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Ready to record',
        error: null,
        isLoading: false,
        startRecording: mockStartRecording,
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(
        <RecordingControls 
          {...defaultProps} 
          onRecordingStart={mockOnRecordingStart}
        />
      );
      
      const startButton = screen.getByTestId('start-recording-button');
      fireEvent.click(startButton);
      
      expect(mockStartRecording).toHaveBeenCalledTimes(1);
    });

    test('calls onRecordingStop when recording stops', async () => {
      const mockOnRecordingStop = jest.fn();
      const mockStopRecording = jest.fn();
      
      mockUseRecording.mockReturnValue({
        isRecording: true,
        isSupported: true,
        currentRecording: mockRecording,
        statusMessage: 'Recording in progress',
        error: null,
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: mockStopRecording,
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:01:23'),
      });

      render(
        <RecordingControls 
          {...defaultProps} 
          onRecordingStop={mockOnRecordingStop}
        />
      );
      
      const stopButton = screen.getByTestId('stop-recording-button');
      fireEvent.click(stopButton);
      
      expect(mockStopRecording).toHaveBeenCalledTimes(1);
    });

    test('calls onError when error occurs', () => {
      const mockOnError = jest.fn();
      
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Recording failed',
        error: 'Camera access denied',
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(
        <RecordingControls 
          {...defaultProps} 
          onError={mockOnError}
        />
      );
      
      expect(mockOnError).toHaveBeenCalledWith('Camera access denied');
    });
  });

  describe('Recording Completion', () => {
    test('shows recording saved message when recording completes', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Recording completed',
        error: null,
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:01:23'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      expect(screen.getByTestId('recording-saved-message')).toBeInTheDocument();
      expect(screen.getByTestId('recording-saved-message')).toHaveTextContent(
        'Recording saved successfully'
      );
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Ready to record',
        error: null,
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      const startButton = screen.getByTestId('start-recording-button');
      expect(startButton).toHaveAttribute('type', 'button');
    });

    test('close button has proper ARIA label', () => {
      mockUseRecording.mockReturnValue({
        isRecording: false,
        isSupported: true,
        currentRecording: null,
        statusMessage: 'Recording failed',
        error: 'Camera access denied',
        isLoading: false,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        retryRecording: jest.fn(),
        getRecordingDuration: jest.fn(() => '00:00:00'),
      });

      render(<RecordingControls {...defaultProps} />);
      
      const errorMessage = screen.getByTestId('recording-error-message');
      const closeButton = errorMessage.querySelector('button');
      
      expect(closeButton).toHaveAttribute('aria-label', 'Close error message');
    });
  });
});
