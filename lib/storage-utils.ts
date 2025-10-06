/**
 * Storage Utilities for Overcast Video Recording
 * 
 * This module handles localStorage management for recording metadata with TTL cleanup,
 * JSON serialization, and storage quota handling. It provides a simple interface
 * for storing and retrieving recording data without server dependencies.
 * 
 * Key Features:
 * - localStorage CRUD operations with error handling
 * - TTL-based automatic cleanup of expired recordings
 * - Storage quota management and monitoring
 * - JSON serialization with validation
 * - User session state persistence
 */

import { Recording, RecordingState, StoredRecording, StoredRecordingState } from './types';

/**
 * Storage keys for different data types
 */
const STORAGE_KEYS = {
  RECORDINGS: (userId: string) => `overcast-recordings-${userId}`,
  RECORDING_STATE: (userId: string, classroomId: string) => `overcast-recording-state-${userId}-${classroomId}`,
  RECORDING_FILES: (recordingId: string) => `overcast-recording-files-${recordingId}`,
} as const;

/**
 * Maximum storage quota in bytes (5MB default)
 */
const MAX_STORAGE_QUOTA = 5 * 1024 * 1024;

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is supported
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get current storage usage in bytes
 * @returns {number} Current storage usage
 */
export const getStorageUsage = (): number => {
  if (!isLocalStorageAvailable()) {
    return 0;
  }
  
  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('overcast-')) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    }
  }
  
  return totalSize;
};

/**
 * Check if storage quota is exceeded
 * @returns {boolean} True if storage quota is exceeded
 */
export const isStorageQuotaExceeded = (): boolean => {
  return getStorageUsage() > MAX_STORAGE_QUOTA;
};

/**
 * Save recording to localStorage
 * @param {Recording} recording - Recording to save
 * @returns {boolean} True if saved successfully
 */
export const saveRecording = (recording: Recording): boolean => {
  if (!isLocalStorageAvailable()) {
    console.error('localStorage is not available');
    return false;
  }
  
  try {
    const key = STORAGE_KEYS.RECORDINGS(recording.userId);
    const existingRecordings = getRecordings(recording.userId);
    
    // Update existing recording or add new one
    const updatedRecordings = existingRecordings.filter(r => r.id !== recording.id);
    
    const storedRecording: StoredRecording = {
      id: recording.id,
      classroomId: recording.classroomId,
      userId: recording.userId,
      startTime: recording.startTime,
      endTime: recording.endTime,
      duration: recording.duration,
      status: recording.status,
      fileName: recording.fileName,
      fileSize: recording.fileSize,
      ttl: recording.ttl,
      retryCount: recording.retryCount,
      errorMessage: recording.errorMessage,
    };
    
    updatedRecordings.push(storedRecording);
    localStorage.setItem(key, JSON.stringify(updatedRecordings));
    return true;
  } catch (error) {
    console.error('Failed to save recording:', error);
    return false;
  }
};

/**
 * Get all recordings for a user
 * @param {string} userId - User ID
 * @returns {Recording[]} Array of recordings
 */
export const getRecordings = (userId: string): Recording[] => {
  if (!isLocalStorageAvailable()) {
    return [];
  }
  
  try {
    const key = STORAGE_KEYS.RECORDINGS(userId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return [];
    }
    
    const storedRecordings: StoredRecording[] = JSON.parse(stored);
    
    // Convert stored recordings back to Recording objects
    return storedRecordings.map(stored => ({
      id: stored.id,
      classroomId: stored.classroomId,
      userId: stored.userId,
      startTime: stored.startTime,
      endTime: stored.endTime,
      duration: stored.duration,
      status: stored.status,
      fileName: stored.fileName,
      fileSize: stored.fileSize,
      ttl: stored.ttl,
      retryCount: stored.retryCount,
      errorMessage: stored.errorMessage,
    }));
  } catch (error) {
    console.error('Failed to get recordings:', error);
    return [];
  }
};

/**
 * Get all recordings from localStorage (regardless of user)
 * @returns {Recording[]} Array of all recordings
 */
export const getAllRecordings = (): Recording[] => {
  if (!isLocalStorageAvailable()) {
    return [];
  }
  
  try {
    const allRecordings: Recording[] = [];
    
    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('overcast-recordings-')) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const storedRecordings: StoredRecording[] = JSON.parse(stored);
          
          // Convert stored recordings back to Recording objects
          const recordings = storedRecordings.map(stored => ({
            id: stored.id,
            classroomId: stored.classroomId,
            userId: stored.userId,
            startTime: stored.startTime,
            endTime: stored.endTime,
            duration: stored.duration,
            status: stored.status,
            fileName: stored.fileName,
            fileSize: stored.fileSize,
            ttl: stored.ttl,
            retryCount: stored.retryCount,
            errorMessage: stored.errorMessage,
          }));
          
          allRecordings.push(...recordings);
        }
      }
    }
    
    return allRecordings;
  } catch (error) {
    console.error('Failed to get all recordings:', error);
    return [];
  }
};

/**
 * Get recordings for a specific classroom
 * @param {string} userId - User ID
 * @param {string} classroomId - Classroom ID
 * @returns {Recording[]} Array of recordings for the classroom
 */
export const getRecordingsForClassroom = (userId: string, classroomId: string): Recording[] => {
  const allRecordings = getRecordings(userId);
  return allRecordings.filter(recording => recording.classroomId === classroomId);
};

