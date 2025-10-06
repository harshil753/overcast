/**
 * Browser Compatibility Utilities for Overcast Video Recording
 * 
 * This module provides browser compatibility checks for the recording feature.
 * It validates MediaRecorder API support, codec availability, and browser-specific
 * limitations that affect recording functionality.
 * 
 * Key Features:
 * - MediaRecorder API support detection
 * - Codec availability checking
 * - Browser-specific feature detection
 * - Fallback recommendations
 * 
 * WHY: Ensures recording functionality works across different browsers and
 * provides clear feedback when features are not supported.
 */

/**
 * Browser compatibility information
 */
export interface BrowserCompatibility {
  /** Whether MediaRecorder API is supported */
  mediaRecorderSupported: boolean;
  /** Whether getUserMedia is supported */
  getUserMediaSupported: boolean;
  /** Whether the browser supports video recording */
  videoRecordingSupported: boolean;
  /** Whether the browser supports audio recording */
  audioRecordingSupported: boolean;
  /** Supported video codecs */
  supportedVideoCodecs: string[];
  /** Supported audio codecs */
  supportedAudioCodecs: string[];
  /** Browser name and version */
  browserInfo: {
    name: string;
    version: string;
    isSupported: boolean;
  };
  /** Recommended fallback actions */
  fallbackRecommendations: string[];
}

/**
 * Check if MediaRecorder API is supported
 */
export const isMediaRecorderSupported = (): boolean => {
  return !!(window.MediaRecorder && typeof window.MediaRecorder === 'function');
};

/**
 * Check if getUserMedia is supported
 */
export const isGetUserMediaSupported = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
};

/**
 * Check if a specific MIME type is supported
 */
export const isMimeTypeSupported = (mimeType: string): boolean => {
  if (!isMediaRecorderSupported()) {
    return false;
  }
  
  try {
    return MediaRecorder.isTypeSupported(mimeType);
  } catch (error) {
    console.warn('Error checking MIME type support:', error);
    return false;
  }
};

/**
 * Get supported video codecs
 */
export const getSupportedVideoCodecs = (): string[] => {
  const codecs = [
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/mp4;codecs=h264',
    'video/mp4;codecs=h264,aac',
  ];

  return codecs.filter(codec => isMimeTypeSupported(codec));
};

/**
 * Get supported audio codecs
 */
export const getSupportedAudioCodecs = (): string[] => {
  const codecs = [
    'audio/webm;codecs=opus',
    'audio/webm;codecs=vorbis',
    'audio/mp4;codecs=aac',
    'audio/ogg;codecs=vorbis',
  ];

  return codecs.filter(codec => isMimeTypeSupported(codec));
};

/**
 * Get browser information
 */
export const getBrowserInfo = (): { name: string; version: string; isSupported: boolean } => {
  const userAgent = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';
  let isSupported = false;

  // Chrome/Chromium
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    name = 'Chrome';
    version = match ? match[1] : 'Unknown';
    isSupported = true;
  }
  // Firefox
  else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    name = 'Firefox';
    version = match ? match[1] : 'Unknown';
    isSupported = true;
  }
  // Safari
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    name = 'Safari';
    version = match ? match[1] : 'Unknown';
    isSupported = true;
  }
  // Edge
  else if (userAgent.includes('Edge')) {
    const match = userAgent.match(/Edge\/(\d+)/);
    name = 'Edge';
    version = match ? match[1] : 'Unknown';
    isSupported = true;
  }
  // Internet Explorer
  else if (userAgent.includes('Trident')) {
    name = 'Internet Explorer';
    version = 'Legacy';
    isSupported = false;
  }

  return { name, version, isSupported };
};

/**
 * Get fallback recommendations for unsupported browsers
 */
export const getFallbackRecommendations = (compatibility: BrowserCompatibility): string[] => {
  const recommendations: string[] = [];

  if (!compatibility.mediaRecorderSupported) {
    recommendations.push('Use a modern browser like Chrome, Firefox, Safari, or Edge');
  }

  if (!compatibility.getUserMediaSupported) {
    recommendations.push('Enable camera and microphone permissions in your browser');
  }

  if (!compatibility.videoRecordingSupported) {
    recommendations.push('Check if your browser supports video recording');
  }

  if (!compatibility.audioRecordingSupported) {
    recommendations.push('Check if your browser supports audio recording');
  }

  if (compatibility.supportedVideoCodecs.length === 0) {
    recommendations.push('No supported video codecs found. Try updating your browser');
  }

  if (compatibility.supportedAudioCodecs.length === 0) {
    recommendations.push('No supported audio codecs found. Try updating your browser');
  }

  if (!compatibility.browserInfo.isSupported) {
    recommendations.push(`Your browser (${compatibility.browserInfo.name}) may not be fully supported`);
  }

  return recommendations;
};

/**
 * Check overall browser compatibility for recording
 */
export const checkBrowserCompatibility = (): BrowserCompatibility => {
  const mediaRecorderSupported = isMediaRecorderSupported();
  const getUserMediaSupported = isGetUserMediaSupported();
  const videoRecordingSupported = mediaRecorderSupported && getUserMediaSupported;
  const audioRecordingSupported = mediaRecorderSupported && getUserMediaSupported;
  
  const supportedVideoCodecs = getSupportedVideoCodecs();
  const supportedAudioCodecs = getSupportedAudioCodecs();
  const browserInfo = getBrowserInfo();

  const compatibility: BrowserCompatibility = {
    mediaRecorderSupported,
    getUserMediaSupported,
    videoRecordingSupported,
    audioRecordingSupported,
    supportedVideoCodecs,
    supportedAudioCodecs,
    browserInfo,
    fallbackRecommendations: [],
  };

  compatibility.fallbackRecommendations = getFallbackRecommendations(compatibility);

  return compatibility;
};

/**
 * Check if recording is fully supported
 */
export const isRecordingFullySupported = (): boolean => {
  const compatibility = checkBrowserCompatibility();
  return (
    compatibility.mediaRecorderSupported &&
    compatibility.getUserMediaSupported &&
    compatibility.videoRecordingSupported &&
    compatibility.audioRecordingSupported &&
    compatibility.supportedVideoCodecs.length > 0 &&
    compatibility.supportedAudioCodecs.length > 0 &&
    compatibility.browserInfo.isSupported
  );
};

/**
 * Get the best supported MIME type for recording
 */
export const getBestSupportedMimeType = (): string | null => {
  const videoCodecs = getSupportedVideoCodecs();
  const audioCodecs = getSupportedAudioCodecs();

  // Prefer WebM with VP9 and Opus
  const preferredCodecs = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
  ];

  for (const codec of preferredCodecs) {
    if (videoCodecs.includes(codec)) {
      return codec;
    }
  }

  // Fallback to any supported video codec
  if (videoCodecs.length > 0) {
    return videoCodecs[0];
  }

  return null;
};

/**
 * Check if the browser supports the required features for recording
 */
export const validateRecordingRequirements = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const compatibility = checkBrowserCompatibility();

  if (!compatibility.mediaRecorderSupported) {
    errors.push('MediaRecorder API is not supported');
  }

  if (!compatibility.getUserMediaSupported) {
    errors.push('getUserMedia API is not supported');
  }

  if (!compatibility.videoRecordingSupported) {
    errors.push('Video recording is not supported');
  }

  if (!compatibility.audioRecordingSupported) {
    errors.push('Audio recording is not supported');
  }

  if (compatibility.supportedVideoCodecs.length === 0) {
    errors.push('No supported video codecs found');
  }

  if (compatibility.supportedAudioCodecs.length === 0) {
    errors.push('No supported audio codecs found');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
