/**
 * Unit Test: Storage Utilities
 * 
 * Tests the storage utilities module with comprehensive coverage of
 * localStorage operations, TTL cleanup, storage quota management, and error handling.
 * 
 * Validates: localStorage CRUD operations, TTL cleanup, storage quota management, error handling
 */

import {
  isLocalStorageAvailable,
  getStorageUsage,
  isStorageQuotaExceeded,
  saveRecording,
  getRecordings,
  getRecordingsForClassroom,
  deleteRecording,
  saveRecordingState,
  getRecordingState,
  clearRecordingState,
  cleanupExpiredRecordings,
  getStorageStats,
  clearAllUserData,
} from '@/lib/storage-utils';
import { Recording, RecordingState, RecordingStatus } from '@/lib/types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.fn();

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    // Mock console.error
    Object.defineProperty(console, 'error', {
      value: mockConsoleError,
      writable: true,
    });
    
    // Reset localStorage mock state
    mockLocalStorage.length = 0;
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    mockLocalStorage.key.mockReturnValue(null);
  });

  describe('isLocalStorageAvailable', () => {
    test('should return true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    test('should return false when localStorage throws error', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      expect(isLocalStorageAvailable()).toBe(false);
    });

    test('should return false when localStorage is undefined', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      expect(isLocalStorageAvailable()).toBe(false);
    });
  });

  describe('getStorageUsage', () => {
    test('should return 0 when localStorage is not available', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      expect(getStorageUsage()).toBe(0);
    });

    test('should calculate storage usage for overcast keys', () => {
      mockLocalStorage.length = 3;
      mockLocalStorage.key
        .mockReturnValueOnce('overcast-recordings-user1')
        .mockReturnValueOnce('overcast-recording-state-user1-classroom1')
        .mockReturnValueOnce('other-key');
      
      mockLocalStorage.getItem
        .mockReturnValueOnce('{"recordings": [{"id": "1", "data": "test"}]}')
        .mockReturnValueOnce('{"state": "test"}')
        .mockReturnValueOnce('other-data');
      
      const usage = getStorageUsage();
      
      // Should only count overcast keys
      expect(usage).toBeGreaterThan(0);
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(3);
    });

    test('should handle null values gracefully', () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockReturnValue('overcast-recordings-user1');
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const usage = getStorageUsage();
      
      expect(usage).toBe(0);
    });
  });

  describe('isStorageQuotaExceeded', () => {
    test('should return false when storage usage is within quota', () => {
      // Mock getStorageUsage to return a small value
      jest.spyOn(require('@/lib/storage-utils'), 'getStorageUsage').mockReturnValue(1024);
      
      expect(isStorageQuotaExceeded()).toBe(false);
    });

    test('should return true when storage usage exceeds quota', () => {
      // Mock getStorageUsage to return a large value
      jest.spyOn(require('@/lib/storage-utils'), 'getStorageUsage').mockReturnValue(6 * 1024 * 1024);
      
      expect(isStorageQuotaExceeded()).toBe(true);
    });
  });

  describe('saveRecording', () => {
    test('should save recording successfully', () => {
      const recording: Recording = {
        id: 'recording-1',
        classroomId: 'classroom-1',
        userId: 'user-1',
        startTime: Date.now(),
        status: 'IDLE' as RecordingStatus,
        fileName: 'test.webm',
        fileSize: 1024,
        ttl: Date.now() + 86400000,
        retryCount: 0,
      };
      
      const result = saveRecording(recording);
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'overcast-recordings-user-1',
        expect.stringContaining('recording-1')
      );
    });

    test('should return false when localStorage is not available', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      const recording: Recording = {
        id: 'recording-1',
        classroomId: 'classroom-1',
        userId: 'user-1',
        startTime: Date.now(),
        status: 'IDLE' as RecordingStatus,
        fileName: 'test.webm',
        fileSize: 1024,
        ttl: Date.now() + 86400000,
        retryCount: 0,
      };
      
      const result = saveRecording(recording);
      
      expect(result).toBe(false);
    });

    test('should handle localStorage errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const recording: Recording = {
        id: 'recording-1',
        classroomId: 'classroom-1',
        userId: 'user-1',
        startTime: Date.now(),
        status: 'IDLE' as RecordingStatus,
        fileName: 'test.webm',
        fileSize: 1024,
        ttl: Date.now() + 86400000,
        retryCount: 0,
      };
      
      const result = saveRecording(recording);
      
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to save recording:', expect.any(Error));
    });

    test('should update existing recording', () => {
      const existingRecordings = [
        {
          id: 'recording-1',
          classroomId: 'classroom-1',
          userId: 'user-1',
          startTime: Date.now(),
          status: 'IDLE' as RecordingStatus,
          fileName: 'test.webm',
          fileSize: 1024,
          ttl: Date.now() + 86400000,
          retryCount: 0,
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingRecordings));
      
      const updatedRecording: Recording = {
        id: 'recording-1',
        classroomId: 'classroom-1',
        userId: 'user-1',
        startTime: Date.now(),
        status: 'RECORDING' as RecordingStatus,
        fileName: 'test.webm',
        fileSize: 2048,
        ttl: Date.now() + 86400000,
        retryCount: 0,
      };
      
      const result = saveRecording(updatedRecording);
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'overcast-recordings-user-1',
        expect.stringContaining('"status":"RECORDING"')
      );
    });
  });

  describe('getRecordings', () => {
    test('should return empty array when no recordings exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const recordings = getRecordings('user-1');
      
      expect(recordings).toEqual([]);
    });

    test('should return recordings for user', () => {
      const storedRecordings = [
        {
          id: 'recording-1',
          classroomId: 'classroom-1',
          userId: 'user-1',
          startTime: Date.now(),
          status: 'IDLE' as RecordingStatus,
          fileName: 'test.webm',
          fileSize: 1024,
          ttl: Date.now() + 86400000,
          retryCount: 0,
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedRecordings));
      
      const recordings = getRecordings('user-1');
      
      expect(recordings).toHaveLength(1);
      expect(recordings[0].id).toBe('recording-1');
    });

    test('should return empty array when localStorage is not available', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      const recordings = getRecordings('user-1');
      
      expect(recordings).toEqual([]);
    });

    test('should handle JSON parse errors', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const recordings = getRecordings('user-1');
      
      expect(recordings).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to get recordings:', expect.any(Error));
    });
  });

  describe('getRecordingsForClassroom', () => {
    test('should return recordings for specific classroom', () => {
      const storedRecordings = [
        {
          id: 'recording-1',
          classroomId: 'classroom-1',
          userId: 'user-1',
          startTime: Date.now(),
          status: 'IDLE' as RecordingStatus,
          fileName: 'test.webm',
          fileSize: 1024,
          ttl: Date.now() + 86400000,
          retryCount: 0,
        },
        {
          id: 'recording-2',
          classroomId: 'classroom-2',
          userId: 'user-1',
          startTime: Date.now(),
          status: 'IDLE' as RecordingStatus,
          fileName: 'test2.webm',
          fileSize: 2048,
          ttl: Date.now() + 86400000,
          retryCount: 0,
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedRecordings));
      
      const recordings = getRecordingsForClassroom('user-1', 'classroom-1');
      
      expect(recordings).toHaveLength(1);
      expect(recordings[0].classroomId).toBe('classroom-1');
    });
  });

  describe('deleteRecording', () => {
    test('should delete recording successfully', () => {
      const storedRecordings = [
        {
          id: 'recording-1',
          classroomId: 'classroom-1',
          userId: 'user-1',
          startTime: Date.now(),
          status: 'IDLE' as RecordingStatus,
          fileName: 'test.webm',
          fileSize: 1024,
          ttl: Date.now() + 86400000,
          retryCount: 0,
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedRecordings));
      
      const result = deleteRecording('user-1', 'recording-1');
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'overcast-recordings-user-1',
        '[]'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'overcast-recording-files-recording-1'
      );
    });

    test('should return false when localStorage is not available', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      const result = deleteRecording('user-1', 'recording-1');
      
      expect(result).toBe(false);
    });

    test('should handle localStorage errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = deleteRecording('user-1', 'recording-1');
      
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to delete recording:', expect.any(Error));
    });
  });

  describe('saveRecordingState', () => {
    test('should save recording state successfully', () => {
      const state: RecordingState = {
        userId: 'user-1',
        classroomId: 'classroom-1',
        isRecording: true,
        activeRecordingId: 'recording-1',
        recordings: ['recording-1'],
        retryAttempts: 0,
      };
      
      const result = saveRecordingState(state);
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'overcast-recording-state-user-1-classroom-1',
        expect.stringContaining('"isRecording":true')
      );
    });

    test('should return false when localStorage is not available', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      const state: RecordingState = {
        userId: 'user-1',
        classroomId: 'classroom-1',
        isRecording: false,
        recordings: [],
        retryAttempts: 0,
      };
      
      const result = saveRecordingState(state);
      
      expect(result).toBe(false);
    });
  });

  describe('getRecordingState', () => {
    test('should return recording state when it exists', () => {
      const storedState = {
        userId: 'user-1',
        classroomId: 'classroom-1',
        isRecording: true,
        activeRecordingId: 'recording-1',
        recordings: ['recording-1'],
        retryAttempts: 0,
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedState));
      
      const state = getRecordingState('user-1', 'classroom-1');
      
      expect(state).toEqual(storedState);
    });

    test('should return null when state does not exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const state = getRecordingState('user-1', 'classroom-1');
      
      expect(state).toBeNull();
    });

    test('should return null when localStorage is not available', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      const state = getRecordingState('user-1', 'classroom-1');
      
      expect(state).toBeNull();
    });
  });

  describe('clearRecordingState', () => {
    test('should clear recording state successfully', () => {
      const result = clearRecordingState('user-1', 'classroom-1');
      
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'overcast-recording-state-user-1-classroom-1'
      );
    });

    test('should return false when localStorage is not available', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      const result = clearRecordingState('user-1', 'classroom-1');
      
      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredRecordings', () => {
    test('should remove expired recordings', () => {
      const now = Date.now();
      const expiredTime = now - 86400000; // 24 hours ago
      const validTime = now + 86400000; // 24 hours from now
      
      const storedRecordings = [
        {
          id: 'recording-1',
          classroomId: 'classroom-1',
          userId: 'user-1',
          startTime: expiredTime,
          status: 'STOPPED' as RecordingStatus,
          fileName: 'test.webm',
          fileSize: 1024,
          ttl: expiredTime + 86400000, // Expired
          retryCount: 0,
        },
        {
          id: 'recording-2',
          classroomId: 'classroom-1',
          userId: 'user-1',
          startTime: now,
          status: 'STOPPED' as RecordingStatus,
          fileName: 'test2.webm',
          fileSize: 2048,
          ttl: validTime, // Not expired
          retryCount: 0,
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedRecordings));
      
      const result = cleanupExpiredRecordings('user-1');
      
      expect(result.removedCount).toBe(1);
      expect(result.remainingCount).toBe(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'overcast-recordings-user-1',
        expect.stringContaining('recording-2')
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'overcast-recording-files-recording-1'
      );
    });

    test('should return zero counts when no expired recordings', () => {
      const now = Date.now();
      const validTime = now + 86400000; // 24 hours from now
      
      const storedRecordings = [
        {
          id: 'recording-1',
          classroomId: 'classroom-1',
          userId: 'user-1',
          startTime: now,
          status: 'STOPPED' as RecordingStatus,
          fileName: 'test.webm',
          fileSize: 1024,
          ttl: validTime, // Not expired
          retryCount: 0,
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedRecordings));
      
      const result = cleanupExpiredRecordings('user-1');
      
      expect(result.removedCount).toBe(0);
      expect(result.remainingCount).toBe(1);
    });
  });

  describe('getStorageStats', () => {
    test('should return storage statistics', () => {
      // Mock getStorageUsage
      jest.spyOn(require('@/lib/storage-utils'), 'getStorageUsage').mockReturnValue(1024);
      
      mockLocalStorage.length = 2;
      mockLocalStorage.key
        .mockReturnValueOnce('overcast-recordings-user1')
        .mockReturnValueOnce('overcast-recordings-user2');
      
      const now = Date.now();
      const expiredTime = now - 86400000;
      const validTime = now + 86400000;
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify([
          { id: 'recording-1', ttl: expiredTime }, // Expired
          { id: 'recording-2', ttl: validTime },   // Valid
        ]))
        .mockReturnValueOnce(JSON.stringify([
          { id: 'recording-3', ttl: validTime },  // Valid
        ]));
      
      const stats = getStorageStats();
      
      expect(stats.totalSize).toBe(1024);
      expect(stats.recordingCount).toBe(3);
      expect(stats.expiredCount).toBe(1);
    });

    test('should handle JSON parse errors in stats calculation', () => {
      jest.spyOn(require('@/lib/storage-utils'), 'getStorageUsage').mockReturnValue(0);
      
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockReturnValue('overcast-recordings-user1');
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const stats = getStorageStats();
      
      expect(stats.totalSize).toBe(0);
      expect(stats.recordingCount).toBe(0);
      expect(stats.expiredCount).toBe(0);
    });
  });

  describe('clearAllUserData', () => {
    test('should clear all user data successfully', () => {
      mockLocalStorage.length = 3;
      mockLocalStorage.key
        .mockReturnValueOnce('overcast-recordings-user1')
        .mockReturnValueOnce('overcast-recording-state-user1-classroom1')
        .mockReturnValueOnce('overcast-recording-state-user1-classroom2');
      
      const result = clearAllUserData('user1');
      
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('overcast-recordings-user1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('overcast-recording-state-user1-classroom1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('overcast-recording-state-user1-classroom2');
    });

    test('should return false when localStorage is not available', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      const result = clearAllUserData('user1');
      
      expect(result).toBe(false);
    });

    test('should handle localStorage errors', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = clearAllUserData('user1');
      
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to clear user data:', expect.any(Error));
    });
  });

  describe('Error handling', () => {
    test('should handle localStorage quota exceeded', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        const error = new Error('Quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      });
      
      const recording: Recording = {
        id: 'recording-1',
        classroomId: 'classroom-1',
        userId: 'user-1',
        startTime: Date.now(),
        status: 'IDLE' as RecordingStatus,
        fileName: 'test.webm',
        fileSize: 1024,
        ttl: Date.now() + 86400000,
        retryCount: 0,
      };
      
      const result = saveRecording(recording);
      
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to save recording:', expect.any(Error));
    });

    test('should handle network errors', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Network error');
      });
      
      const recordings = getRecordings('user-1');
      
      expect(recordings).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to get recordings:', expect.any(Error));
    });
  });
});
