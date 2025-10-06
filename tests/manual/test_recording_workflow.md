# Manual Testing Guide: Video Recording Workflow

This document provides step-by-step instructions for manually testing the complete video recording workflow in the Overcast video classroom application.

## Prerequisites

- Modern browser with MediaRecorder API support (Chrome, Firefox, Safari, Edge)
- Camera and microphone access
- Daily.co rooms configured and accessible
- Development server running (`npm run dev`)

## Test Scenarios

### Scenario 1: Basic Recording Workflow

**Objective**: Test the complete recording workflow from start to download

**Steps**:
1. **Navigate to Application**
   - Open browser to `http://localhost:3000`
   - Verify landing page loads with name entry form

2. **Enter User Information**
   - Enter name: "Test User"
   - Select role: "Student"
   - Click "Enter Lobby"

3. **Join Classroom**
   - Verify lobby displays 6 classroom cards
   - Click on "Cohort 1" classroom card
   - Wait for classroom to load and video to connect

4. **Start Recording**
   - Look for "Start Recording" button next to "Leave Classroom" button
   - Click "Start Recording" button
   - Verify recording indicator appears (red dot with "Recording" text)
   - Verify "Stop Recording" button replaces "Start Recording" button

5. **Verify Recording State**
   - Wait 10-15 seconds while recording
   - Verify recording duration is displayed
   - Verify recording indicator remains visible

6. **Stop Recording**
   - Click "Stop Recording" button
   - Verify recording indicator disappears
   - Verify "Recording saved successfully" message appears
   - Verify "Start Recording" button reappears

7. **Leave Classroom**
   - Click "Leave Classroom" button
   - Verify return to lobby

8. **Download Recording**
   - Navigate to `/recordings` page
   - Verify recording appears in the list
   - Click "Download" button for the recording
   - Verify file download starts

**Expected Results**:
- Recording starts and stops successfully
- Visual feedback is clear and accurate
- Recording is saved and available for download
- File downloads correctly

### Scenario 2: Multiple Recordings

**Objective**: Test multiple recording sessions within the same classroom

**Steps**:
1. **Join Classroom**
   - Enter classroom as student
   - Wait for video connection

2. **First Recording**
   - Start recording
   - Wait 5 seconds
   - Stop recording
   - Verify "Recording saved successfully" message

3. **Second Recording**
   - Start recording again
   - Wait 5 seconds
   - Stop recording
   - Verify second recording is saved

4. **Third Recording**
   - Start recording again
   - Wait 5 seconds
   - Stop recording
   - Verify third recording is saved

5. **Leave and Download**
   - Leave classroom
   - Navigate to `/recordings`
   - Verify all 3 recordings appear in the list
   - Download each recording separately

**Expected Results**:
- Multiple recordings can be created in the same session
- Each recording is saved separately
- All recordings are available for download

### Scenario 3: Error Handling

**Objective**: Test error scenarios and recovery

**Steps**:
1. **Permission Denied**
   - Block camera/microphone access in browser
   - Join classroom
   - Try to start recording
   - Verify error message appears
   - Verify retry button is available

2. **Browser Compatibility**
   - Test in unsupported browser (if available)
   - Verify "Recording not supported" message
   - Verify recording controls are hidden

3. **Network Issues**
   - Simulate network disconnection
   - Try to start recording
   - Verify error handling
   - Restore network and retry

**Expected Results**:
- Error messages are clear and helpful
- Retry functionality works
- Graceful degradation for unsupported browsers

### Scenario 4: Performance Testing

**Objective**: Verify recording performance meets requirements

**Steps**:
1. **Start Recording Performance**
   - Use browser dev tools to measure timing
   - Start recording and measure response time
   - Verify response time is <100ms

2. **Stop Recording Performance**
   - Stop recording and measure response time
   - Verify response time is <100ms

3. **Memory Usage**
   - Monitor memory usage during recording
   - Verify memory is cleaned up after recording
   - Verify no memory leaks

**Expected Results**:
- Start/stop response times <100ms
- Memory usage is reasonable
- No memory leaks detected

### Scenario 5: Browser Compatibility

**Objective**: Test recording functionality across different browsers

**Steps**:
1. **Chrome**
   - Test complete workflow in Chrome
   - Verify all features work correctly

2. **Firefox**
   - Test complete workflow in Firefox
   - Verify all features work correctly

3. **Safari**
   - Test complete workflow in Safari
   - Verify all features work correctly

4. **Edge**
   - Test complete workflow in Edge
   - Verify all features work correctly

**Expected Results**:
- Recording works in all supported browsers
- Consistent behavior across browsers
- No browser-specific issues

