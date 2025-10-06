/**
 * Recording Utilities for Overcast Video Classroom
 * 
 * This module provides core recording functionality using the browser's MediaRecorder API.
 * It handles recording state management, error handling, retry logic, and integration
 * with Daily.co video streams.
 * 
 * Key Features:
 * - MediaRecorder API integration for video/audio recording
 * - Exponential backoff retry mechanism (max 3 attempts)
 * - Daily.co stream capture for classroom sessions
 * - Recording state management and validation
 * - Error handling with user-friendly messages
 */

import { Recording, RecordingFile, RecordingState, RecordingStatus } from './types';

/**
 * Maximum number of retry attempts for failed recordings
 */
const MAX_RETRIES = 3;

/**
 * Retry delays in milliseconds (exponential backoff)
 */
const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * TTL for recordings in milliseconds (24 hours)
 */
const RECORDING_TTL = 24 * 60 * 60 * 1000;

/**
 * Check if the browser supports recording functionality
 * @returns {boolean} True if MediaRecorder API is supported
 */
export const isRecordingSupported = (): boolean => {
  try {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder &&
      typeof (window.MediaRecorder as any).isTypeSupported === 'function' &&
      (window.MediaRecorder as any).isTypeSupported('video/webm')
    );
  } catch {
    return false;
  }
};

/**
 * Convert WebM blob to MP4 format using FFmpeg
 * @param {Blob} webmBlob - WebM video blob
 * @returns {Promise<Blob>} MP4 video blob
 */
export const convertWebMToMP4 = async (webmBlob: Blob): Promise<Blob> => {
  try {
    const { convertWebMToMP4: ffmpegConvert } = await import('./video-converter');
    return await ffmpegConvert(webmBlob);
  } catch (error) {
    console.error('Failed to convert WebM to MP4:', error);
    // Return original blob if conversion fails
    return webmBlob;
  }
};

/**
 * Get user media stream for recording
 * @param {MediaStreamConstraints} constraints - Media constraints
 * @returns {Promise<MediaStream>} Media stream for recording
 */
