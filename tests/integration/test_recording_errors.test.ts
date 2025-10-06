import { test, expect } from '@playwright/test';

/**
 * Integration Test: Recording Error Handling
 * 
 * Tests error scenarios for recording functionality including permission denial,
 * storage quota exceeded, retry mechanisms, and graceful degradation.
 * 
 * Based on recording error handling requirements and edge cases.
 * Validates: Error handling (FR-ERROR), retry logic, storage management
 */

test.describe('Recording Error Handling Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('http://localhost:3000');
  });

  test('should handle camera/microphone permission denial', async ({ page }) => {
    // Mock getUserMedia to reject with permission denied
    await page.addInitScript(() => {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      );
    });

    // Join a classroom first
    await page.route('**/api/rooms/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          name: 'Cohort 1',
          participantCount: 1,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/1/join', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          roomUrl: 'https://test.daily.co/room1',
          participantId: 'test-participant-1'
        })
      });
    });

    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Permission Test User');
    await page.click('[data-testid="join-as-student"]');

    // Should successfully join the classroom
    await expect(page).toHaveURL(/\/classroom\/1/);

    // Try to start recording
    await page.click('[data-testid="start-recording-button"]');

    // Should show permission denied error
    await expect(page.locator('[data-testid="recording-error"]')).toContainText('Permission denied');
    await expect(page.locator('[data-testid="recording-error"]')).toContainText('camera/microphone access');

    // Should provide retry option
    await expect(page.locator('[data-testid="retry-recording-button"]')).toBeVisible();

    // Should show helpful instructions
    await expect(page.locator('[data-testid="permission-help"]')).toContainText('Allow camera and microphone access');
  });

  test('should handle storage quota exceeded error', async ({ page }) => {
    // Mock localStorage to simulate quota exceeded
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });
    });

    // Join classroom
    await page.route('**/api/rooms/2', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '2',
          name: 'Cohort 2',
          participantCount: 1,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/2/join', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          roomUrl: 'https://test.daily.co/room2',
          participantId: 'test-participant-2'
        })
      });
    });

    await page.click('text=Cohort 2');
    await page.fill('[data-testid="name-input"]', 'Storage Test User');
    await page.click('[data-testid="join-as-student"]');

    await expect(page).toHaveURL(/\/classroom\/2/);

    // Try to start recording
    await page.click('[data-testid="start-recording-button"]');

    // Should show storage quota error
    await expect(page.locator('[data-testid="recording-error"]')).toContainText('Storage quota exceeded');
    await expect(page.locator('[data-testid="recording-error"]')).toContainText('clear some recordings');

    // Should provide cleanup option
    await expect(page.locator('[data-testid="cleanup-recordings-button"]')).toBeVisible();
  });

  test('should handle MediaRecorder API not supported', async ({ page }) => {
    // Mock MediaRecorder as undefined
    await page.addInitScript(() => {
      // @ts-ignore
      window.MediaRecorder = undefined;
    });

    // Join classroom
    await page.route('**/api/rooms/3', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '3',
          name: 'Cohort 3',
          participantCount: 1,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/3/join', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          roomUrl: 'https://test.daily.co/room3',
          participantId: 'test-participant-3'
        })
      });
    });

    await page.click('text=Cohort 3');
    await page.fill('[data-testid="name-input"]', 'Browser Test User');
    await page.click('[data-testid="join-as-student"]');

    await expect(page).toHaveURL(/\/classroom\/3/);

    // Recording button should be disabled or hidden
    await expect(page.locator('[data-testid="start-recording-button"]')).toBeDisabled();
    
    // Should show browser compatibility message
    await expect(page.locator('[data-testid="browser-compatibility-warning"]')).toContainText('Recording not supported');
    await expect(page.locator('[data-testid="browser-compatibility-warning"]')).toContainText('upgrade your browser');
  });

  test('should handle recording start failure with retry', async ({ page }) => {
    let attemptCount = 0;
    
    // Mock MediaRecorder to fail first two attempts, succeed on third
    await page.addInitScript(() => {
      const originalMediaRecorder = window.MediaRecorder;
      window.MediaRecorder = class MockMediaRecorder extends originalMediaRecorder {
        constructor(stream: MediaStream, options?: MediaRecorderOptions) {
          super(stream, options);
          attemptCount++;
          if (attemptCount <= 2) {
            // Simulate failure on first two attempts
            setTimeout(() => {
              this.dispatchEvent(new Event('error'));
            }, 100);
          }
        }
      } as any;
    });

    // Join classroom
    await page.route('**/api/rooms/4', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '4',
          name: 'Cohort 4',
          participantCount: 1,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/4/join', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          roomUrl: 'https://test.daily.co/room4',
          participantId: 'test-participant-4'
        })
      });
    });

    await page.click('text=Cohort 4');
    await page.fill('[data-testid="name-input"]', 'Retry Test User');
    await page.click('[data-testid="join-as-student"]');

    await expect(page).toHaveURL(/\/classroom\/4/);

    // Start recording
    await page.click('[data-testid="start-recording-button"]');

    // Should show retry attempts
    await expect(page.locator('[data-testid="recording-status"]')).toContainText('Retrying');
    await expect(page.locator('[data-testid="retry-count"]')).toContainText('1');

    // Wait for retry attempts to complete
    await page.waitForSelector('[data-testid="recording-status"]:has-text("Recording")', { timeout: 10000 });

    // Should eventually succeed
    await expect(page.locator('[data-testid="recording-status"]')).toContainText('Recording');
  });

  test('should handle recording stop failure', async ({ page }) => {
    // Mock MediaRecorder to fail on stop
    await page.addInitScript(() => {
      const originalMediaRecorder = window.MediaRecorder;
      window.MediaRecorder = class MockMediaRecorder extends originalMediaRecorder {
        stop() {
          // Simulate stop failure
          setTimeout(() => {
            this.dispatchEvent(new Event('error'));
          }, 100);
        }
      } as any;
    });

    // Join classroom
    await page.route('**/api/rooms/5', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '5',
          name: 'Cohort 5',
          participantCount: 1,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/5/join', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          roomUrl: 'https://test.daily.co/room5',
          participantId: 'test-participant-5'
        })
      });
    });

    await page.click('text=Cohort 5');
    await page.fill('[data-testid="name-input"]', 'Stop Test User');
    await page.click('[data-testid="join-as-student"]');

    await expect(page).toHaveURL(/\/classroom\/5/);

    // Start recording successfully
    await page.click('[data-testid="start-recording-button"]');
    await expect(page.locator('[data-testid="recording-status"]')).toContainText('Recording');

    // Try to stop recording
    await page.click('[data-testid="stop-recording-button"]');

    // Should show stop failure error
    await expect(page.locator('[data-testid="recording-error"]')).toContainText('Failed to stop recording');
    await expect(page.locator('[data-testid="recording-error"]')).toContainText('try again');

    // Should provide retry option
    await expect(page.locator('[data-testid="retry-stop-button"]')).toBeVisible();
  });

  test('should handle network interruption during recording', async ({ page }) => {
    // Mock network interruption
    await page.addInitScript(() => {
      const originalMediaRecorder = window.MediaRecorder;
      window.MediaRecorder = class MockMediaRecorder extends originalMediaRecorder {
        constructor(stream: MediaStream, options?: MediaRecorderOptions) {
          super(stream, options);
          // Simulate network interruption after 2 seconds
          setTimeout(() => {
            this.dispatchEvent(new Event('error'));
          }, 2000);
        }
      } as any;
    });

    // Join classroom
    await page.route('**/api/rooms/6', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '6',
          name: 'Cohort 6',
          participantCount: 1,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/6/join', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          roomUrl: 'https://test.daily.co/room6',
          participantId: 'test-participant-6'
        })
      });
    });

    await page.click('text=Cohort 6');
    await page.fill('[data-testid="name-input"]', 'Network Test User');
    await page.click('[data-testid="join-as-student"]');

    await expect(page).toHaveURL(/\/classroom\/6/);

    // Start recording
    await page.click('[data-testid="start-recording-button"]');
    await expect(page.locator('[data-testid="recording-status"]')).toContainText('Recording');

    // Wait for network interruption
    await page.waitForSelector('[data-testid="recording-error"]', { timeout: 5000 });

    // Should show network error
    await expect(page.locator('[data-testid="recording-error"]')).toContainText('Network interruption');
    await expect(page.locator('[data-testid="recording-error"]')).toContainText('recording stopped');

    // Should provide option to restart
    await expect(page.locator('[data-testid="restart-recording-button"]')).toBeVisible();
  });

  test('should handle multiple simultaneous recording errors', async ({ page }) => {
    // Mock multiple error conditions
    await page.addInitScript(() => {
      // Mock permission denied
      navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError')
      );
      
      // Mock storage quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });
    });

    // Join classroom
    await page.route('**/api/rooms/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          name: 'Cohort 1',
          participantCount: 1,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/1/join', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          roomUrl: 'https://test.daily.co/room1',
          participantId: 'test-participant-1'
        })
      });
    });

    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Multiple Error User');
    await page.click('[data-testid="join-as-student"]');

    await expect(page).toHaveURL(/\/classroom\/1/);

    // Try to start recording
    await page.click('[data-testid="start-recording-button"]');

    // Should show primary error (permission denied)
    await expect(page.locator('[data-testid="recording-error"]')).toContainText('Permission denied');

    // Should show secondary error (storage quota)
    await expect(page.locator('[data-testid="storage-warning"]')).toContainText('Storage quota exceeded');

    // Should provide multiple resolution options
    await expect(page.locator('[data-testid="permission-help"]')).toBeVisible();
    await expect(page.locator('[data-testid="cleanup-recordings-button"]')).toBeVisible();
  });

  test('should handle recording cleanup errors', async ({ page }) => {
    // Mock localStorage to fail on cleanup
    await page.addInitScript(() => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = jest.fn().mockImplementation(() => {
        throw new Error('Cleanup failed');
      });
    });

    // Join classroom
    await page.route('**/api/rooms/2', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '2',
          name: 'Cohort 2',
          participantCount: 1,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/2/join', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          roomUrl: 'https://test.daily.co/room2',
          participantId: 'test-participant-2'
        })
      });
    });

    await page.click('text=Cohort 2');
    await page.fill('[data-testid="name-input"]', 'Cleanup Test User');
    await page.click('[data-testid="join-as-student"]');

    await expect(page).toHaveURL(/\/classroom\/2/);

    // Try to clean up recordings
    await page.click('[data-testid="cleanup-recordings-button"]');

    // Should show cleanup error
    await expect(page.locator('[data-testid="cleanup-error"]')).toContainText('Failed to cleanup recordings');
    await expect(page.locator('[data-testid="cleanup-error"]')).toContainText('try again later');

    // Should provide manual cleanup option
    await expect(page.locator('[data-testid="manual-cleanup-button"]')).toBeVisible();
  });

  test('should handle recording download errors', async ({ page }) => {
    // Mock URL.createObjectURL to fail
    await page.addInitScript(() => {
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = jest.fn().mockImplementation(() => {
        throw new Error('Download URL creation failed');
      });
    });

    // Join classroom
    await page.route('**/api/rooms/3', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '3',
          name: 'Cohort 3',
          participantCount: 1,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/3/join', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          roomUrl: 'https://test.daily.co/room3',
          participantId: 'test-participant-3'
        })
      });
    });

    await page.click('text=Cohort 3');
    await page.fill('[data-testid="name-input"]', 'Download Test User');
    await page.click('[data-testid="join-as-student"]');

    await expect(page).toHaveURL(/\/classroom\/3/);

    // Start and stop recording
    await page.click('[data-testid="start-recording-button"]');
    await page.waitForSelector('[data-testid="recording-status"]:has-text("Recording")');
    await page.click('[data-testid="stop-recording-button"]');
    await page.waitForSelector('[data-testid="recording-status"]:has-text("Stopped")');

    // Try to download recording
    await page.click('[data-testid="download-recording-button"]');

    // Should show download error
    await expect(page.locator('[data-testid="download-error"]')).toContainText('Failed to download recording');
    await expect(page.locator('[data-testid="download-error"]')).toContainText('try again');

    // Should provide retry option
    await expect(page.locator('[data-testid="retry-download-button"]')).toBeVisible();
  });
});
