/**
 * Integration Tests for Video Recording Workflow
 * 
 * These tests validate the complete recording workflow from start to download
 * using browser automation with Playwright. They test the full user journey
 * and integration between components.
 * 
 * WHY: Integration tests ensure the complete recording workflow works end-to-end.
 * They validate user scenarios and catch integration issues between components.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_USER_ID = 'test-user-123';
const TEST_CLASSROOM_ID = 'test-classroom-456';
const TEST_RECORDING_DURATION = 2000; // 2 seconds for testing

test.describe('Recording Workflow Integration Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      // Enable camera and microphone permissions for testing
      permissions: ['camera', 'microphone'],
    });
    page = await context.newPage();
    
    // Mock MediaRecorder API for testing
    await page.addInitScript(() => {
      // Mock MediaRecorder for testing
      class MockMediaRecorder {
        public state: string = 'inactive';
        public ondataavailable: ((event: any) => void) | null = null;
        public onstop: (() => void) | null = null;
        public onerror: ((event: any) => void) | null = null;
        private chunks: Blob[] = [];

        constructor(public stream: MediaStream, public options?: any) {}

        start() {
          this.state = 'recording';
          // Simulate data available events
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

        pause() {
          this.state = 'paused';
        }

        resume() {
          this.state = 'recording';
        }
      }

      // Mock getUserMedia
      navigator.mediaDevices.getUserMedia = async () => {
        return new MediaStream();
      };

      // Mock MediaRecorder
      (window as any).MediaRecorder = MockMediaRecorder;
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Complete Recording Workflow - Start, Record, Stop, Download', async () => {
    // Navigate to classroom page
    await page.goto('/classroom/test-classroom');
    
    // Wait for classroom to load
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Verify recording controls are visible
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await expect(startRecordingButton).toBeVisible();
    
    // Start recording
    await startRecordingButton.click();
    
    // Verify recording state changes
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="stop-recording-button"]')).toBeVisible();
    await expect(startRecordingButton).not.toBeVisible();
    
    // Wait for recording to process
    await page.waitForTimeout(TEST_RECORDING_DURATION);
    
    // Stop recording
    const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
    await stopRecordingButton.click();
    
    // Verify recording stopped
    await expect(page.locator('[data-testid="recording-indicator"]')).not.toBeVisible();
    await expect(startRecordingButton).toBeVisible();
    await expect(stopRecordingButton).not.toBeVisible();
    
    // Verify recording is saved
    await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
    
    // Navigate to recordings page
    await page.goto('/recordings');
    
    // Verify recording appears in list
    const recordingItem = page.locator('[data-testid="recording-item"]').first();
    await expect(recordingItem).toBeVisible();
    
    // Verify recording details
    await expect(recordingItem.locator('[data-testid="recording-filename"]')).toContainText('.webm');
    await expect(recordingItem.locator('[data-testid="recording-duration"]')).toBeVisible();
    await expect(recordingItem.locator('[data-testid="recording-size"]')).toBeVisible();
    
    // Download recording
    const downloadButton = recordingItem.locator('[data-testid="download-recording-button"]');
    await downloadButton.click();
    
    // Verify download started (this would trigger browser download)
    await expect(page.locator('[data-testid="download-started-message"]')).toBeVisible();
  });

  test('Recording Permission Denied Scenario', async () => {
    // Mock permission denied
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new Error('Permission denied');
      };
    });

    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Try to start recording
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    
    // Verify error message is shown
    await expect(page.locator('[data-testid="recording-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="recording-error-message"]')).toContainText('Permission denied');
    
    // Verify recording button is still available for retry
    await expect(startRecordingButton).toBeVisible();
  });

  test('Recording Storage Quota Exceeded Scenario', async () => {
    // Mock storage quota exceeded
    await page.addInitScript(() => {
      // Mock localStorage quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = (key: string, value: string) => {
        if (key.startsWith('overcast-recordings-')) {
          throw new Error('QuotaExceededError');
        }
        return originalSetItem.call(localStorage, key, value);
      };
    });

    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Try to start recording
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    
    // Verify storage quota error message
    await expect(page.locator('[data-testid="recording-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="recording-error-message"]')).toContainText('Storage quota exceeded');
  });

  test('Recording Retry Mechanism', async () => {
    let retryCount = 0;
    
    // Mock recording failure with retry
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        retryCount++;
        if (retryCount < 3) {
          throw new Error('Temporary failure');
        }
        return new MediaStream();
      };
    });

    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Start recording (should retry automatically)
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    
    // Wait for retry attempts
    await page.waitForTimeout(5000);
    
    // Verify recording eventually succeeds
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
  });

  test('Recording Browser Compatibility Check', async () => {
    // Mock unsupported browser
    await page.addInitScript(() => {
      // Remove MediaRecorder support
      delete (window as any).MediaRecorder;
      delete (navigator as any).mediaDevices;
    });

    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Verify recording controls are hidden for unsupported browsers
    await expect(page.locator('[data-testid="start-recording-button"]')).not.toBeVisible();
    
    // Verify compatibility message is shown
    await expect(page.locator('[data-testid="browser-compatibility-message"]')).toBeVisible();
  });

  test('Recording State Persistence Across Page Reload', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Start recording
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    
    // Verify recording is active
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    
    // Reload page
    await page.reload();
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Verify recording state is restored
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="stop-recording-button"]')).toBeVisible();
  });

  test('Recording Automatic Stop on Classroom Leave', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Start recording
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    
    // Verify recording is active
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    
    // Leave classroom
    const leaveButton = page.locator('[data-testid="leave-room-button"]');
    await leaveButton.click();
    
    // Verify recording is automatically stopped
    await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
    
    // Navigate to recordings page
    await page.goto('/recordings');
    
    // Verify recording is available for download
    const recordingItem = page.locator('[data-testid="recording-item"]').first();
    await expect(recordingItem).toBeVisible();
  });

  test('Recording TTL Cleanup', async () => {
    // Mock expired recording
    await page.addInitScript(() => {
      const expiredRecording = {
        id: 'expired-recording-123',
        classroomId: 'test-classroom',
        userId: 'test-user',
        startTime: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        status: 'STOPPED',
        fileName: 'expired-recording.webm',
        fileSize: 1024,
        ttl: Date.now() - 60 * 60 * 1000, // 1 hour ago
        retryCount: 0,
      };
      
      localStorage.setItem('overcast-recordings-test-user', JSON.stringify([expiredRecording]));
    });

    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Wait for cleanup to run
    await page.waitForTimeout(1000);
    
    // Verify expired recording is cleaned up
    const recordings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('overcast-recordings-test-user') || '[]');
    });
    
    expect(recordings).toHaveLength(0);
  });

  test('Recording Performance - Start/Stop Response Time', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Measure start recording response time
    const startTime = Date.now();
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
    const startResponseTime = Date.now() - startTime;
    
    // Verify response time is under 100ms
    expect(startResponseTime).toBeLessThan(100);
    
    // Measure stop recording response time
    const stopTime = Date.now();
    const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
    await stopRecordingButton.click();
    await expect(page.locator('[data-testid="recording-saved-message"]')).toBeVisible();
    const stopResponseTime = Date.now() - stopTime;
    
    // Verify response time is under 100ms
    expect(stopResponseTime).toBeLessThan(100);
  });
});