### Scenario 6: Instructor Recording

**Objective**: Test recording functionality for instructors

**Steps**:
1. **Join as Instructor**
   - Enter name and select "Instructor" role
   - Join classroom
   - Verify instructor controls are visible

2. **Start Recording**
   - Click "Start Recording" button
   - Verify recording starts successfully
   - Verify instructor can still use other controls

3. **Manage Participants While Recording**
   - Mute/unmute participants while recording
   - Verify recording continues
   - Verify instructor controls work normally

4. **Stop Recording**
   - Stop recording
   - Verify recording is saved
   - Leave classroom and download recording

**Expected Results**:
- Instructors can record while managing participants
- Recording doesn't interfere with instructor controls
- All functionality works together

### Scenario 7: TTL Cleanup

**Objective**: Test automatic cleanup of expired recordings

**Steps**:
1. **Create Recording**
   - Join classroom and create recording
   - Leave classroom

2. **Simulate Time Passage**
   - Manually adjust system time to 25 hours later
   - Navigate to `/recordings` page
   - Verify recording is no longer available

3. **Verify Cleanup**
   - Check browser console for cleanup messages
   - Verify localStorage is cleaned up

**Expected Results**:
- Recordings are automatically deleted after 24 hours
- Cleanup messages are logged
- Storage is properly cleaned up

## Test Checklist

### Recording Controls
- [ ] Start Recording button appears and works
- [ ] Stop Recording button appears and works
- [ ] Recording indicator shows when active
- [ ] Recording duration is displayed
- [ ] Error messages are clear and helpful
- [ ] Retry functionality works

### Recording Management
- [ ] Multiple recordings can be created
- [ ] Each recording is saved separately
- [ ] Recordings persist across page refreshes
- [ ] Recordings are cleaned up after 24 hours

### Download Management
- [ ] Recordings page loads correctly
- [ ] All recordings are listed
- [ ] Download buttons work
- [ ] Files download correctly
- [ ] Download URLs are cleaned up

### Performance
- [ ] Start recording response time <100ms
- [ ] Stop recording response time <100ms
- [ ] Memory usage is reasonable
- [ ] No memory leaks detected

### Browser Compatibility
- [ ] Chrome: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Edge: All features work
- [ ] Unsupported browsers: Graceful degradation

### Error Handling
- [ ] Permission denied: Clear error message
- [ ] Network issues: Proper error handling
- [ ] Browser compatibility: Graceful degradation
- [ ] Storage quota: Proper error handling

## Troubleshooting

### Common Issues

**Recording not starting**:
- Check browser permissions for camera/microphone
- Verify MediaRecorder API support
- Check browser console for errors

**Recording not saving**:
- Check localStorage quota
- Verify recording data is valid
- Check for storage errors

**Download not working**:
- Check blob URL generation
- Verify file size is reasonable
- Check for memory issues

**Performance issues**:
- Check browser dev tools for performance
- Verify no memory leaks
- Check for excessive CPU usage

### Debug Information

**Browser Console Commands**:
```javascript
// Check recording support
console.log('MediaRecorder supported:', !!window.MediaRecorder);
console.log('getUserMedia supported:', !!navigator.mediaDevices?.getUserMedia);

// Check localStorage usage
console.log('localStorage usage:', JSON.stringify(localStorage));

// Check recording state
console.log('Recording state:', JSON.parse(localStorage.getItem('overcast-recordings-test-user') || '[]'));
```

**Performance Monitoring**:
```javascript
// Monitor memory usage
console.log('Memory usage:', performance.memory);

// Monitor performance
console.log('Performance timing:', performance.timing);
```

## Success Criteria

The recording feature is considered successfully implemented when:

1. **Functionality**: All recording operations work correctly
2. **Performance**: Start/stop response times <100ms
3. **Compatibility**: Works in all supported browsers
4. **Error Handling**: Graceful handling of all error scenarios
5. **User Experience**: Clear feedback and intuitive controls
6. **Storage**: Proper management of recordings and cleanup
7. **Integration**: Seamless integration with existing classroom features

## Test Results

| Test Scenario | Status | Notes |
|---------------|--------|-------|
| Basic Recording Workflow | ⏳ Pending | |
| Multiple Recordings | ⏳ Pending | |
| Error Handling | ⏳ Pending | |
| Performance Testing | ⏳ Pending | |
| Browser Compatibility | ⏳ Pending | |
| Instructor Recording | ⏳ Pending | |
| TTL Cleanup | ⏳ Pending | |

**Overall Status**: ⏳ Pending Manual Testing

**Next Steps**: Execute manual testing scenarios and update status
