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
  RecordingState
} from '../../lib/types';
import { 
  isRecordingSupported,
  getUserMediaStream,
  createRecording,
  startRecordingWithRetry,
  stopRecording,
  isRecordingExpired,
  getRecordingStatusMessage,
  getRecordingDuration,
  getRecordingFileSize
} from '../../lib/recording-utils';
import {
  saveRecording,
  getRecordingsForClassroom,
  deleteRecording,
  saveRecordingState,
  getRecordingState,
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
  }, [recordings]);
  
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
      
      // Check what formats are supported and log them
      console.log('[Recording] Checking supported formats:');
      console.log('  video/mp4;codecs=h264,aac:', MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac'));
      console.log('  video/mp4;codecs=h264:', MediaRecorder.isTypeSupported('video/mp4;codecs=h264'));
      console.log('  video/mp4:', MediaRecorder.isTypeSupported('video/mp4'));
      console.log('  video/webm;codecs=vp8,opus:', MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus'));
      console.log('  video/webm;codecs=vp9,opus:', MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus'));
      
      // Use WebM with VP8 for reliable compatibility
      // Basic video/mp4 often creates files with non-standard structure
      let mimeType = 'video/webm;codecs=vp8,opus';
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9,opus';
        console.log('[Recording] VP8 not supported, using WebM with VP9 codec');
      } else {
        console.log('[Recording] Using WebM with VP8 codec for reliable compatibility');
      }
      
      // Create new recording with the determined MIME type
      const recording = createRecording(classroomId, userId, mimeType);
      setCurrentRecording(recording);
      
      // Start recording with retry logic
      const updatedRecording = await startRecordingWithRetry(recording, stream, mimeType);
      
      if (updatedRecording.status === 'ERROR') {
        throw new Error(updatedRecording.errorMessage || 'Failed to start recording');
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];
      
      console.log('[Recording] MediaRecorder created with MIME type:', mimeType);
      console.log('[Recording] Stream tracks:', stream.getTracks().map(track => ({ 
        kind: track.kind, 
        enabled: track.enabled, 
        readyState: track.readyState 
      })));
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('[Recording] Data available - size:', event.data.size, 'type:', event.data.type);
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        } else {
          console.warn('[Recording] Received empty data chunk');
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('[Recording] MediaRecorder error:', event);
        setError('Recording failed: MediaRecorder error');
        setIsRecording(false);
        setCurrentRecording(null);
      };
      
      mediaRecorder.onstop = () => {
        console.log('[Recording] MediaRecorder stopped, chunks:', recordingChunksRef.current.length);
        
        // Create blob with proper MIME type
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        console.log('[Recording] Blob created - type:', blob.type, 'size:', blob.size, 'chunks:', recordingChunksRef.current.length);
        
        // Validate blob
        if (blob.size === 0) {
          console.error('[Recording] ERROR: Blob is empty!');
          setError('Recording failed: No data captured');
          setIsRecording(false);
          setCurrentRecording(null);
          return;
        }
        
        if (recordingChunksRef.current.length === 0) {
          console.error('[Recording] ERROR: No chunks recorded!');
          setError('Recording failed: No video data captured');
          setIsRecording(false);
          setCurrentRecording(null);
          return;
        }
        
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
      
      // Start recording with 1-second timeslices for better chunking
      console.log('[Recording] Starting MediaRecorder...');
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
