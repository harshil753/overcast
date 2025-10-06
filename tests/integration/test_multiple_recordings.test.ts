/**
 * Integration Tests for Multiple Recordings
 * 
 * These tests validate the ability to create multiple recordings within the same
 * classroom session, manage them independently, and download them separately.
 * 
 * WHY: Multiple recordings are a key requirement - users should be able to
 * start/stop multiple recordings in the same classroom session.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_USER_ID = 'test-user-123';
const TEST_CLASSROOM_ID = 'test-classroom-456';
const TEST_RECORDING_DURATION = 1000; // 1 second for testing

test.describe('Multiple Recordings Integration Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    page = await context.newPage();
    
    // Mock MediaRecorder API for testing
    await page.addInitScript(() => {
      class MockMediaRecorder {
        public state: string = 'inactive';
        public ondataavailable: ((event: any) => void) | null = null;
        public onstop: (() => void) | null = null;
        public onerror: ((event: any) => void) | null = null;
        private chunks: Blob[] = [];

        constructor(public stream: MediaStream, public options?: any) {}

        start() {
          this.state = 'recording';
          setTimeout(() => {
            if (this.ondataavailable) {
              this.ondataavailable({
                data: new Blob(['test data'], { type: 'video/webm' }),
              });
            }
          }, 100);
        }

        stop() {
          this.state = 'inactive';
          if (this.onstop) {
            this.onstop();
          }
        }
      }

      navigator.mediaDevices.getUserMedia = async () => new MediaStream();
      (window as any).MediaRecorder = MockMediaRecorder;
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Create Multiple Recordings in Same Session', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    const recordings = [];
    
    // Create 3 recordings
    for (let i = 0; i < 3; i++) {
      // Start recording
      const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
      await startRecordingButton.click();
      
      // Verify recording is active
      await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="stop-recording-button"]')).toBeVisible();
      
      // Wait for recording
      await page.waitForTimeout(TEST_RECORDING_DURATION);
      
      // Stop recording
      const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
      await stopRecordingButton.click();
      
      // Verify recording stopped
      await expect(page.locator('[data-testid="recording-indicator"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
      
      // Wait for save to complete
      await page.waitForTimeout(500);
      
      recordings.push(`recording-${i + 1}`);
    }
    
    // Navigate to recordings page
    await page.goto('/recordings');
    
    // Verify all recordings are listed
    const recordingItems = page.locator('[data-testid="recording-item"]');
    await expect(recordingItems).toHaveCount(3);
    
    // Verify each recording has unique details
    for (let i = 0; i < 3; i++) {
      const recordingItem = recordingItems.nth(i);
      await expect(recordingItem.locator('[data-testid="recording-filename"]')).toBeVisible();
      await expect(recordingItem.locator('[data-testid="recording-duration"]')).toBeVisible();
      await expect(recordingItem.locator('[data-testid="recording-size"]')).toBeVisible();
      await expect(recordingItem.locator('[data-testid="download-recording-button"]')).toBeVisible();
    }
  });

  test('Multiple Recordings State Management', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Start first recording
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    
    // Verify only one recording can be active at a time
    await expect(startRecordingButton).not.toBeVisible();
    
    // Stop first recording
    const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
    await stopRecordingButton.click();
    await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
    
    // Wait for state to reset
    await page.waitForTimeout(500);
    
    // Start second recording
    await startRecordingButton.click();
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    
    // Stop second recording
    await stopRecordingButton.click();
    await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
  });

  test('Multiple Recordings with Different Durations', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    const recordingDurations = [500, 1000, 2000]; // Different durations
    
    for (let i = 0; i < recordingDurations.length; i++) {
      const duration = recordingDurations[i];
      
      // Start recording
      const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
      await startRecordingButton.click();
      await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
      
      // Record for specific duration
      await page.waitForTimeout(duration);
      
      // Stop recording
      const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
      await stopRecordingButton.click();
      await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
      
      // Wait for save
      await page.waitForTimeout(500);
    }
    
    // Navigate to recordings page
    await page.goto('/recordings');
    
    // Verify all recordings are listed with different durations
    const recordingItems = page.locator('[data-testid="recording-item"]');
    await expect(recordingItems).toHaveCount(3);
    
    // Verify duration differences
    const durations = await recordingItems.locator('[data-testid="recording-duration"]').allTextContents();
    expect(durations).toHaveLength(3);
    
    // Each duration should be different
    const uniqueDurations = new Set(durations);
    expect(uniqueDurations.size).toBeGreaterThan(1);
  });

  test('Multiple Recordings Error Handling', async () => {
    let recordingCount = 0;
    
    // Mock recording failures for some attempts
    await page.addInitScript(() => {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = async () => {
        recordingCount++;
        if (recordingCount === 2) {
          throw new Error('Camera access denied');
        }
        return originalGetUserMedia.call(navigator.mediaDevices);
      };
    });

    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // First recording should succeed
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    
    const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
    await stopRecordingButton.click();
    await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
    
    await page.waitForTimeout(500);
    
    // Second recording should fail
    await startRecordingButton.click();
    await expect(page.locator('[data-testid="recording-error-message"]')).toBeVisible();
    
    // Third recording should succeed
    await startRecordingButton.click();
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    
    await stopRecordingButton.click();
    await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
    
    // Navigate to recordings page
    await page.goto('/recordings');
    
    // Verify only successful recordings are listed
    const recordingItems = page.locator('[data-testid="recording-item"]');
    await expect(recordingItems).toHaveCount(2); // Only successful recordings
  });

  test('Multiple Recordings Storage Management', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Create multiple recordings
    for (let i = 0; i < 5; i++) {
      const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
      await startRecordingButton.click();
      await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
      
      await page.waitForTimeout(200);
      
      const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
      await stopRecordingButton.click();
      await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
      
      await page.waitForTimeout(200);
    }
    
    // Verify storage usage
    const storageUsage = await page.evaluate(() => {
      const recordings = JSON.parse(localStorage.getItem('overcast-recordings-test-user') || '[]');
      return {
        count: recordings.length,
        totalSize: recordings.reduce((sum: number, r: any) => sum + (r.fileSize || 0), 0),
      };
    });
    
    expect(storageUsage.count).toBe(5);
    expect(storageUsage.totalSize).toBeGreaterThan(0);
  });

  test('Multiple Recordings Download Management', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Create 3 recordings
    for (let i = 0; i < 3; i++) {
      const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
      await startRecordingButton.click();
      await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
      
      await page.waitForTimeout(200);
      
      const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
      await stopRecordingButton.click();
      await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
      
      await page.waitForTimeout(200);
    }
    
    // Navigate to recordings page
    await page.goto('/recordings');
    
    // Download each recording
    const recordingItems = page.locator('[data-testid="recording-item"]');
    await expect(recordingItems).toHaveCount(3);
    
    for (let i = 0; i < 3; i++) {
      const recordingItem = recordingItems.nth(i);
      const downloadButton = recordingItem.locator('[data-testid="download-recording-button"]');
      
      // Download recording
      await downloadButton.click();
      await expect(page.locator('[data-testid="download-started-message"]')).toBeVisible();
      
      // Wait for download to complete
      await page.waitForTimeout(100);
    }
  });

  test('Multiple Recordings TTL Management', async () => {
    // Mock recordings with different TTL values
    await page.addInitScript(() => {
      const now = Date.now();
      const recordings = [
        {
          id: 'recording-1',
          classroomId: 'test-classroom',
          userId: 'test-user',
          startTime: now - 2 * 60 * 60 * 1000, // 2 hours ago
          status: 'STOPPED',
          fileName: 'recording-1.webm',
          fileSize: 1024,
          ttl: now + 22 * 60 * 60 * 1000, // 22 hours from now
          retryCount: 0,
        },
        {
          id: 'recording-2',
          classroomId: 'test-classroom',
          userId: 'test-user',
          startTime: now - 25 * 60 * 60 * 1000, // 25 hours ago
          status: 'STOPPED',
          fileName: 'recording-2.webm',
          fileSize: 1024,
          ttl: now - 60 * 60 * 1000, // 1 hour ago (expired)
          retryCount: 0,
        },
        {
          id: 'recording-3',
          classroomId: 'test-classroom',
          userId: 'test-user',
          startTime: now - 1 * 60 * 60 * 1000, // 1 hour ago
          status: 'STOPPED',
          fileName: 'recording-3.webm',
          fileSize: 1024,
          ttl: now + 23 * 60 * 60 * 1000, // 23 hours from now
          retryCount: 0,
        },
      ];
      
      localStorage.setItem('overcast-recordings-test-user', JSON.stringify(recordings));
    });

    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Wait for cleanup to run
    await page.waitForTimeout(1000);
    
    // Navigate to recordings page
    await page.goto('/recordings');
    
    // Verify only non-expired recordings are shown
    const recordingItems = page.locator('[data-testid="recording-item"]');
    await expect(recordingItems).toHaveCount(2); // Only non-expired recordings
    
    // Verify expired recording is not shown
    const recordingIds = await recordingItems.locator('[data-testid="recording-id"]').allTextContents();
    expect(recordingIds).not.toContain('recording-2');
  });

  test('Multiple Recordings Performance', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    const startTimes = [];
    const stopTimes = [];
    
    // Create 5 recordings and measure performance
    for (let i = 0; i < 5; i++) {
      // Measure start time
      const startTime = Date.now();
      const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
      await startRecordingButton.click();
      await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
      startTimes.push(Date.now() - startTime);
      
      await page.waitForTimeout(100);
      
      // Measure stop time
      const stopTime = Date.now();
      const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
      await stopRecordingButton.click();
      await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
      stopTimes.push(Date.now() - stopTime);
      
      await page.waitForTimeout(100);
    }
    
    // Verify all start times are under 100ms
    startTimes.forEach(time => {
      expect(time).toBeLessThan(100);
    });
    
    // Verify all stop times are under 100ms
    stopTimes.forEach(time => {
      expect(time).toBeLessThan(100);
    });
    
    // Verify average performance
    const avgStartTime = startTimes.reduce((a, b) => a + b, 0) / startTimes.length;
    const avgStopTime = stopTimes.reduce((a, b) => a + b, 0) / stopTimes.length;
    
    expect(avgStartTime).toBeLessThan(50);
    expect(avgStopTime).toBeLessThan(50);
  });
});
