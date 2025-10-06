/**
 * useRecording Hook for Overcast Video Recording
 * 
 * This React hook provides recording state management with start/stop/retry functionality
 * and error handling. It integrates with the recording utilities and storage systems
 * to provide a complete recording experience.
 * 
 * Key Features:
 * - Recording state management (start, stop, retry)
 * - Error handling with user-friendly messages
 * - Automatic cleanup on component unmount
 * - Integration with localStorage for persistence
 * - Real-time recording status updates
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Recording, 
  RecordingState, 
  RecordingStatus,
  RecordingFile 
} from '../../lib/types';
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
  getRecordingFileSize
} from '../../lib/recording-utils';
import {
  saveRecording,
  getRecordings,
  getRecordingsForClassroom,
  deleteRecording,
  saveRecordingState,
  getRecordingState,
  clearRecordingState,
  cleanupExpiredRecordings,
  isStorageQuotaExceeded
} from '../../lib/storage-utils';

/**
 * Hook return type
 */
interface UseRecordingReturn {
  // Recording state
  isRecording: boolean;
  isSupported: boolean;
  currentRecording: Recording | null;
  recordings: Recording[];
  
  // Recording actions
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<boolean>;
  retryRecording: () => Promise<boolean>;
  
  // Recording management
  downloadRecording: (recordingId: string) => Promise<void>;
  deleteRecording: (recordingId: string) => Promise<boolean>;
  clearAllRecordings: () => Promise<boolean>;
  
  // Status and info
  statusMessage: string;
  error: string | null;
  isLoading: boolean;
  
  // Utility functions
  getRecordingDuration: (recording: Recording) => string;
  getRecordingFileSize: (recording: Recording) => string;
  isRecordingExpired: (recording: Recording) => boolean;
}

/**
 * useRecording hook configuration
 */
interface UseRecordingConfig {
  userId: string;
  classroomId: string;
  autoCleanup?: boolean;
  onError?: (error: string) => void;
  onRecordingStart?: (recording: Recording) => void;
  onRecordingStop?: (recording: Recording) => void;
}

/**
 * Custom hook for recording management
 * @param {UseRecordingConfig} config - Hook configuration
 * @returns {UseRecordingReturn} Recording state and actions
 */
