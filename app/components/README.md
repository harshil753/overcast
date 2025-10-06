# Components Directory

React components for the Overcast video classroom application, built with Daily.co integration and futuristic design.

## Structure

- `Lobby.tsx` - Main lobby with 6 classroom grid
- `Classroom.tsx` - Classroom video component with DailyProvider wrapper
- `VideoFeed.tsx` - Daily video integration using React hooks
- `ParticipantList.tsx` - Participant display using useParticipantIds() hook
- `InstructorControls.tsx` - Instructor-specific controls (mute, breakout rooms)
- `RecordingControls.tsx` - Recording start/stop controls with visual feedback
- `RecordingManager.tsx` - Recording state management and Daily.co stream capture
- `DownloadManager.tsx` - Recording download interface and file management
- `UserSessionProvider.tsx` - User session context with recording state
- `ui/` - Shared UI components (buttons, modals, etc.)

## Daily.co Integration

Components use Daily React hooks for video functionality:

```typescript
import { useParticipantIds, useDaily, useDevices, useScreenShare } from '@daily-co/daily-react';
```

## Recording Components

The recording feature includes three main components:

### RecordingControls
- **Purpose**: User interface for starting and stopping recordings
- **Features**: Visual feedback, error handling, retry functionality
- **Integration**: Uses `useRecording` hook for state management
- **UI**: Matches futuristic black/teal theme

### RecordingManager
- **Purpose**: Manages recording operations and Daily.co stream capture
- **Features**: MediaRecorder integration, stream capture, cleanup
- **Integration**: Handles complex video/audio stream operations
- **Performance**: <100ms start/stop response time

### DownloadManager
- **Purpose**: Handles recording downloads and file management
- **Features**: Download URLs, progress tracking, file operations
- **Integration**: Manages blob URLs and memory cleanup
- **UI**: Clean interface for managing recordings

## Recording Integration

Recording components integrate with the existing classroom system:

```typescript
// Classroom.tsx integration
<RecordingControls
  userId={user.sessionId}
  classroomId={classroom.id}
  onRecordingStart={handleRecordingStart}
  onRecordingStop={handleRecordingStop}
  onError={handleRecordingError}
/>

<RecordingManager
  userId={user.sessionId}
  classroomId={classroomId}
  callFrame={daily}
  onRecordingStart={handleRecordingStart}
  onRecordingStop={handleRecordingStop}
  onError={handleRecordingError}
/>
```

## Design System

All components follow the futuristic black/teal theme defined in `globals.css`:

- `.btn-primary` - Teal buttons for primary actions
- `.classroom-card` - Dark cards with teal hover effects
- `.video-container` - Video display containers
- `.instructor-panel` - Instructor control panels

## Constitutional Compliance

- **Single File Preference**: Related functionality kept together
- **Comment-Driven**: All non-trivial logic explained with WHY comments
- **Newcomer-Friendly**: Clear component names and prop interfaces
- **Educational**: Components serve as examples of Daily.co integration patterns
