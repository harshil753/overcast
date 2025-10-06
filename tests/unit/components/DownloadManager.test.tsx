/**
 * Component Test: DownloadManager
 * 
 * Tests the DownloadManager component with React Testing Library
 * Validates download functionality, file management, and user interactions
 * 
 * Tests: Download functionality, file management, progress tracking, error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DownloadManager from '@/app/components/DownloadManager';
import { Recording, RecordingStatus } from '@/lib/types';

// Mock the recording utilities
jest.mock('@/lib/recording-utils', () => ({
  generateDownloadUrl: jest.fn(() => 'blob:http://localhost:3000/test-url'),
  revokeDownloadUrl: jest.fn(),
  getRecordingFileSize: jest.fn((recording) => {
    if (recording.fileSize === 0) return '0 B';
    if (recording.fileSize < 1024) return `${recording.fileSize} B`;
    if (recording.fileSize < 1024 * 1024) return `${(recording.fileSize / 1024).toFixed(1)} KB`;
    return `${(recording.fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }),
  getRecordingDuration: jest.fn((recording) => {
    if (!recording.duration) return '0:00';
    const minutes = Math.floor(recording.duration / 60000);
    const seconds = Math.floor((recording.duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }),
  isRecordingExpired: jest.fn((recording) => {
    return Date.now() > recording.ttl;
  }),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:http://localhost:3000/test-url');
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true,
});

// Mock document.createElement and related methods
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    href: '',
    download: '',
    click: mockClick,
  })),
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

describe('DownloadManager Component', () => {
  const mockRecordings: Recording[] = [
    {
      id: 'recording-1',
      classroomId: 'classroom-1',
      userId: 'user-1',
      startTime: Date.now() - 300000, // 5 minutes ago
      endTime: Date.now() - 60000, // 1 minute ago
      duration: 240000, // 4 minutes
      status: 'STOPPED' as RecordingStatus,
      fileName: 'recording-1.webm',
      fileSize: 1024000, // 1MB
      ttl: Date.now() + 86400000, // 24 hours from now
      retryCount: 0,
    },
    {
      id: 'recording-2',
      classroomId: 'classroom-1',
      userId: 'user-1',
      startTime: Date.now() - 600000, // 10 minutes ago
      endTime: Date.now() - 300000, // 5 minutes ago
      duration: 300000, // 5 minutes
      status: 'STOPPED' as RecordingStatus,
      fileName: 'recording-2.webm',
      fileSize: 2048000, // 2MB
      ttl: Date.now() + 86400000, // 24 hours from now
      retryCount: 0,
    },
  ];

  const mockCallbacks = {
    onDownloadStart: jest.fn(),
    onDownloadComplete: jest.fn(),
    onDownloadError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with empty recordings list', () => {
    render(<DownloadManager recordings={[]} />);
    
    expect(screen.getByTestId('download-manager')).toBeInTheDocument();
    expect(screen.getByTestId('no-recordings-message')).toHaveTextContent('No recordings available');
  });

  test('renders recordings list with correct information', () => {
    render(<DownloadManager recordings={mockRecordings} />);
    
    expect(screen.getByTestId('download-manager')).toBeInTheDocument();
    expect(screen.getByText('2 recordings available')).toBeInTheDocument();
    
    // Check recording items
    const recordingItems = screen.getAllByTestId('recording-item');
    expect(recordingItems).toHaveLength(2);
    
    // Check first recording details
    expect(screen.getByText('recording-1.webm')).toBeInTheDocument();
    expect(screen.getByText('recording-2.webm')).toBeInTheDocument();
  });

  test('displays recording metadata correctly', () => {
    render(<DownloadManager recordings={[mockRecordings[0]]} />);
    
    // Check duration, size, and status
    expect(screen.getByTestId('recording-duration')).toHaveTextContent('4:00');
    expect(screen.getByTestId('recording-size')).toHaveTextContent('1000.0 KB');
    expect(screen.getByTestId('recording-status')).toHaveTextContent('STOPPED');
  });

  test('handles single recording download', async () => {
    render(<DownloadManager recordings={[mockRecordings[0]]} {...mockCallbacks} />);
    
    const downloadButton = screen.getByTestId('download-recording-button');
    fireEvent.click(downloadButton);
    
    // Should show downloading state
    await waitFor(() => {
      expect(screen.getByText('Downloading... 0%')).toBeInTheDocument();
    });
    
    // Should call onDownloadStart
    expect(mockCallbacks.onDownloadStart).toHaveBeenCalledWith(mockRecordings[0]);
    
    // Should create download link
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
  });

  test('handles download all recordings', async () => {
    render(<DownloadManager recordings={mockRecordings} {...mockCallbacks} />);
    
    const downloadAllButton = screen.getByTestId('download-all-button');
    fireEvent.click(downloadAllButton);
    
    // Should start downloading all recordings
    await waitFor(() => {
      expect(mockCallbacks.onDownloadStart).toHaveBeenCalledTimes(2);
    });
  });

  test('shows download progress', async () => {
    render(<DownloadManager recordings={[mockRecordings[0]]} />);
    
    const downloadButton = screen.getByTestId('download-recording-button');
    fireEvent.click(downloadButton);
    
    // Should show progress bar
    await waitFor(() => {
      expect(screen.getByText(/Downloading... \d+%/)).toBeInTheDocument();
    });
  });

  test('handles download errors', async () => {
    // Mock generateDownloadUrl to throw error
    const { generateDownloadUrl } = require('@/lib/recording-utils');
    generateDownloadUrl.mockImplementationOnce(() => {
      throw new Error('Download failed');
    });
    
    render(<DownloadManager recordings={[mockRecordings[0]]} {...mockCallbacks} />);
    
    const downloadButton = screen.getByTestId('download-recording-button');
    fireEvent.click(downloadButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Download failed')).toBeInTheDocument();
    });
    
    // Should call onDownloadError
    expect(mockCallbacks.onDownloadError).toHaveBeenCalledWith(mockRecordings[0], 'Download failed');
  });

  test('disables download button when downloading', async () => {
    render(<DownloadManager recordings={[mockRecordings[0]]} />);
    
    const downloadButton = screen.getByTestId('download-recording-button');
    fireEvent.click(downloadButton);
    
    // Button should be disabled during download
    await waitFor(() => {
      expect(downloadButton).toBeDisabled();
      expect(downloadButton).toHaveTextContent('Downloading...');
    });
  });

  test('handles expired recordings', () => {
    const { isRecordingExpired } = require('@/lib/recording-utils');
    isRecordingExpired.mockReturnValue(true);
    
    render(<DownloadManager recordings={[mockRecordings[0]]} />);
    
    // Should show expired message
    expect(screen.getByText('Recording has expired')).toBeInTheDocument();
    
    // Download button should not be visible for expired recordings
    expect(screen.queryByTestId('download-recording-button')).not.toBeInTheDocument();
  });

  test('clears download URLs', () => {
    const { revokeDownloadUrl } = require('@/lib/recording-utils');
    
    render(<DownloadManager recordings={mockRecordings} />);
    
    const clearUrlsButton = screen.getByTestId('clear-urls-button');
    fireEvent.click(clearUrlsButton);
    
    // Should revoke URLs
    expect(revokeDownloadUrl).toHaveBeenCalled();
  });

  test('applies custom className', () => {
    render(<DownloadManager recordings={[]} className="custom-class" />);
    
    const downloadManager = screen.getByTestId('download-manager');
    expect(downloadManager).toHaveClass('custom-class');
  });

  test('handles recording with zero file size', () => {
    const recordingWithZeroSize = {
      ...mockRecordings[0],
      fileSize: 0,
    };
    
    render(<DownloadManager recordings={[recordingWithZeroSize]} />);
    
    expect(screen.getByTestId('recording-size')).toHaveTextContent('0 B');
  });

  test('handles recording without duration', () => {
    const recordingWithoutDuration = {
      ...mockRecordings[0],
      duration: undefined,
    };
    
    render(<DownloadManager recordings={[recordingWithoutDuration]} />);
    
    expect(screen.getByTestId('recording-duration')).toHaveTextContent('0:00');
  });

  test('handles recording with long duration', () => {
    const longRecording = {
      ...mockRecordings[0],
      duration: 3661000, // 61 minutes 1 second
    };
    
    render(<DownloadManager recordings={[longRecording]} />);
    
    expect(screen.getByTestId('recording-duration')).toHaveTextContent('61:01');
  });

  test('handles recording with large file size', () => {
    const largeRecording = {
      ...mockRecordings[0],
      fileSize: 2.5 * 1024 * 1024, // 2.5 MB
    };
    
    render(<DownloadManager recordings={[largeRecording]} />);
    
    expect(screen.getByTestId('recording-size')).toHaveTextContent('2.5 MB');
  });

  test('handles multiple download states', async () => {
    render(<DownloadManager recordings={mockRecordings} />);
    
    const downloadButtons = screen.getAllByTestId('download-recording-button');
    
    // Start downloading first recording
    fireEvent.click(downloadButtons[0]);
    
    await waitFor(() => {
      expect(downloadButtons[0]).toBeDisabled();
    });
    
    // Second recording should still be downloadable
    expect(downloadButtons[1]).not.toBeDisabled();
  });

  test('cleans up on unmount', () => {
    const { revokeDownloadUrl } = require('@/lib/recording-utils');
    
    const { unmount } = render(<DownloadManager recordings={mockRecordings} />);
    
    unmount();
    
    // Should revoke URLs on unmount
    expect(revokeDownloadUrl).toHaveBeenCalled();
  });

  test('handles download URL generation failure', async () => {
    const { generateDownloadUrl } = require('@/lib/recording-utils');
    generateDownloadUrl.mockImplementationOnce(() => {
      throw new Error('URL generation failed');
    });
    
    render(<DownloadManager recordings={[mockRecordings[0]]} {...mockCallbacks} />);
    
    const downloadButton = screen.getByTestId('download-recording-button');
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(screen.getByText('URL generation failed')).toBeInTheDocument();
    });
    
    expect(mockCallbacks.onDownloadError).toHaveBeenCalledWith(mockRecordings[0], 'URL generation failed');
  });

  test('handles download completion', async () => {
    render(<DownloadManager recordings={[mockRecordings[0]]} {...mockCallbacks} />);
    
    const downloadButton = screen.getByTestId('download-recording-button');
    fireEvent.click(downloadButton);
    
    // Wait for download to complete
    await waitFor(() => {
      expect(mockCallbacks.onDownloadComplete).toHaveBeenCalledWith(mockRecordings[0]);
    }, { timeout: 3000 });
  });

  test('handles download progress updates', async () => {
    render(<DownloadManager recordings={[mockRecordings[0]]} />);
    
    const downloadButton = screen.getByTestId('download-recording-button');
    fireEvent.click(downloadButton);
    
    // Should show progress updates
    await waitFor(() => {
      expect(screen.getByText(/Downloading... \d+%/)).toBeInTheDocument();
    });
    
    // Should eventually show 100%
    await waitFor(() => {
      expect(screen.getByText('Downloading... 100%')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handles recording with error status', () => {
    const errorRecording = {
      ...mockRecordings[0],
      status: 'ERROR' as RecordingStatus,
      errorMessage: 'Recording failed',
    };
    
    render(<DownloadManager recordings={[errorRecording]} />);
    
    expect(screen.getByTestId('recording-status')).toHaveTextContent('ERROR');
  });

  test('handles recording with IDLE status', () => {
    const idleRecording = {
      ...mockRecordings[0],
      status: 'IDLE' as RecordingStatus,
    };
    
    render(<DownloadManager recordings={[idleRecording]} />);
    
    expect(screen.getByTestId('recording-status')).toHaveTextContent('IDLE');
  });

  test('handles recording with RECORDING status', () => {
    const recordingInProgress = {
      ...mockRecordings[0],
      status: 'RECORDING' as RecordingStatus,
    };
    
    render(<DownloadManager recordings={[recordingInProgress]} />);
    
    expect(screen.getByTestId('recording-status')).toHaveTextContent('RECORDING');
  });
});
