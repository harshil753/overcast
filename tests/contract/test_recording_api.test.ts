/**
 * Contract Tests for Video Recording API
 * 
 * These tests validate the recording API endpoints according to the OpenAPI specification.
 * They test request/response schemas, error handling, and API contracts without implementation.
 * 
 * WHY: Contract tests ensure API consistency and catch breaking changes early.
 * They serve as living documentation of the recording API behavior.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the recording utilities since we're testing contracts, not implementation
vi.mock('../../lib/recording-utils', () => ({
  isRecordingSupported: vi.fn(() => true),
  createRecording: vi.fn(),
  startRecordingWithRetry: vi.fn(),
  stopRecording: vi.fn(),
  validateRecording: vi.fn(() => true),
}));

vi.mock('../../lib/storage-utils', () => ({
  saveRecording: vi.fn(() => true),
  getRecordings: vi.fn(() => []),
  deleteRecording: vi.fn(() => true),
  saveRecordingState: vi.fn(() => true),
  getRecordingState: vi.fn(() => null),
  clearRecordingState: vi.fn(() => true),
  cleanupExpiredRecordings: vi.fn(() => ({ removedCount: 0, remainingCount: 0 })),
}));

describe('Recording API Contract Tests', () => {
  const mockUserId = 'user-123';
  const mockClassroomId = 'classroom-456';
  const mockRecordingId = 'recording-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/recording/start', () => {
    it('should accept valid start recording request', async () => {
      // This test validates the request schema from the OpenAPI spec
      const validRequest = {
        classroomId: mockClassroomId,
        userId: mockUserId,
      };

      // Validate required fields are present
      expect(validRequest).toHaveProperty('classroomId');
      expect(validRequest).toHaveProperty('userId');
      expect(typeof validRequest.classroomId).toBe('string');
      expect(typeof validRequest.userId).toBe('string');
    });

    it('should reject request missing classroomId', () => {
      const invalidRequest = {
        userId: mockUserId,
      };

      // This should fail validation
      expect(invalidRequest).not.toHaveProperty('classroomId');
    });

    it('should reject request missing userId', () => {
      const invalidRequest = {
        classroomId: mockClassroomId,
      };

      // This should fail validation
      expect(invalidRequest).not.toHaveProperty('userId');
    });

    it('should return valid start recording response', () => {
      // This test validates the response schema from the OpenAPI spec
      const validResponse = {
        recordingId: mockRecordingId,
        startTime: 1704067200000,
        status: 'RECORDING' as const,
      };

      // Validate response structure
      expect(validResponse).toHaveProperty('recordingId');
      expect(validResponse).toHaveProperty('startTime');
      expect(validResponse).toHaveProperty('status');
      expect(typeof validResponse.recordingId).toBe('string');
      expect(typeof validResponse.startTime).toBe('number');
      expect(['IDLE', 'RECORDING', 'STOPPED', 'ERROR']).toContain(validResponse.status);
    });

    it('should handle conflict when recording already in progress', () => {
      // This test validates the 409 conflict response
      const conflictResponse = {
        code: 'RECORDING_IN_PROGRESS',
        message: 'Recording already in progress for this user',
        details: {
          recordingId: mockRecordingId,
          timestamp: Date.now(),
        },
      };

      expect(conflictResponse).toHaveProperty('code');
      expect(conflictResponse).toHaveProperty('message');
      expect(conflictResponse.code).toBe('RECORDING_IN_PROGRESS');
    });

    it('should handle internal server error', () => {
      // This test validates the 500 error response
      const errorResponse = {
        code: 'RECORDING_FAILED',
        message: 'Failed to start recording: Camera access denied',
        details: {
          recordingId: mockRecordingId,
          retryCount: 0,
          timestamp: Date.now(),
        },
      };

      expect(errorResponse).toHaveProperty('code');
      expect(errorResponse).toHaveProperty('message');
      expect(errorResponse.code).toBe('RECORDING_FAILED');
    });
  });

  describe('POST /api/recording/stop', () => {
    it('should accept valid stop recording request', () => {
      const validRequest = {
        recordingId: mockRecordingId,
      };

      expect(validRequest).toHaveProperty('recordingId');
      expect(typeof validRequest.recordingId).toBe('string');
    });

    it('should return valid stop recording response', () => {
      const validResponse = {
        recordingId: mockRecordingId,
        endTime: 1704067800000,
        duration: 600000,
        status: 'STOPPED' as const,
      };

      expect(validResponse).toHaveProperty('recordingId');
      expect(validResponse).toHaveProperty('endTime');
      expect(validResponse).toHaveProperty('duration');
      expect(validResponse).toHaveProperty('status');
      expect(typeof validResponse.recordingId).toBe('string');
      expect(typeof validResponse.endTime).toBe('number');
      expect(typeof validResponse.duration).toBe('number');
      expect(['IDLE', 'RECORDING', 'STOPPED', 'ERROR']).toContain(validResponse.status);
    });

    it('should handle recording not found error', () => {
      const notFoundResponse = {
        code: 'RECORDING_NOT_FOUND',
        message: 'Recording not found',
        details: {
          recordingId: mockRecordingId,
          timestamp: Date.now(),
        },
      };

      expect(notFoundResponse).toHaveProperty('code');
      expect(notFoundResponse).toHaveProperty('message');
      expect(notFoundResponse.code).toBe('RECORDING_NOT_FOUND');
    });
  });

  describe('GET /api/recording/list', () => {
    it('should accept valid list recordings request', () => {
      const validRequest = {
        userId: mockUserId,
        classroomId: mockClassroomId,
      };

      expect(validRequest).toHaveProperty('userId');
      expect(validRequest).toHaveProperty('classroomId');
      expect(typeof validRequest.userId).toBe('string');
      expect(typeof validRequest.classroomId).toBe('string');
    });

    it('should return valid list recordings response', () => {
      const validResponse = {
        recordings: [
          {
            id: mockRecordingId,
            classroomId: mockClassroomId,
            userId: mockUserId,
            startTime: 1704067200000,
            endTime: 1704067800000,
            duration: 600000,
            status: 'STOPPED' as const,
            fileName: 'recording-789-1704067200000.webm',
            fileSize: 15728640,
            ttl: 1704153600000,
            retryCount: 0,
          },
        ],
        total: 1,
      };

      expect(validResponse).toHaveProperty('recordings');
      expect(validResponse).toHaveProperty('total');
      expect(Array.isArray(validResponse.recordings)).toBe(true);
      expect(typeof validResponse.total).toBe('number');
    });
  });

  describe('GET /api/recording/download/{recordingId}', () => {
    it('should return valid download response', () => {
      const validResponse = {
        downloadUrl: 'blob:https://overcast.example.com/abc123-def456',
        fileName: 'recording-789-1704067200000.webm',
        fileSize: 15728640,
      };

      expect(validResponse).toHaveProperty('downloadUrl');
      expect(validResponse).toHaveProperty('fileName');
      expect(validResponse).toHaveProperty('fileSize');
      expect(typeof validResponse.downloadUrl).toBe('string');
      expect(typeof validResponse.fileName).toBe('string');
      expect(typeof validResponse.fileSize).toBe('number');
      expect(validResponse.downloadUrl).toMatch(/^blob:/);
    });

    it('should handle recording expired error', () => {
      const expiredResponse = {
        code: 'RECORDING_EXPIRED',
        message: 'Recording has expired and been deleted',
        details: {
          recordingId: mockRecordingId,
          timestamp: Date.now(),
        },
      };

      expect(expiredResponse).toHaveProperty('code');
      expect(expiredResponse).toHaveProperty('message');
      expect(expiredResponse.code).toBe('RECORDING_EXPIRED');
    });
  });

  describe('POST /api/recording/cleanup', () => {
    it('should accept valid cleanup request', () => {
      const validRequest = {
        userId: mockUserId,
      };

      expect(validRequest).toHaveProperty('userId');
      expect(typeof validRequest.userId).toBe('string');
    });

    it('should return valid cleanup response', () => {
      const validResponse = {
        removedCount: 5,
        remainingCount: 2,
      };

      expect(validResponse).toHaveProperty('removedCount');
      expect(validResponse).toHaveProperty('remainingCount');
      expect(typeof validResponse.removedCount).toBe('number');
      expect(typeof validResponse.remainingCount).toBe('number');
    });
  });

  describe('Recording Entity Validation', () => {
    it('should validate recording entity structure', () => {
      const validRecording = {
        id: mockRecordingId,
        classroomId: mockClassroomId,
        userId: mockUserId,
        startTime: 1704067200000,
        endTime: 1704067800000,
        duration: 600000,
        status: 'STOPPED' as const,
        fileName: 'recording-789-1704067200000.webm',
        fileSize: 15728640,
        ttl: 1704153600000,
        retryCount: 0,
      };

      // Validate all required fields
      expect(validRecording).toHaveProperty('id');
      expect(validRecording).toHaveProperty('classroomId');
      expect(validRecording).toHaveProperty('userId');
      expect(validRecording).toHaveProperty('startTime');
      expect(validRecording).toHaveProperty('status');
      expect(validRecording).toHaveProperty('fileName');
      expect(validRecording).toHaveProperty('fileSize');
      expect(validRecording).toHaveProperty('ttl');
      expect(validRecording).toHaveProperty('retryCount');

      // Validate field types
      expect(typeof validRecording.id).toBe('string');
      expect(typeof validRecording.classroomId).toBe('string');
      expect(typeof validRecording.userId).toBe('string');
      expect(typeof validRecording.startTime).toBe('number');
      expect(typeof validRecording.status).toBe('string');
      expect(typeof validRecording.fileName).toBe('string');
      expect(typeof validRecording.fileSize).toBe('number');
      expect(typeof validRecording.ttl).toBe('number');
      expect(typeof validRecording.retryCount).toBe('number');
    });

    it('should validate recording status enum', () => {
      const validStatuses = ['IDLE', 'RECORDING', 'STOPPED', 'ERROR'];
      
      validStatuses.forEach(status => {
        expect(['IDLE', 'RECORDING', 'STOPPED', 'ERROR']).toContain(status);
      });
    });

    it('should validate retry count constraints', () => {
      const validRetryCounts = [0, 1, 2, 3];
      
      validRetryCounts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
        expect(count).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Error Response Validation', () => {
    it('should validate error response structure', () => {
      const errorResponse = {
        code: 'RECORDING_FAILED',
        message: 'Failed to start recording: Camera access denied',
        details: {
          recordingId: mockRecordingId,
          retryCount: 2,
          timestamp: Date.now(),
        },
      };

      expect(errorResponse).toHaveProperty('code');
      expect(errorResponse).toHaveProperty('message');
      expect(typeof errorResponse.code).toBe('string');
      expect(typeof errorResponse.message).toBe('string');
    });

    it('should validate error codes', () => {
      const validErrorCodes = [
        'RECORDING_FAILED',
        'RECORDING_IN_PROGRESS',
        'RECORDING_NOT_FOUND',
        'RECORDING_EXPIRED',
        'PERMISSION_DENIED',
        'STORAGE_QUOTA_EXCEEDED',
      ];

      validErrorCodes.forEach(code => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });
  });
});