export const getUserMediaStream = async (
  constraints: MediaStreamConstraints = { 
    video: { 
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    }, 
    audio: { 
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    } 
  }
): Promise<MediaStream> => {
  try {
    console.log('[Recording] Requesting media stream with constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('[Recording] Media stream obtained:', {
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      tracks: stream.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
        settings: track.getSettings()
      }))
    });
    return stream;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to access camera/microphone: ${errorMessage}`);
  }
};

/**
 * Create a new recording instance
 * @param {string} classroomId - Classroom session ID
 * @param {string} userId - User ID
 * @param {string} mimeType - MIME type for the recording (default: video/webm)
 * @returns {Recording} New recording instance
 */
export const createRecording = (classroomId: string, userId: string, mimeType: string = 'video/webm'): Recording => {
  const now = Date.now();
  const id = crypto.randomUUID();
  
  // Create a readable timestamp for the filename
  const date = new Date(now);
  const timestamp = date.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .substring(0, 19); // Format: YYYY-MM-DD_HH-MM-SS
  
  // Determine file extension based on actual MIME type
  const getFileExtension = (mimeType: string): string => {
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
    return 'mp4'; // fallback to MP4 for better compatibility
  };
  
  const extension = getFileExtension(mimeType);
  
  return {
    id,
    classroomId,
    userId,
    startTime: now,
    status: 'IDLE' as RecordingStatus,
    fileName: `recording_${timestamp}.${extension}`,
    fileSize: 0,
    ttl: now + RECORDING_TTL,
    retryCount: 0,
  };
};

/**
 * Start recording with retry logic
 * @param {Recording} recording - Recording instance
 * @param {MediaStream} stream - Media stream to record
 * @param {string} mimeType - MIME type for recording
 * @param {number} attempt - Current attempt number (default: 0)
 * @returns {Promise<Recording>} Updated recording instance
 */
export const startRecordingWithRetry = async (
  recording: Recording,
  stream: MediaStream,
  mimeType: string,
  attempt: number = 0
): Promise<Recording> => {
  try {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
    });

    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      console.log('[Recording] Recording stopped in retry function, blob type:', blob.type, 'size:', blob.size);
      
      recording.fileSize = blob.size;
      recording.duration = Date.now() - recording.startTime;
    };

    mediaRecorder.onerror = (event) => {
      throw new Error(`MediaRecorder error: ${event}`);
    };

    mediaRecorder.start(1000); // Record in 1-second chunks
    
    return {
      ...recording,
      status: 'RECORDING' as RecordingStatus,
      retryCount: attempt,
    };
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      // Wait for exponential backoff delay
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
      return startRecordingWithRetry(recording, stream, mimeType, attempt + 1);
    }
    
    // All retries failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      ...recording,
      status: 'ERROR' as RecordingStatus,
      errorMessage: `Recording failed after ${MAX_RETRIES} attempts: ${errorMessage}`,
      retryCount: attempt,
    };
  }
};

/**
 * Stop recording and create recording file
 * @param {Recording} recording - Recording instance
 * @param {Blob} blob - Recorded video blob
 * @returns {Recording} Updated recording instance
 */
export const stopRecording = (recording: Recording, blob: Blob): Recording => {
  const endTime = Date.now();
  
  return {
    ...recording,
    endTime,
    duration: endTime - recording.startTime,
    status: 'STOPPED' as RecordingStatus,
    fileSize: blob.size,
  };
};

/**
 * Create recording file from blob
 * @param {Recording} recording - Recording instance
 * @param {Blob} blob - Video blob data
 * @returns {RecordingFile} Recording file instance
 */
export const createRecordingFile = (recording: Recording, blob: Blob): RecordingFile => {
  return {
    recordingId: recording.id,
    blob,
    mimeType: 'video/webm',
    createdAt: recording.startTime,
  };
};

/**
 * Generate download URL for recording file
 * @param {RecordingFile} recordingFile - Recording file instance
 * @returns {string} Blob URL for download
 */
export const generateDownloadUrl = (recordingFile: RecordingFile): string => {
  return URL.createObjectURL(recordingFile.blob);
};

/**
 * Revoke download URL to prevent memory leaks
 * @param {string} url - Blob URL to revoke
 */
export const revokeDownloadUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Validate recording instance
 * @param {Recording} recording - Recording to validate
 * @returns {boolean} True if recording is valid
 */
export const validateRecording = (recording: Recording): boolean => {
  // Check required fields
  if (!recording.id || !recording.classroomId || !recording.userId) {
    return false;
  }
  
  // Check time constraints
  if (recording.endTime && recording.startTime > recording.endTime) {
    return false;
  }
  
  // Check duration consistency
  if (recording.duration && recording.endTime && recording.startTime) {
    const calculatedDuration = recording.endTime - recording.startTime;
    if (Math.abs(recording.duration - calculatedDuration) > 1000) { // 1 second tolerance
      return false;
    }
  }
  
  // Check retry count
  if (recording.retryCount < 0 || recording.retryCount > MAX_RETRIES) {
    return false;
  }
  
  // Check TTL
  if (recording.ttl <= recording.startTime) {
    return false;
  }
  
  return true;
};

/**
 * Check if recording has expired
 * @param {Recording} recording - Recording to check
 * @returns {boolean} True if recording has expired
 */
export const isRecordingExpired = (recording: Recording): boolean => {
  return Date.now() > recording.ttl;
};

/**
 * Get recording status message for user display
 * @param {Recording} recording - Recording instance
 * @returns {string} User-friendly status message
 */
export const getRecordingStatusMessage = (recording: Recording): string => {
  switch (recording.status) {
    case 'IDLE':
      return 'Ready to record';
    case 'RECORDING':
      return 'Recording in progress...';
    case 'STOPPED':
      return 'Recording completed';
    case 'ERROR':
      return recording.errorMessage || 'Recording failed';
    default:
      return 'Unknown status';
  }
};

/**
 * Get recording duration in human-readable format
 * @param {Recording} recording - Recording instance
 * @returns {string} Formatted duration string
 */
export const getRecordingDuration = (recording: Recording): string => {
  if (!recording.duration) {
    return '0:00';
  }
  
  const minutes = Math.floor(recording.duration / 60000);
  const seconds = Math.floor((recording.duration % 60000) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get recording file size in human-readable format
 * @param {Recording} recording - Recording instance
 * @returns {string} Formatted file size string
 */
export const getRecordingFileSize = (recording: Recording): string => {
  if (!recording.fileSize) {
    return '0 B';
  }
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = recording.fileSize;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};
