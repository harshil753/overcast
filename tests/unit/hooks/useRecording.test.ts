/**
 * Hook Test: useRecording
 * 
 * Tests the useRecording hook with React Testing Library
 * Validates hook state management, error handling, and recording operations
 * 
 * Tests: Hook state management, error handling, recording operations, cleanup
 */

import { renderHook, act } from '@testing-library/react';
import { useRecording } from '@/app/hooks/useRecording';
import { Recording, RecordingStatus } from '@/lib/types';

// Mock the recording utilities
jest.mock('@/lib/recording-utils', () => ({
  isRecordingSupported: jest.fn(() => true),
  getUserMediaStream: jest.fn(),
  createRecording: jest.fn(),
  startRecordingWithRetry: jest.fn(),
  stopRecording: jest.fn(),
  createRecordingFile: jest.fn(),
  generateDownloadUrl: jest.fn(),
  revokeDownloadUrl: jest.fn(),
  validateRecording: jest.fn(() => true),
  isRecordingExpired: jest.fn(() => false),
  getRecordingStatusMessage: jest.fn((recording) => {
    switch (recording.status) {
      case 'IDLE': return 'Ready to record';
      case 'RECORDING': return 'Recording in progress...';
      case 'STOPPED': return 'Recording completed';
      case 'ERROR': return recording.errorMessage || 'Recording failed';
      default: return 'Unknown status';
    }
  }),
  getRecordingDuration: jest.fn((recording) => {
    if (!recording.duration) return '0:00';
    const minutes = Math.floor(recording.duration / 60000);
    const seconds = Math.floor((recording.duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }),
  getRecordingFileSize: jest.fn((recording) => {
    if (recording.fileSize === 0) return '0 B';
    if (recording.fileSize < 1024) return `${recording.fileSize} B`;
    if (recording.fileSize < 1024 * 1024) return `${(recording.fileSize / 1024).toFixed(1)} KB`;
    return `${(recording.fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }),
}));

// Mock the storage utilities
jest.mock('@/lib/storage-utils', () => ({
  saveRecording: jest.fn(() => true),
  getRecordings: jest.fn(() => []),
  getRecordingsForClassroom: jest.fn(() => []),
  deleteRecording: jest.fn(() => true),
  saveRecordingState: jest.fn(() => true),
  getRecordingState: jest.fn(() => null),
  clearRecordingState: jest.fn(() => true),
  cleanupExpiredRecordings: jest.fn(() => ({ removedCount: 0, remainingCount: 0 })),
  isStorageQuotaExceeded: jest.fn(() => false),
}));

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  ondataavailable: null,
  onstop: null,
  onerror: null,
  state: 'inactive',
};

// Mock MediaStream
const mockMediaStream = {
  getTracks: jest.fn(() => []),
  getVideoTracks: jest.fn(() => []),
  getAudioTracks: jest.fn(() => []),
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
} as any;

// Mock global objects
Object.defineProperty(window, 'MediaRecorder', {
  value: jest.fn(() => mockMediaRecorder),
  writable: true,
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(),
  },
  writable: true,
});

describe('useRecording Hook', () => {
  const mockConfig = {
    userId: 'user-1',
    classroomId: 'classroom-1',
    autoCleanup: true,
    onError: jest.fn(),
    onRecordingStart: jest.fn(),
    onRecordingStop: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset MediaRecorder mock
    Object.defineProperty(mockMediaRecorder, 'state', {
      value: 'inactive',
      writable: true,
    });
  });

  test('initializes with correct default state', () => {
    const { result } = renderHook(() => useRecording(mockConfig));
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.currentRecording).toBeNull();
    expect(result.current.recordings).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.statusMessage).toBe('Ready to record');
  });

  test('handles unsupported browser', () => {
    const { isRecordingSupported } = require('@/lib/recording-utils');
    isRecordingSupported.mockReturnValue(false);
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    expect(result.current.isSupported).toBe(false);
  });

  test('loads existing recordings on initialization', () => {
    const mockRecordings = [
      {
        id: 'recording-1',
        classroomId: 'classroom-1',
        userId: 'user-1',
        startTime: Date.now() - 300000,
        status: 'STOPPED' as RecordingStatus,
        fileName: 'recording-1.webm',
        fileSize: 1024000,
        ttl: Date.now() + 86400000,
        retryCount: 0,
      }
    ];
    
    const { getRecordingsForClassroom } = require('@/lib/storage-utils');
    getRecordingsForClassroom.mockReturnValue(mockRecordings);
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    expect(result.current.recordings).toEqual(mockRecordings);
  });

  test('restores recording state on initialization', () => {
    const mockRecordingState = {
      userId: 'user-1',
      classroomId: 'classroom-1',
      isRecording: true,
      activeRecordingId: 'recording-1',
      recordings: ['recording-1'],
      retryAttempts: 0,
    };
    
    const { getRecordingState } = require('@/lib/storage-utils');
    getRecordingState.mockReturnValue(mockRecordingState);
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    expect(result.current.isRecording).toBe(true);
  });

  test('starts recording successfully', async () => {
    const mockRecording = {
      id: 'recording-1',
      classroomId: 'classroom-1',
      userId: 'user-1',
      startTime: Date.now(),
      status: 'RECORDING' as RecordingStatus,
      fileName: 'recording-1.webm',
      fileSize: 0,
      ttl: Date.now() + 86400000,
      retryCount: 0,
    };
    
    const { getUserMediaStream, createRecording, startRecordingWithRetry } = require('@/lib/recording-utils');
    getUserMediaStream.mockResolvedValue(mockMediaStream);
    createRecording.mockReturnValue(mockRecording);
    startRecordingWithRetry.mockResolvedValue(mockRecording);
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      const success = await result.current.startRecording();
      expect(success).toBe(true);
    });
    
    expect(result.current.isRecording).toBe(true);
    expect(result.current.currentRecording).toEqual(mockRecording);
    expect(mockConfig.onRecordingStart).toHaveBeenCalledWith(mockRecording);
  });

  test('handles recording start failure', async () => {
    const { getUserMediaStream } = require('@/lib/recording-utils');
    getUserMediaStream.mockRejectedValue(new Error('Permission denied'));
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      const success = await result.current.startRecording();
      expect(success).toBe(false);
    });
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBe('Permission denied');
    expect(mockConfig.onError).toHaveBeenCalledWith('Permission denied');
  });

  test('handles storage quota exceeded', async () => {
    const { isStorageQuotaExceeded } = require('@/lib/storage-utils');
    isStorageQuotaExceeded.mockReturnValue(true);
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      const success = await result.current.startRecording();
      expect(success).toBe(false);
    });
    
    expect(result.current.error).toBe('Storage quota exceeded. Please clear old recordings.');
    expect(mockConfig.onError).toHaveBeenCalledWith('Storage quota exceeded. Please clear old recordings.');
  });

  test('stops recording successfully', async () => {
    const mockRecording = {
      id: 'recording-1',
      classroomId: 'classroom-1',
      userId: 'user-1',
      startTime: Date.now(),
      status: 'RECORDING' as RecordingStatus,
      fileName: 'recording-1.webm',
      fileSize: 0,
      ttl: Date.now() + 86400000,
      retryCount: 0,
    };
    
    // Set up initial recording state
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      // Mock the recording state
      result.current.isRecording = true;
      result.current.currentRecording = mockRecording;
    });
    
    await act(async () => {
      const success = await result.current.stopRecording();
      expect(success).toBe(true);
    });
    
    expect(mockMediaRecorder.stop).toHaveBeenCalled();
  });

  test('handles recording stop failure', async () => {
    const { result } = renderHook(() => useRecording(mockConfig));
    
    // Set up recording state
    await act(async () => {
      result.current.isRecording = true;
    });
    
    // Mock MediaRecorder to throw error
    mockMediaRecorder.stop.mockImplementation(() => {
      throw new Error('Stop failed');
    });
    
    await act(async () => {
      const success = await result.current.stopRecording();
      expect(success).toBe(false);
    });
    
    expect(result.current.error).toBe('Stop failed');
    expect(mockConfig.onError).toHaveBeenCalledWith('Stop failed');
  });

  test('retries recording on error', async () => {
    const mockRecording = {
      id: 'recording-1',
      classroomId: 'classroom-1',
      userId: 'user-1',
      startTime: Date.now(),
      status: 'ERROR' as RecordingStatus,
      fileName: 'recording-1.webm',
      fileSize: 0,
      ttl: Date.now() + 86400000,
      retryCount: 1,
      errorMessage: 'Recording failed',
    };
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      result.current.currentRecording = mockRecording;
    });
    
    await act(async () => {
      const success = await result.current.retryRecording();
      expect(success).toBe(true);
    });
  });

  test('handles retry when no error recording exists', async () => {
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      const success = await result.current.retryRecording();
      expect(success).toBe(false);
    });
  });

  test('downloads recording', async () => {
    const mockRecordings = [
      {
        id: 'recording-1',
        classroomId: 'classroom-1',
        userId: 'user-1',
        startTime: Date.now(),
        status: 'STOPPED' as RecordingStatus,
        fileName: 'recording-1.webm',
        fileSize: 1024000,
        ttl: Date.now() + 86400000,
        retryCount: 0,
      }
    ];
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      result.current.recordings = mockRecordings;
    });
    
    await act(async () => {
      await result.current.downloadRecording('recording-1');
    });
    
    // Should not throw error
    expect(true).toBe(true);
  });

  test('handles download of non-existent recording', async () => {
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      await expect(result.current.downloadRecording('non-existent')).rejects.toThrow('Recording not found');
    });
  });

  test('deletes recording successfully', async () => {
    const mockRecordings = [
      {
        id: 'recording-1',
        classroomId: 'classroom-1',
        userId: 'user-1',
        startTime: Date.now(),
        status: 'STOPPED' as RecordingStatus,
        fileName: 'recording-1.webm',
        fileSize: 1024000,
        ttl: Date.now() + 86400000,
        retryCount: 0,
      }
    ];
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      result.current.recordings = mockRecordings;
    });
    
    await act(async () => {
      const success = await result.current.deleteRecording('recording-1');
      expect(success).toBe(true);
    });
    
    expect(result.current.recordings).toHaveLength(0);
  });

  test('clears all recordings', async () => {
    const mockRecordings = [
      {
        id: 'recording-1',
        classroomId: 'classroom-1',
        userId: 'user-1',
        startTime: Date.now(),
        status: 'STOPPED' as RecordingStatus,
        fileName: 'recording-1.webm',
        fileSize: 1024000,
        ttl: Date.now() + 86400000,
        retryCount: 0,
      }
    ];
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      result.current.recordings = mockRecordings;
    });
    
    await act(async () => {
      const success = await result.current.clearAllRecordings();
      expect(success).toBe(true);
    });
    
    expect(result.current.recordings).toHaveLength(0);
  });

  test('provides utility functions', () => {
    const { result } = renderHook(() => useRecording(mockConfig));
    
    const mockRecording = {
      id: 'recording-1',
      classroomId: 'classroom-1',
      userId: 'user-1',
      startTime: Date.now(),
      status: 'STOPPED' as RecordingStatus,
      fileName: 'recording-1.webm',
      fileSize: 1024000,
      duration: 300000,
      ttl: Date.now() + 86400000,
      retryCount: 0,
    };
    
    expect(typeof result.current.getRecordingDuration).toBe('function');
    expect(typeof result.current.getRecordingFileSize).toBe('function');
    expect(typeof result.current.isRecordingExpired).toBe('function');
    
    expect(result.current.getRecordingDuration(mockRecording)).toBe('5:00');
    expect(result.current.getRecordingFileSize(mockRecording)).toBe('1000.0 KB');
    expect(result.current.isRecordingExpired(mockRecording)).toBe(false);
  });

  test('handles MediaRecorder events', async () => {
    const mockRecording = {
      id: 'recording-1',
      classroomId: 'classroom-1',
      userId: 'user-1',
      startTime: Date.now(),
      status: 'RECORDING' as RecordingStatus,
      fileName: 'recording-1.webm',
      fileSize: 0,
      ttl: Date.now() + 86400000,
      retryCount: 0,
    };
    
    const { getUserMediaStream, createRecording, startRecordingWithRetry } = require('@/lib/recording-utils');
    getUserMediaStream.mockResolvedValue(mockMediaStream);
    createRecording.mockReturnValue(mockRecording);
    startRecordingWithRetry.mockResolvedValue(mockRecording);
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    // Simulate data available event
    if (mockMediaRecorder.ondataavailable) {
      const mockEvent = {
        data: new Blob(['test data'], { type: 'video/webm' }),
        size: 100,
      };
      mockMediaRecorder.ondataavailable(mockEvent);
    }
    
    // Simulate stop event
    if (mockMediaRecorder.onstop) {
      mockMediaRecorder.onstop();
    }
    
    expect(result.current.isRecording).toBe(false);
  });

  test('handles MediaRecorder error events', async () => {
    const mockRecording = {
      id: 'recording-1',
      classroomId: 'classroom-1',
      userId: 'user-1',
      startTime: Date.now(),
      status: 'RECORDING' as RecordingStatus,
      fileName: 'recording-1.webm',
      fileSize: 0,
      ttl: Date.now() + 86400000,
      retryCount: 0,
    };
    
    const { getUserMediaStream, createRecording, startRecordingWithRetry } = require('@/lib/recording-utils');
    getUserMediaStream.mockResolvedValue(mockMediaStream);
    createRecording.mockReturnValue(mockRecording);
    startRecordingWithRetry.mockResolvedValue(mockRecording);
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    // Simulate error event
    if (mockMediaRecorder.onerror) {
      const mockEvent = new Event('error');
      mockMediaRecorder.onerror(mockEvent);
    }
    
    expect(result.current.error).toBe('MediaRecorder error: [object Event]');
  });

  test('cleans up on unmount', () => {
    const { result, unmount } = renderHook(() => useRecording(mockConfig));
    
    // Set up recording state
    act(() => {
      result.current.isRecording = true;
    });
    
    unmount();
    
    // Should stop MediaRecorder and clear media stream
    expect(mockMediaRecorder.stop).toHaveBeenCalled();
  });

  test('handles recording with retry logic', async () => {
    const mockRecording = {
      id: 'recording-1',
      classroomId: 'classroom-1',
      userId: 'user-1',
      startTime: Date.now(),
      status: 'ERROR' as RecordingStatus,
      fileName: 'recording-1.webm',
      fileSize: 0,
      ttl: Date.now() + 86400000,
      retryCount: 2,
      errorMessage: 'Recording failed after 3 attempts',
    };
    
    const { startRecordingWithRetry } = require('@/lib/recording-utils');
    startRecordingWithRetry.mockResolvedValue(mockRecording);
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      result.current.currentRecording = mockRecording;
    });
    
    await act(async () => {
      const success = await result.current.retryRecording();
      expect(success).toBe(true);
    });
  });

  test('handles recording state persistence', async () => {
    const { saveRecordingState } = require('@/lib/storage-utils');
    
    const { result } = renderHook(() => useRecording(mockConfig));
    
    await act(async () => {
      result.current.isRecording = true;
      result.current.currentRecording = {
        id: 'recording-1',
        classroomId: 'classroom-1',
        userId: 'user-1',
        startTime: Date.now(),
        status: 'RECORDING' as RecordingStatus,
        fileName: 'recording-1.webm',
        fileSize: 0,
        ttl: Date.now() + 86400000,
        retryCount: 0,
      };
    });
    
    expect(saveRecordingState).toHaveBeenCalled();
  });

  test('handles auto cleanup', () => {
    const { cleanupExpiredRecordings } = require('@/lib/storage-utils');
    cleanupExpiredRecordings.mockReturnValue({ removedCount: 2, remainingCount: 1 });
    
    renderHook(() => useRecording(mockConfig));
    
    expect(cleanupExpiredRecordings).toHaveBeenCalledWith('user-1');
  });

  test('handles disabled auto cleanup', () => {
    const { cleanupExpiredRecordings } = require('@/lib/storage-utils');
    
    renderHook(() => useRecording({ ...mockConfig, autoCleanup: false }));
    
    expect(cleanupExpiredRecordings).not.toHaveBeenCalled();
  });
});