/**
 * Delete a recording
 * @param {string} userId - User ID
 * @param {string} recordingId - Recording ID to delete
 * @returns {boolean} True if deleted successfully
 */
export const deleteRecording = (userId: string, recordingId: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    const key = STORAGE_KEYS.RECORDINGS(userId);
    const recordings = getRecordings(userId);
    const updatedRecordings = recordings.filter(r => r.id !== recordingId);
    
    localStorage.setItem(key, JSON.stringify(updatedRecordings));
    
    // Also remove the recording file if it exists
    const fileKey = STORAGE_KEYS.RECORDING_FILES(recordingId);
    localStorage.removeItem(fileKey);
    
    return true;
  } catch (error) {
    console.error('Failed to delete recording:', error);
    return false;
  }
};

/**
 * Save recording state
 * @param {RecordingState} state - Recording state to save
 * @returns {boolean} True if saved successfully
 */
export const saveRecordingState = (state: RecordingState): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    const key = STORAGE_KEYS.RECORDING_STATE(state.userId, state.classroomId);
    
    const storedState: StoredRecordingState = {
      userId: state.userId,
      classroomId: state.classroomId,
      isRecording: state.isRecording,
      activeRecordingId: state.activeRecordingId,
      recordings: state.recordings,
      lastError: state.lastError,
      retryAttempts: state.retryAttempts,
    };
    
    localStorage.setItem(key, JSON.stringify(storedState));
    return true;
  } catch (error) {
    console.error('Failed to save recording state:', error);
    return false;
  }
};

/**
 * Get recording state
 * @param {string} userId - User ID
 * @param {string} classroomId - Classroom ID
 * @returns {RecordingState | null} Recording state or null if not found
 */
export const getRecordingState = (userId: string, classroomId: string): RecordingState | null => {
  if (!isLocalStorageAvailable()) {
    return null;
  }
  
  try {
    const key = STORAGE_KEYS.RECORDING_STATE(userId, classroomId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }
    
    const storedState: StoredRecordingState = JSON.parse(stored);
    
    return {
      userId: storedState.userId,
      classroomId: storedState.classroomId,
      isRecording: storedState.isRecording,
      activeRecordingId: storedState.activeRecordingId,
      recordings: storedState.recordings,
      lastError: storedState.lastError,
      retryAttempts: storedState.retryAttempts,
    };
  } catch (error) {
    console.error('Failed to get recording state:', error);
    return null;
  }
};

/**
 * Clear recording state
 * @param {string} userId - User ID
 * @param {string} classroomId - Classroom ID
 * @returns {boolean} True if cleared successfully
 */
export const clearRecordingState = (userId: string, classroomId: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    const key = STORAGE_KEYS.RECORDING_STATE(userId, classroomId);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to clear recording state:', error);
    return false;
  }
};

/**
 * Clean up expired recordings
 * @param {string} userId - User ID
 * @returns {{ removedCount: number; remainingCount: number }} Cleanup results
 */
export const cleanupExpiredRecordings = (userId: string): { removedCount: number; remainingCount: number } => {
  const recordings = getRecordings(userId);
  const now = Date.now();
  
  const validRecordings = recordings.filter(recording => {
    // Keep recordings that haven't expired
    return recording.ttl > now;
  });
  
  const expiredRecordings = recordings.filter(recording => {
    // Find recordings that have expired
    return recording.ttl <= now;
  });
  
  // Save the valid recordings back to storage
  if (validRecordings.length !== recordings.length) {
    const key = STORAGE_KEYS.RECORDINGS(userId);
    localStorage.setItem(key, JSON.stringify(validRecordings));
    
    // Remove expired recording files
    expiredRecordings.forEach(recording => {
      const fileKey = STORAGE_KEYS.RECORDING_FILES(recording.id);
      localStorage.removeItem(fileKey);
    });
  }
  
  return {
    removedCount: expiredRecordings.length,
    remainingCount: validRecordings.length,
  };
};

/**
 * Get storage statistics
 * @returns {{ totalSize: number; recordingCount: number; expiredCount: number }} Storage stats
 */
export const getStorageStats = (): { totalSize: number; recordingCount: number; expiredCount: number } => {
  const totalSize = getStorageUsage();
  let recordingCount = 0;
  let expiredCount = 0;
  const now = Date.now();
  
  // Count recordings across all users
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('overcast-recordings-')) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const recordings: StoredRecording[] = JSON.parse(stored);
          recordingCount += recordings.length;
          expiredCount += recordings.filter(r => r.ttl <= now).length;
        }
      } catch (error) {
        console.error('Failed to parse recordings:', error);
      }
    }
  }
  
  return {
    totalSize,
    recordingCount,
    expiredCount,
  };
};

/**
 * Clear all recording data for a user
 * @param {string} userId - User ID
 * @returns {boolean} True if cleared successfully
 */
export const clearAllUserData = (userId: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    // Remove all recordings
    const recordingsKey = STORAGE_KEYS.RECORDINGS(userId);
    localStorage.removeItem(recordingsKey);
    
    // Remove all recording states for this user
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`overcast-recording-state-${userId}-`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return true;
  } catch (error) {
    console.error('Failed to clear user data:', error);
    return false;
  }
};
