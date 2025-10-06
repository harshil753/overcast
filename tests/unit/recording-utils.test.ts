/**
 * Unit Test: Recording Utilities
 * 
 * Tests the recording utilities module with comprehensive coverage of
 * MediaRecorder integration, error handling, retry logic, and utility functions.
 * 
 * Validates: MediaRecorder integration, error handling, retry logic, utility functions
 */

import {
  isRecordingSupported,
  getUserMediaStream,
  createRecording,
  startRecordingWithRetry,
  stopRecording,
  createRecordingFile,
  generateDownloadUrl,
  revokeDownloadUrl,
  validateRecording,
  isRecordingExpired,
  getRecordingStatusMessage,
  getRecordingDuration,
  getRecordingFileSize,
} from '@/lib/recording-utils';
import { Recording, RecordingFile, RecordingStatus } from '@/lib/types';

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

// Mock URL
const mockUrl = 'blob:http://localhost:3000/test-url';
const mockRevokeObjectURL = jest.fn();

// Mock crypto
const mockCrypto = {
  randomUUID: jest.fn(() => 'test-uuid-123'),
};

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn();

describe('Recording Utilities', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock global objects
    Object.defineProperty(window, 'MediaRecorder', {
      value: jest.fn(() => mockMediaRecorder),
      writable: true,
    });
    
    Object.defineProperty(window, 'crypto', {
      value: mockCrypto,
      writable: true,
    });
    
    Object.defineProperty(URL, 'createObjectURL', {
      value: jest.fn(() => mockUrl),
      writable: true,
    });
    
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: mockRevokeObjectURL,
      writable: true,
    });
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
    });
  });

  describe('isRecordingSupported', () => {
    test('should return true when all APIs are available', () => {
      expect(isRecordingSupported()).toBe(true);
    });

    test('should return false when MediaRecorder is not available', () => {
      // @ts-ignore
      delete window.MediaRecorder;
      expect(isRecordingSupported()).toBe(false);
    });

    test('should return false when getUserMedia is not available', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });
      expect(isRecordingSupported()).toBe(false);
    });

    test('should return false when navigator.mediaDevices is not available', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });
      expect(isRecordingSupported()).toBe(false);
    });
  });

  describe('getUserMediaStream', () => {
    test('should return media stream with default constraints', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream);
      
      const result = await getUserMediaStream();
      
      expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true, audio: true });
      expect(result).toBe(mockMediaStream);
    });

    test('should return media stream with custom constraints', async () => {
      const constraints = { video: { width: 1280, height: 720 }, audio: true };
      mockGetUserMedia.mockResolvedValue(mockMediaStream);
      
      const result = await getUserMediaStream(constraints);
      
      expect(mockGetUserMedia).toHaveBeenCalledWith(constraints);
      expect(result).toBe(mockMediaStream);
    });

    test('should throw error when getUserMedia fails', async () => {
      const error = new Error('Permission denied');
      mockGetUserMedia.mockRejectedValue(error);
      
      await expect(getUserMediaStream()).rejects.toThrow('Failed to access camera/microphone: Permission denied');
    });
  });

  describe('createRecording', () => {
    test('should create recording with valid data', () => {
      const classroomId = 'classroom-1';
      const userId = 'user-123';
      const now = Date.now();
      
      // Mock Date.now to return a specific value
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      const recording = createRecording(classroomId, userId);
      
      expect(recording).toEqual({
        id: 'test-uuid-123',
        classroomId,
        userId,
        startTime: now,
        status: 'IDLE',
        fileName: `recording-test-uuid-123-${now}.webm`,
        fileSize: 0,
        ttl: now + (24 * 60 * 60 * 1000), // 24 hours
        retryCount: 0,
      });
    });

    test('should generate unique IDs for different recordings', () => {
      const classroomId = 'classroom-1';
      const userId = 'user-123';
      
      const recording1 = createRecording(classroomId, userId);
      const recording2 = createRecording(classroomId, userId);
      
      expect(recording1.id).not.toBe(recording2.id);
      expect(recording1.fileName).not.toBe(recording2.fileName);
    });
  });

  describe('startRecordingWithRetry', () => {
    test('should start recording successfully on first attempt', async () => {
      const recording = createRecording('classroom-1', 'user-123');
      const stream = mockMediaStream;
      
      const result = await startRecordingWithRetry(recording, stream);
      
      expect(result.status).toBe('RECORDING');
      expect(result.retryCount).toBe(0);
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
    });

    test('should retry on failure and eventually succeed', async () => {
      const recording = createRecording('classroom-1', 'user-123');
      const stream = mockMediaStream;
      
      // Mock MediaRecorder to fail first two attempts, succeed on third
      let attemptCount = 0;
      const MockMediaRecorder = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 2) {
          // Simulate failure
          setTimeout(() => {
            if (mockMediaRecorder.onerror) {
              mockMediaRecorder.onerror(new Event('error'));
            }
          }, 10);
        }
        return mockMediaRecorder;
      });
      
      Object.defineProperty(window, 'MediaRecorder', {
        value: MockMediaRecorder,
        writable: true,
      });
      
      const result = await startRecordingWithRetry(recording, stream);
      
      expect(result.status).toBe('RECORDING');
      expect(result.retryCount).toBe(2);
    });

    test('should fail after max retries', async () => {
      const recording = createRecording('classroom-1', 'user-123');
      const stream = mockMediaStream;
      
      // Mock MediaRecorder to always fail
      const MockMediaRecorder = jest.fn().mockImplementation(() => {
        setTimeout(() => {
          if (mockMediaRecorder.onerror) {
            mockMediaRecorder.onerror(new Event('error'));
          }
        }, 10);
        return mockMediaRecorder;
      });
      
      Object.defineProperty(window, 'MediaRecorder', {
        value: MockMediaRecorder,
        writable: true,
      });
      
      const result = await startRecordingWithRetry(recording, stream);
      
      expect(result.status).toBe('ERROR');
      expect(result.retryCount).toBe(3);
      expect(result.errorMessage).toContain('Recording failed after 3 attempts');
    });

    test('should handle MediaRecorder constructor errors', async () => {
      const recording = createRecording('classroom-1', 'user-123');
      const stream = mockMediaStream;
      
      // Mock MediaRecorder constructor to throw
      const MockMediaRecorder = jest.fn().mockImplementation(() => {
        throw new Error('MediaRecorder not supported');
      });
      
      Object.defineProperty(window, 'MediaRecorder', {
        value: MockMediaRecorder,
        writable: true,
      });
      
      const result = await startRecordingWithRetry(recording, stream);
      
      expect(result.status).toBe('ERROR');
      expect(result.errorMessage).toContain('MediaRecorder not supported');
    });
  });

  describe('stopRecording', () => {
    test('should stop recording and update metadata', () => {
      const recording = createRecording('classroom-1', 'user-123');
      const blob = new Blob(['test data'], { type: 'video/webm' });
      const startTime = recording.startTime;
      
      const result = stopRecording(recording, blob);
      
      expect(result.status).toBe('STOPPED');
      expect(result.endTime).toBeGreaterThan(startTime);
      expect(result.duration).toBe(result.endTime! - startTime);
      expect(result.fileSize).toBe(blob.size);
    });

    test('should handle zero-size blob', () => {
      const recording = createRecording('classroom-1', 'user-123');
      const blob = new Blob([], { type: 'video/webm' });
      
      const result = stopRecording(recording, blob);
      
      expect(result.fileSize).toBe(0);
      expect(result.status).toBe('STOPPED');
    });
  });

  describe('createRecordingFile', () => {
    test('should create recording file with correct metadata', () => {
      const recording = createRecording('classroom-1', 'user-123');
      const blob = new Blob(['test data'], { type: 'video/webm' });
      
      const recordingFile = createRecordingFile(recording, blob);
      
      expect(recordingFile).toEqual({
        recordingId: recording.id,
        blob,
        mimeType: 'video/webm',
        createdAt: recording.startTime,
      });
    });
  });

  describe('generateDownloadUrl', () => {
    test('should generate blob URL for download', () => {
      const recordingFile: RecordingFile = {
        recordingId: 'test-id',
        blob: new Blob(['test data'], { type: 'video/webm' }),
        mimeType: 'video/webm',
        createdAt: Date.now(),
      };
      
      const url = generateDownloadUrl(recordingFile);
      
      expect(URL.createObjectURL).toHaveBeenCalledWith(recordingFile.blob);
      expect(url).toBe(mockUrl);
    });
  });

  describe('revokeDownloadUrl', () => {
    test('should revoke blob URL', () => {
      const url = 'blob:http://localhost:3000/test-url';
      
      revokeDownloadUrl(url);
      
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
    });
  });

  describe('validateRecording', () => {
    test('should validate correct recording', () => {
      const recording = createRecording('classroom-1', 'user-123');
      
      expect(validateRecording(recording)).toBe(true);
    });

    test('should reject recording with missing required fields', () => {
      const recording = { ...createRecording('classroom-1', 'user-123'), id: '' };
      
      expect(validateRecording(recording)).toBe(false);
    });

    test('should reject recording with invalid time constraints', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.endTime = recording.startTime - 1000; // End before start
      
      expect(validateRecording(recording)).toBe(false);
    });

    test('should reject recording with invalid duration', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.endTime = recording.startTime + 5000;
      recording.duration = 10000; // Duration doesn't match end - start
      
      expect(validateRecording(recording)).toBe(false);
    });

    test('should reject recording with invalid retry count', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.retryCount = 5; // Exceeds max retries
      
      expect(validateRecording(recording)).toBe(false);
    });

    test('should reject recording with invalid TTL', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.ttl = recording.startTime - 1000; // TTL before start
      
      expect(validateRecording(recording)).toBe(false);
    });
  });

  describe('isRecordingExpired', () => {
    test('should return false for non-expired recording', () => {
      const recording = createRecording('classroom-1', 'user-123');
      
      expect(isRecordingExpired(recording)).toBe(false);
    });

    test('should return true for expired recording', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.ttl = Date.now() - 1000; // Expired 1 second ago
      
      expect(isRecordingExpired(recording)).toBe(true);
    });
  });

  describe('getRecordingStatusMessage', () => {
    test('should return correct message for IDLE status', () => {
      const recording = { ...createRecording('classroom-1', 'user-123'), status: 'IDLE' as RecordingStatus };
      
      expect(getRecordingStatusMessage(recording)).toBe('Ready to record');
    });

    test('should return correct message for RECORDING status', () => {
      const recording = { ...createRecording('classroom-1', 'user-123'), status: 'RECORDING' as RecordingStatus };
      
      expect(getRecordingStatusMessage(recording)).toBe('Recording in progress...');
    });

    test('should return correct message for STOPPED status', () => {
      const recording = { ...createRecording('classroom-1', 'user-123'), status: 'STOPPED' as RecordingStatus };
      
      expect(getRecordingStatusMessage(recording)).toBe('Recording completed');
    });

    test('should return error message for ERROR status', () => {
      const recording = { 
        ...createRecording('classroom-1', 'user-123'), 
        status: 'ERROR' as RecordingStatus,
        errorMessage: 'Test error message'
      };
      
      expect(getRecordingStatusMessage(recording)).toBe('Test error message');
    });

    test('should return default error message for ERROR status without errorMessage', () => {
      const recording = { ...createRecording('classroom-1', 'user-123'), status: 'ERROR' as RecordingStatus };
      
      expect(getRecordingStatusMessage(recording)).toBe('Recording failed');
    });
  });

  describe('getRecordingDuration', () => {
    test('should return 0:00 for recording without duration', () => {
      const recording = createRecording('classroom-1', 'user-123');
      
      expect(getRecordingDuration(recording)).toBe('0:00');
    });

    test('should format duration correctly for seconds only', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.duration = 30000; // 30 seconds
      
      expect(getRecordingDuration(recording)).toBe('0:30');
    });

    test('should format duration correctly for minutes and seconds', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.duration = 125000; // 2 minutes 5 seconds
      
      expect(getRecordingDuration(recording)).toBe('2:05');
    });

    test('should format duration correctly for long duration', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.duration = 3661000; // 61 minutes 1 second
      
      expect(getRecordingDuration(recording)).toBe('61:01');
    });
  });

  describe('getRecordingFileSize', () => {
    test('should return 0 B for recording without file size', () => {
      const recording = createRecording('classroom-1', 'user-123');
      
      expect(getRecordingFileSize(recording)).toBe('0 B');
    });

    test('should format file size correctly for bytes', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.fileSize = 500;
      
      expect(getRecordingFileSize(recording)).toBe('500.0 B');
    });

    test('should format file size correctly for KB', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.fileSize = 1536; // 1.5 KB
      
      expect(getRecordingFileSize(recording)).toBe('1.5 KB');
    });

    test('should format file size correctly for MB', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.fileSize = 2.5 * 1024 * 1024; // 2.5 MB
      
      expect(getRecordingFileSize(recording)).toBe('2.5 MB');
    });

    test('should format file size correctly for GB', () => {
      const recording = createRecording('classroom-1', 'user-123');
      recording.fileSize = 1.2 * 1024 * 1024 * 1024; // 1.2 GB
      
      expect(getRecordingFileSize(recording)).toBe('1.2 GB');
    });
  });

  describe('MediaRecorder integration', () => {
    test('should handle data available events', async () => {
      const recording = createRecording('classroom-1', 'user-123');
      const stream = mockMediaStream;
      
      let dataAvailableCallback: ((event: any) => void) | null = null;
      
      // Mock MediaRecorder to capture ondataavailable callback
      const MockMediaRecorder = jest.fn().mockImplementation(() => {
        const recorder = { ...mockMediaRecorder };
        Object.defineProperty(recorder, 'ondataavailable', {
          set: (callback) => { dataAvailableCallback = callback; },
          get: () => dataAvailableCallback,
        });
        return recorder;
      });
      
      Object.defineProperty(window, 'MediaRecorder', {
        value: MockMediaRecorder,
        writable: true,
      });
      
      await startRecordingWithRetry(recording, stream);
      
      // Simulate data available event
      if (dataAvailableCallback) {
        const mockEvent = {
          data: new Blob(['test data'], { type: 'video/webm' }),
          size: 100,
        };
        dataAvailableCallback(mockEvent);
      }
      
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
    });

    test('should handle stop events', async () => {
      const recording = createRecording('classroom-1', 'user-123');
      const stream = mockMediaStream;
      
      let stopCallback: (() => void) | null = null;
      
      // Mock MediaRecorder to capture onstop callback
      const MockMediaRecorder = jest.fn().mockImplementation(() => {
        const recorder = { ...mockMediaRecorder };
        Object.defineProperty(recorder, 'onstop', {
          set: (callback) => { stopCallback = callback; },
          get: () => stopCallback,
        });
        return recorder;
      });
      
      Object.defineProperty(window, 'MediaRecorder', {
        value: MockMediaRecorder,
        writable: true,
      });
      
      await startRecordingWithRetry(recording, stream);
      
      // Simulate stop event
      if (stopCallback) {
        stopCallback();
      }
      
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
    });
  });
});
