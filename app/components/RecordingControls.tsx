/**
 * RecordingControls Component for Overcast Video Classroom
 * 
 * This component provides the UI controls for starting and stopping video recordings.
 * It integrates with the useRecording hook to manage recording state and provides
 * visual feedback to users about recording status.
 * 
 * Key Features:
 * - Start/stop recording buttons with visual states
 * - Recording indicator with duration display
 * - Error handling with user-friendly messages
 * - Retry functionality for failed recordings
 * - Browser compatibility checks
 * 
 * WHY: Centralized recording controls that are easy to understand and use.
 * Follows Overcast Constitution principles for simplicity and newcomer-friendliness.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRecording } from '../hooks/useRecording';
import { Recording } from '../../lib/types';

interface RecordingControlsProps {
  userId: string;
  classroomId: string;
  className?: string;
  onRecordingStart?: (recording: Recording) => void;
  onRecordingStop?: (recording: Recording) => void;
  onError?: (error: string) => void;
}

/**
 * RecordingControls component for video recording functionality
 */
export const RecordingControls: React.FC<RecordingControlsProps> = ({
  userId,
  classroomId,
  className = '',
  onRecordingStart,
  onRecordingStop,
  onError,
}) => {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const {
    isRecording,
    isSupported,
    currentRecording,
    statusMessage,
    error,
    isLoading,
    startRecording,
    stopRecording,
    retryRecording,
  } = useRecording({
    userId,
    classroomId,
    onRecordingStart,
    onRecordingStop,
    onError: (error) => {
      setErrorMessage(error);
      setShowError(true);
      onError?.(error);
    },
  });

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setShowError(false);
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - recordingStartTime);
      }, 1000);
    } else {
      setCurrentTime(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, recordingStartTime]);

  // Update recording start time when recording starts
  useEffect(() => {
    if (isRecording && currentRecording) {
      setRecordingStartTime(currentRecording.startTime);
    } else {
      setRecordingStartTime(null);
    }
  }, [isRecording, currentRecording]);

  // Handle recording start
  const handleStartRecording = async () => {
    setShowError(false);
    setErrorMessage('');
    await startRecording();
  };

  // Handle recording stop
  const handleStopRecording = async () => {
    await stopRecording();
  };

  // Handle retry
  const handleRetry = async () => {
    setShowError(false);
    setErrorMessage('');
    await retryRecording();
  };

  // Format current recording time
  const formatCurrentTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Don't render if browser doesn't support recording
  if (!isSupported) {
    return (
      <div className={`recording-controls ${className}`} data-testid="recording-controls">
        <div className="text-sm text-gray-500 p-2" data-testid="browser-compatibility-message">
          Recording not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div className={`recording-controls ${className}`} data-testid="recording-controls">
      {/* Error Message */}
      {showError && errorMessage && (
        <div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2"
          data-testid="recording-error-message"
        >
          <div className="flex justify-between items-center">
            <span>{errorMessage}</span>
            <button
              onClick={() => setShowError(false)}
              className="text-red-500 hover:text-red-700"
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Recording Status */}
      <div className="flex items-center space-x-2 mb-2">
        {isRecording && (
          <div className="flex items-center space-x-2" data-testid="recording-indicator">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-600 font-medium">Recording</span>
            <span className="text-sm text-gray-500">
              {formatCurrentTime(currentTime)}
            </span>
          </div>
        )}
        
        {!isRecording && !isLoading && (
          <div className="text-sm text-gray-500" data-testid="recording-status">
            {statusMessage}
          </div>
        )}
        
        {isLoading && (
          <div className="text-sm text-blue-600" data-testid="recording-loading">
            {isRecording ? 'Stopping...' : 'Starting...'}
          </div>
        )}
      </div>

      {/* Recording Buttons */}
      <div className="flex space-x-2">
        {!isRecording && !isLoading && (
          <button
            onClick={handleStartRecording}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            data-testid="start-recording-button"
          >
            Start Recording
          </button>
        )}

        {isRecording && !isLoading && (
          <button
            onClick={handleStopRecording}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            data-testid="stop-recording-button"
          >
            Stop Recording
          </button>
        )}

        {isLoading && (
          <button
            disabled
            className="bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
          >
            {isRecording ? 'Stopping...' : 'Starting...'}
          </button>
        )}

        {/* Retry Button */}
        {error && !isRecording && (
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            data-testid="retry-recording-button"
          >
            Retry
          </button>
        )}
      </div>

      {/* Recording Saved Message */}
      {!isRecording && !error && statusMessage === 'Recording completed' && (
        <div 
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-2"
          data-testid="recording-saved-message"
        >
          Recording saved successfully
        </div>
      )}

      {/* Format Information */}
      {!isRecording && !error && (
        <div 
          className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mt-2 text-sm"
          data-testid="format-info"
        >
          <strong>Note:</strong> Recordings are saved in WebM format with VP8 codec for reliable compatibility. 
          WebM files can be played in Chrome, Firefox, Edge, and VLC Media Player. For Windows Media Player, use VLC instead.
        </div>
      )}
    </div>
  );
};

export default RecordingControls;
