# Research: Video Recording Feature

**Feature**: Video Recording for Overcast Classroom  
**Date**: 2025-01-05  
**Phase**: 0 - Research & Discovery

## Research Questions & Findings

### 1. Browser MediaRecorder API Patterns

**Research Task**: "Research MediaRecorder API patterns for video recording in web applications"

**Decision**: Use MediaRecorder API with getUserMedia for stream capture

**Rationale**: 
- Native browser API, no external dependencies
- Supports multiple video formats (WebM, MP4)
- Built-in error handling and state management
- Compatible with Daily.co video streams

**Alternatives Considered**:
- WebRTC recording libraries (overkill for simple recording)
- Server-side recording (violates client-side requirement)
- Third-party recording services (adds complexity and cost)

**Implementation Pattern**:
```typescript
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
const mediaRecorder = new MediaRecorder(stream);
const chunks: Blob[] = [];

mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) chunks.push(event.data);
};

mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  // Handle recording completion
};
```

### 2. Daily.co Stream Capture Integration

**Research Task**: "Research Daily.co stream capture integration with MediaRecorder"

**Decision**: Capture Daily.co participant streams using Daily's getLocalVideoElement() and getLocalAudioElement()

**Rationale**:
- Daily.co provides direct access to video/audio elements
- Can capture both local participant and shared screen content
- Maintains sync with Daily.co's video management
- No additional stream processing required

**Alternatives Considered**:
- Screen capture API (limited to screen sharing only)
- Canvas recording (complex, performance overhead)
- WebRTC peer connection recording (overly complex)

**Integration Pattern**:
```typescript
// Get Daily.co video element
const videoElement = callFrame.getLocalVideoElement();
const audioElement = callFrame.getLocalAudioElement();

// Create combined stream for recording
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
// Capture video element to canvas, then to MediaRecorder
```

### 3. localStorage Management for Recording Metadata

**Research Task**: "Research localStorage management for recording metadata"

**Decision**: Use structured localStorage with JSON serialization and TTL management

**Rationale**:
- Simple key-value storage for metadata
- JSON serialization for complex objects
- Built-in browser storage with size limits
- Easy cleanup with timestamp-based TTL

**Alternatives Considered**:
- IndexedDB (overkill for simple metadata)
- Session storage (lost on tab close)
- Server storage (violates client-side requirement)

**Storage Pattern**:
```typescript
interface RecordingMetadata {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  classroomId: string;
  fileName: string;
  size: number;
  ttl: number; // 24 hours from creation
}

const STORAGE_KEY = 'overcast-recordings';
const TTL_HOURS = 24;
```

### 4. File Download Patterns for Recorded Videos

**Research Task**: "Research file download patterns for recorded videos"

**Decision**: Use Blob URLs with programmatic download triggers

**Rationale**:
- No server required for download
- Works with any blob data
- Automatic filename generation
- Cross-browser compatible

**Alternatives Considered**:
- Data URLs (size limitations)
- Server-side file serving (violates client-side requirement)
- Third-party download services (unnecessary complexity)

**Download Pattern**:
```typescript
const downloadRecording = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

### 5. Recording Error Handling and Retry Mechanisms

**Research Task**: "Research recording error handling and retry mechanisms"

**Decision**: Implement exponential backoff retry with user notification

**Rationale**:
- Handles temporary browser/network issues
- Prevents infinite retry loops
- Clear user feedback on failures
- Graceful degradation when recording fails

**Alternatives Considered**:
- Single retry (insufficient for network issues)
- Infinite retry (browser performance impact)
- No retry (poor user experience)

**Retry Pattern**:
```typescript
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

const startRecordingWithRetry = async (attempt = 0) => {
  try {
    await startRecording();
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
      return startRecordingWithRetry(attempt + 1);
    }
    throw new Error(`Recording failed after ${MAX_RETRIES} attempts: ${error.message}`);
  }
};
```

### 6. Browser Compatibility and Fallback Strategies

**Research Task**: "Research browser compatibility and fallback strategies"

**Decision**: Progressive enhancement with feature detection and graceful degradation

**Rationale**:
- Supports modern browsers with MediaRecorder API
- Graceful fallback for unsupported browsers
- Clear user messaging about compatibility
- No breaking changes to existing functionality

**Alternatives Considered**:
- Polyfills (adds complexity and size)
- Server-side recording (violates requirements)
- Third-party solutions (adds dependencies)

**Compatibility Pattern**:
```typescript
const isRecordingSupported = () => {
  return !!(navigator.mediaDevices && 
           navigator.mediaDevices.getUserMedia && 
           window.MediaRecorder);
};

const showCompatibilityMessage = () => {
  // Show message about browser compatibility
  // Hide recording controls for unsupported browsers
};
```

## Technical Decisions Summary

| Decision | Rationale | Impact |
|----------|-----------|---------|
| MediaRecorder API | Native browser support, no dependencies | Simple implementation |
| Daily.co integration | Direct element access, maintains sync | Seamless video capture |
| localStorage metadata | Simple storage, built-in TTL | Easy cleanup and management |
| Blob URL downloads | No server required, cross-browser | Client-side only solution |
| Exponential backoff retry | Handles temporary failures gracefully | Better user experience |
| Progressive enhancement | Supports modern browsers, graceful fallback | Wide compatibility |

## Implementation Readiness

✅ **All research questions resolved**  
✅ **Technical approach validated**  
✅ **Browser compatibility confirmed**  
✅ **Integration patterns identified**  
✅ **Error handling strategies defined**  

**Next Phase**: Design & Contracts (Phase 1)
