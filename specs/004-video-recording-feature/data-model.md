# Data Model: Video Recording Feature

**Feature**: Video Recording for Overcast Classroom  
**Date**: 2025-01-05  
**Phase**: 1 - Design & Contracts

## Core Entities

### Recording
Represents a single recording session with metadata and state tracking.

**Fields**:
- `id: string` - Unique identifier (UUID v4)
- `classroomId: string` - Associated classroom session ID
- `userId: string` - Participant who started the recording
- `startTime: number` - Timestamp when recording started (Unix epoch)
- `endTime?: number` - Timestamp when recording ended (Unix epoch)
- `duration?: number` - Recording duration in milliseconds
- `status: RecordingStatus` - Current recording state
- `fileName: string` - Generated filename for download
- `fileSize: number` - Size of recorded file in bytes
- `ttl: number` - Time-to-live timestamp (24 hours from creation)
- `retryCount: number` - Number of retry attempts (max 3)
- `errorMessage?: string` - Error details if recording failed

**State Transitions**:
```
IDLE → RECORDING → STOPPED
  ↓        ↓         ↓
ERROR ← ERROR ← ERROR
```

**Validation Rules**:
- `id` must be unique across all recordings
- `startTime` must be before `endTime` (if both present)
- `duration` must equal `endTime - startTime` (if both present)
- `ttl` must be exactly 24 hours from `startTime`
- `retryCount` must be between 0 and 3
- `fileName` must match pattern: `recording-{id}-{timestamp}.webm`

### RecordingFile
Represents the actual video file stored in browser memory.

**Fields**:
- `recordingId: string` - Reference to parent Recording
- `blob: Blob` - The actual video file data
- `mimeType: string` - MIME type (video/webm)
- `createdAt: number` - File creation timestamp
- `downloadUrl?: string` - Blob URL for download (temporary)

**Validation Rules**:
- `blob.size` must match `Recording.fileSize`
- `mimeType` must be 'video/webm' or 'video/mp4'
- `downloadUrl` must be valid Blob URL when present
- `createdAt` must be within 1 second of `Recording.startTime`

### RecordingState
Tracks the current recording state for a user session.

**Fields**:
- `userId: string` - User identifier
- `classroomId: string` - Current classroom session
- `isRecording: boolean` - Whether currently recording
- `activeRecordingId?: string` - ID of current recording (if any)
- `recordings: string[]` - List of recording IDs for this session
- `lastError?: string` - Most recent error message
- `retryAttempts: number` - Current retry count

**State Management**:
- Updated when recording starts/stops
- Cleared when user leaves classroom
- Persisted in localStorage during session
- Reset on classroom change

## Data Relationships

```
UserSession
    ↓ (1:many)
Recording (userId, classroomId)
    ↓ (1:1)
RecordingFile (recordingId)
    ↓ (1:1)
RecordingState (userId, classroomId)
```

## Storage Schema

### localStorage Keys
- `overcast-recordings-{userId}` - Array of Recording objects
- `overcast-recording-state-{userId}-{classroomId}` - RecordingState object
- `overcast-recording-files-{recordingId}` - RecordingFile blob data

### Data Serialization
```typescript
// Recording metadata (JSON serializable)
interface StoredRecording {
  id: string;
  classroomId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: RecordingStatus;
  fileName: string;
  fileSize: number;
  ttl: number;
  retryCount: number;
  errorMessage?: string;
}

// Recording state (JSON serializable)
interface StoredRecordingState {
  userId: string;
  classroomId: string;
  isRecording: boolean;
  activeRecordingId?: string;
  recordings: string[];
  lastError?: string;
  retryAttempts: number;
}
```

## Business Rules

### Recording Lifecycle
1. **Creation**: Recording created when user clicks "Start Recording"
2. **Active**: Recording captures video/audio streams
3. **Completion**: Recording stopped when user clicks "Stop" or leaves classroom
4. **Storage**: Recording metadata stored in localStorage
5. **Cleanup**: Recording automatically deleted after 24 hours

### Retry Logic
- Maximum 3 retry attempts for failed recordings
- Exponential backoff: 1s, 2s, 4s delays
- User notification after final failure
- Recording marked as ERROR if all retries fail

### File Management
- Each recording creates a separate file
- Files stored as Blob objects in memory
- Download URLs generated on-demand
- URLs revoked after download to prevent memory leaks

### TTL Management
- All recordings have 24-hour TTL from creation
- Automatic cleanup runs on app startup
- Expired recordings removed from localStorage
- User notified of cleanup actions

## Validation Constraints

### Recording Validation
- `startTime` must be valid Unix timestamp
- `duration` must be positive number
- `fileName` must be unique within user's recordings
- `fileSize` must be greater than 0
- `ttl` must be exactly 24 hours from `startTime`

### State Validation
- `isRecording` must be false when `activeRecordingId` is null
- `recordings` array must contain valid recording IDs
- `retryAttempts` must not exceed 3
- `classroomId` must match current classroom session

### File Validation
- `blob` must be valid video Blob
- `mimeType` must be supported video format
- `fileSize` must match blob size
- `downloadUrl` must be valid when present

## Error Handling

### Recording Errors
- **Stream Access Denied**: User must grant camera/microphone permissions
- **Storage Full**: Browser storage limit reached
- **Network Error**: Connection lost during recording
- **Browser Crash**: Recording state lost, user must restart

### Recovery Strategies
- **Permission Denied**: Show permission request dialog
- **Storage Full**: Clear old recordings, notify user
- **Network Error**: Retry with exponential backoff
- **Browser Crash**: Restore from localStorage on reload

## Performance Considerations

### Memory Management
- Recording blobs stored in memory (not localStorage)
- Blob URLs created on-demand for downloads
- URLs revoked immediately after download
- Large recordings may impact browser performance

### Storage Limits
- Browser localStorage typically 5-10MB limit
- Recording metadata is small (few KB per recording)
- Video files stored in memory, not localStorage
- Automatic cleanup prevents storage bloat

### Optimization Strategies
- Lazy loading of recording metadata
- Batch cleanup of expired recordings
- Compression of stored metadata
- Efficient blob URL management