export const useRecording = (config: UseRecordingConfig): UseRecordingReturn => {
  const { userId, classroomId, autoCleanup = true, onError, onRecordingStart, onRecordingStop } = config;
  
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for cleanup
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  
  /**
   * Initialize recording support and load existing recordings
   */
  useEffect(() => {
    const initialize = async () => {
      setIsSupported(isRecordingSupported());
      
      if (autoCleanup) {
        // Clean up expired recordings
        const cleanupResult = cleanupExpiredRecordings(userId);
        if (cleanupResult.removedCount > 0) {
          console.log(`Cleaned up ${cleanupResult.removedCount} expired recordings`);
        }
      }
      
      // Load existing recordings for this classroom
      const existingRecordings = getRecordingsForClassroom(userId, classroomId);
      setRecordings(existingRecordings);
      
      // Load recording state
      const recordingState = getRecordingState(userId, classroomId);
      if (recordingState) {
        setIsRecording(recordingState.isRecording);
        if (recordingState.activeRecordingId) {
          const activeRecording = existingRecordings.find(r => r.id === recordingState.activeRecordingId);
          setCurrentRecording(activeRecording || null);
        }
      }
    };
    
    initialize();
  }, [userId, classroomId, autoCleanup]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Stop any active recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Revoke any active download URLs
      recordings.forEach(recording => {
        if (recording.status === 'STOPPED') {
          // Clean up any blob URLs
        }
      });
      
      // Clear media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  /**
   * Start recording
   */
  const startRecording = useCallback(async (): Promise<boolean> => {
    if (isRecording || !isSupported) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check storage quota
      if (isStorageQuotaExceeded()) {
        throw new Error('Storage quota exceeded. Please clear old recordings.');
      }
      
      // Get media stream
      const stream = await getUserMediaStream();
      mediaStreamRef.current = stream;
      
      // Create new recording
      const recording = createRecording(classroomId, userId);
      setCurrentRecording(recording);
      
      // Start recording with retry logic
      const updatedRecording = await startRecordingWithRetry(recording, stream);
      
      if (updatedRecording.status === 'ERROR') {
        throw new Error(updatedRecording.errorMessage || 'Failed to start recording');
      }
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
        const finalRecording = stopRecording(updatedRecording, blob);
        
        // Save recording
        saveRecording(finalRecording);
        
        // Update state
        setCurrentRecording(null);
        setIsRecording(false);
        setRecordings(prev => [...prev, finalRecording]);
        
        // Save recording state
        const recordingState: RecordingState = {
          userId,
          classroomId,
          isRecording: false,
          activeRecordingId: undefined,
          recordings: [...recordings.map(r => r.id), finalRecording.id],
          retryAttempts: 0,
        };
        saveRecordingState(recordingState);
        
        onRecordingStop?.(finalRecording);
      };
      
      mediaRecorder.onerror = (event) => {
        throw new Error(`MediaRecorder error: ${event}`);
      };
      
      // Start recording
      mediaRecorder.start(1000);
      
      // Update state
      setIsRecording(true);
      setCurrentRecording(updatedRecording);
      
      // Save recording state
      const recordingState: RecordingState = {
        userId,
        classroomId,
        isRecording: true,
        activeRecordingId: updatedRecording.id,
        recordings: recordings.map(r => r.id),
        retryAttempts: updatedRecording.retryCount,
      };
      saveRecordingState(recordingState);
      
      onRecordingStart?.(updatedRecording);
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isRecording, isSupported, userId, classroomId, recordings, onError, onRecordingStart, onRecordingStop]);
  
  /**
   * Stop recording
   */
  const stopRecordingAction = useCallback(async (): Promise<boolean> => {
    if (!isRecording || !mediaRecorderRef.current) {
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Stop MediaRecorder
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop media stream tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isRecording, onError]);
  
  /**
   * Retry recording
   */
  const retryRecording = useCallback(async (): Promise<boolean> => {
    if (!currentRecording || currentRecording.status !== 'ERROR') {
      return false;
    }
    
    setError(null);
    return await startRecording();
  }, [currentRecording, startRecording]);
  
  /**
   * Download recording
   */
  const downloadRecording = useCallback(async (recordingId: string): Promise<void> => {
    const recording = recordings.find(r => r.id === recordingId);
    if (!recording) {
      throw new Error('Recording not found');
    }
    
    // For now, we'll need to implement file retrieval from storage
    // This is a placeholder for the actual implementation
    console.log('Download recording:', recordingId);
  }, [recordings]);
  
  /**
   * Delete recording
   */
  const deleteRecordingAction = useCallback(async (recordingId: string): Promise<boolean> => {
    const success = deleteRecording(userId, recordingId);
    if (success) {
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
    }
    return success;
  }, [userId]);
  
  /**
   * Clear all recordings
   */
  const clearAllRecordings = useCallback(async (): Promise<boolean> => {
    const success = deleteRecording(userId, 'all'); // This would need to be implemented
    if (success) {
      setRecordings([]);
    }
    return success;
  }, [userId]);
  
  /**
   * Get status message
   */
  const statusMessage = currentRecording ? getRecordingStatusMessage(currentRecording) : 'Ready to record';
  
  return {
    // Recording state
    isRecording,
    isSupported,
    currentRecording,
    recordings,
    
    // Recording actions
    startRecording,
    stopRecording: stopRecordingAction,
    retryRecording,
    
    // Recording management
    downloadRecording,
    deleteRecording: deleteRecordingAction,
    clearAllRecordings,
    
    // Status and info
    statusMessage,
    error,
    isLoading,
    
    // Utility functions
    getRecordingDuration,
    getRecordingFileSize,
    isRecordingExpired,
  };
};
