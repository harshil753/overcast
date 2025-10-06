/**
 * RecordingManager Component for Overcast Video Classroom
 * 
 * This component manages the recording state and file operations for video recordings.
 * It integrates with Daily.co streams to capture video/audio and handles the recording
 * lifecycle from start to completion.
 * 
 * Key Features:
 * - Daily.co stream capture integration
 * - MediaRecorder API management
 * - Recording state persistence
 * - Automatic cleanup on component unmount
 * - Error handling and retry logic
 * 
 * WHY: Centralized recording management that handles the complex integration
 * between Daily.co streams and MediaRecorder API.
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useRecording } from '../hooks/useRecording';
import { Recording, RecordingFile } from '../../lib/types';
import { 
  createRecordingFile, 
  revokeDownloadUrl,
  isRecordingSupported 
} from '../../lib/recording-utils';

interface RecordingManagerProps {
  userId: string;
  classroomId: string;
  callFrame?: unknown; // Daily.co call frame object
  onRecordingStart?: (recording: Recording) => void;
  onRecordingStop?: (recording: Recording) => void;
  onError?: (error: string) => void;
}

/**
 * RecordingManager component for managing recording operations
 */
export const RecordingManager: React.FC<RecordingManagerProps> = ({
  userId,
  classroomId,
  callFrame,
  onRecordingStart,
  onRecordingStop,
  onError,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingFileRef = useRef<RecordingFile | null>(null);

  const {
    // Recording functionality is managed by the useRecording hook
  } = useRecording({
    userId,
    classroomId,
    onRecordingStart: (recording) => {
      handleRecordingStart(recording);
      onRecordingStart?.(recording);
    },
    onRecordingStop: (recording) => {
      handleRecordingStop(recording);
      onRecordingStop?.(recording);
    },
    onError,
  });

  /**
   * Handle recording start with Daily.co stream capture
   */
  const handleRecordingStart = useCallback(async (recording: Recording) => {
    try {
      if (!isRecordingSupported()) {
        throw new Error('Recording not supported in this browser');
      }

      // Get media stream from Daily.co or browser
      let stream: MediaStream;
      
      if (callFrame) {
        // Capture Daily.co video/audio streams
        stream = await captureDailyStreams(callFrame);
      } else {
        // Fallback to browser getUserMedia
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }

      mediaStreamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
        const recordingFile = createRecordingFile(recording, blob);
        recordingFileRef.current = recordingFile;
        
        // Clean up stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError?.('Recording failed due to technical error');
      };

      // Start recording
      mediaRecorder.start(1000); // Record in 1-second chunks
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to start recording');
    }
  }, [callFrame, onError]);

  /**
   * Handle recording stop
   */
  const handleRecordingStop = useCallback(async (_recording: Recording) => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      // Stop media stream tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Clean up references
      mediaRecorderRef.current = null;
      recordingChunksRef.current = [];
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to stop recording');
    }
  }, [onError]);

  /**
   * Capture Daily.co video and audio streams
   */
  const captureDailyStreams = async (callFrame: unknown): Promise<MediaStream> => {
    try {
      // Type guard to ensure callFrame has the required methods
      if (!callFrame || typeof callFrame !== 'object') {
        throw new Error('Invalid callFrame object');
      }
      
      const frame = callFrame as { getLocalVideoElement: () => HTMLVideoElement; getLocalAudioElement: () => HTMLAudioElement };
      
      // Get Daily.co video and audio elements
      const videoElement = frame.getLocalVideoElement();
      const audioElement = frame.getLocalAudioElement();

      if (!videoElement || !audioElement) {
        throw new Error('Daily.co video/audio elements not available');
      }

      // Create canvas to capture video
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas size to match video
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;

      // Create combined stream
      const canvasStream = canvas.captureStream(30); // 30 FPS
      
      // For audio, we need to use getUserMedia to capture system audio
      // or use the audio element's audio context if available
      let audioStream: MediaStream;
      try {
        // Try to get audio from the audio element's context
        if (audioElement.srcObject && audioElement.srcObject instanceof MediaStream) {
          audioStream = audioElement.srcObject;
        } else {
          // Fallback: request microphone access for audio
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (error) {
        console.warn('Could not capture audio stream:', error);
        // Create empty audio stream as fallback
        audioStream = new MediaStream();
      }

      // Combine video and audio streams
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      // Start capturing video to canvas
      const captureFrame = () => {
        if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }
        requestAnimationFrame(captureFrame);
      };
      captureFrame();

      return combinedStream;
      
    } catch (error) {
      console.error('Failed to capture Daily.co streams:', error);
      throw new Error('Failed to capture classroom video/audio');
    }
  };


  /**
   * Cleanup on component unmount
   */
  useEffect(() => {
    return () => {
      // Stop any active recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Revoke any download URLs
      if (recordingFileRef.current?.downloadUrl) {
        revokeDownloadUrl(recordingFileRef.current.downloadUrl);
      }
    };
  }, []);

  // This component doesn't expose methods - it's a manager

  // This component doesn't render anything - it's a manager
  return null;
};

export default RecordingManager;
