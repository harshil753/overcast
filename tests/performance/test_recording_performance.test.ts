/**
 * Performance Tests for Video Recording Feature
 * 
 * These tests validate that recording operations meet the performance requirements
 * of <100ms response time for start/stop operations. They measure actual timing
 * and ensure the recording feature doesn't impact overall application performance.
 * 
 * WHY: Performance is critical for user experience. Recording operations must
 * be fast and responsive to maintain smooth classroom interactions.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Performance thresholds
const RECORDING_START_THRESHOLD = 100; // 100ms
const RECORDING_STOP_THRESHOLD = 100; // 100ms
const MEMORY_USAGE_THRESHOLD = 100 * 1024 * 1024; // 100MB
const CPU_USAGE_THRESHOLD = 50; // 50%

test.describe('Recording Performance Tests', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    page = await context.newPage();
    
    // Mock MediaRecorder API for consistent testing
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
          // Simulate data available events
          setTimeout(() => {
            if (this.ondataavailable) {
              this.ondataavailable({
                data: new Blob(['test data'], { type: 'video/webm' }),
              });
            }
          }, 50);
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

  test('Recording Start Performance - Single Operation', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Measure recording start time
    const startTime = Date.now();
    
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    
    // Wait for recording to start
    await page.waitForSelector('[data-testid="recording-indicator"]');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Verify performance threshold
    expect(responseTime).toBeLessThan(RECORDING_START_THRESHOLD);
    console.log(`Recording start time: ${responseTime}ms`);
  });

  test('Recording Stop Performance - Single Operation', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Start recording first
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    await page.waitForSelector('[data-testid="recording-indicator"]');
    
    // Measure recording stop time
    const startTime = Date.now();
    
    const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
    await stopRecordingButton.click();
    
    // Wait for recording to stop
    await page.waitForSelector('[data-testid="recording-saved-message"]');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Verify performance threshold
    expect(responseTime).toBeLessThan(RECORDING_STOP_THRESHOLD);
    console.log(`Recording stop time: ${responseTime}ms`);
  });

  test('Recording Start Performance - Multiple Operations', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    const responseTimes: number[] = [];
    
    // Perform multiple start operations
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
      await startRecordingButton.click();
      await page.waitForSelector('[data-testid="recording-indicator"]');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);
      
      // Stop recording for next iteration
      const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
      await stopRecordingButton.click();
      await page.waitForSelector('[data-testid="recording-saved-message"]');
      
      // Wait for state to reset
      await page.waitForTimeout(100);
    }
    
    // Verify all operations meet threshold
    responseTimes.forEach((time, index) => {
      expect(time).toBeLessThan(RECORDING_START_THRESHOLD);
      console.log(`Recording start ${index + 1}: ${time}ms`);
    });
    
    // Verify average performance
    const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    expect(averageTime).toBeLessThan(RECORDING_START_THRESHOLD);
    console.log(`Average recording start time: ${averageTime}ms`);
  });

  test('Recording Stop Performance - Multiple Operations', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    const responseTimes: number[] = [];
    
    // Perform multiple stop operations
    for (let i = 0; i < 5; i++) {
      // Start recording
      const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
      await startRecordingButton.click();
      await page.waitForSelector('[data-testid="recording-indicator"]');
      
      const startTime = Date.now();
      
      const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
      await stopRecordingButton.click();
      await page.waitForSelector('[data-testid="recording-saved-message"]');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);
      
      // Wait for state to reset
      await page.waitForTimeout(100);
    }
    
    // Verify all operations meet threshold
    responseTimes.forEach((time, index) => {
      expect(time).toBeLessThan(RECORDING_STOP_THRESHOLD);
      console.log(`Recording stop ${index + 1}: ${time}ms`);
    });
    
    // Verify average performance
    const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    expect(averageTime).toBeLessThan(RECORDING_STOP_THRESHOLD);
    console.log(`Average recording stop time: ${averageTime}ms`);
  });

  test('Memory Usage During Recording', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Start recording
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    await page.waitForSelector('[data-testid="recording-indicator"]');
    
    // Wait for recording to process
    await page.waitForTimeout(2000);
    
    // Get memory usage during recording
    const recordingMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Stop recording
    const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
    await stopRecordingButton.click();
    await page.waitForSelector('[data-testid="recording-saved-message"]');
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Verify memory usage is reasonable
    const memoryIncrease = recordingMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(MEMORY_USAGE_THRESHOLD);
    console.log(`Memory increase during recording: ${memoryIncrease} bytes`);
    
    // Verify memory is cleaned up after recording
    const memoryCleanup = finalMemory - recordingMemory;
    expect(memoryCleanup).toBeLessThan(0); // Memory should decrease
    console.log(`Memory cleanup after recording: ${memoryCleanup} bytes`);
  });

  test('CPU Usage During Recording', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Start recording
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    await page.waitForSelector('[data-testid="recording-indicator"]');
    
    // Measure CPU usage during recording
    const cpuUsage = await page.evaluate(() => {
      const start = performance.now();
      let iterations = 0;
      
      // Simulate CPU-intensive work
      while (performance.now() - start < 100) {
        iterations++;
      }
      
      return iterations;
    });
    
    // Verify CPU usage is reasonable
    expect(cpuUsage).toBeLessThan(CPU_USAGE_THRESHOLD);
    console.log(`CPU usage during recording: ${cpuUsage} iterations`);
  });

  test('Recording Performance Under Load', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    const responseTimes: number[] = [];
    
    // Perform rapid start/stop operations
    for (let i = 0; i < 10; i++) {
      // Start recording
      const startTime = Date.now();
      const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
      await startRecordingButton.click();
      await page.waitForSelector('[data-testid="recording-indicator"]');
      const startResponseTime = Date.now() - startTime;
      responseTimes.push(startResponseTime);
      
      // Stop recording
      const stopTime = Date.now();
      const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
      await stopRecordingButton.click();
      await page.waitForSelector('[data-testid="recording-saved-message"]');
      const stopResponseTime = Date.now() - stopTime;
      responseTimes.push(stopResponseTime);
      
      // Wait for state to reset
      await page.waitForTimeout(50);
    }
    
    // Verify all operations meet threshold
    responseTimes.forEach((time, index) => {
      expect(time).toBeLessThan(Math.max(RECORDING_START_THRESHOLD, RECORDING_STOP_THRESHOLD));
      console.log(`Operation ${index + 1}: ${time}ms`);
    });
    
    // Verify performance doesn't degrade over time
    const firstHalf = responseTimes.slice(0, Math.floor(responseTimes.length / 2));
    const secondHalf = responseTimes.slice(Math.floor(responseTimes.length / 2));
    
    const firstHalfAverage = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAverage = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    // Performance shouldn't degrade significantly
    expect(secondHalfAverage).toBeLessThan(firstHalfAverage * 1.5);
    console.log(`First half average: ${firstHalfAverage}ms`);
    console.log(`Second half average: ${secondHalfAverage}ms`);
  });

  test('Recording Performance with Multiple Tabs', async () => {
    // Open multiple tabs
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();
    
    try {
      // Navigate both tabs to classroom
      await tab1.goto('/classroom/test-classroom');
      await tab2.goto('/classroom/test-classroom');
      
      await tab1.waitForSelector('[data-testid="classroom-container"]');
      await tab2.waitForSelector('[data-testid="classroom-container"]');
      
      // Start recording in first tab
      const startTime = Date.now();
      const startRecordingButton1 = tab1.locator('[data-testid="start-recording-button"]');
      await startRecordingButton1.click();
      await tab1.waitForSelector('[data-testid="recording-indicator"]');
      
      const responseTime = Date.now() - startTime;
      
      // Verify performance is still good with multiple tabs
      expect(responseTime).toBeLessThan(RECORDING_START_THRESHOLD);
      console.log(`Recording start time with multiple tabs: ${responseTime}ms`);
      
      // Stop recording
      const stopRecordingButton1 = tab1.locator('[data-testid="stop-recording-button"]');
      await stopRecordingButton1.click();
      await tab1.waitForSelector('[data-testid="recording-saved-message"]');
      
    } finally {
      await tab1.close();
      await tab2.close();
    }
  });

  test('Recording Performance with Background Tasks', async () => {
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Start background tasks
    await page.evaluate(() => {
      // Simulate background tasks
      setInterval(() => {
        const data = new Array(1000).fill(0).map((_, i) => i);
        data.sort();
      }, 100);
    });
    
    // Measure recording performance with background tasks
    const startTime = Date.now();
    
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    await page.waitForSelector('[data-testid="recording-indicator"]');
    
    const responseTime = Date.now() - startTime;
    
    // Verify performance is still good with background tasks
    expect(responseTime).toBeLessThan(RECORDING_START_THRESHOLD);
    console.log(`Recording start time with background tasks: ${responseTime}ms`);
    
    // Stop recording
    const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
    await stopRecordingButton.click();
    await page.waitForSelector('[data-testid="recording-saved-message"]');
  });

  test('Recording Performance with Network Latency', async () => {
    // Simulate network latency
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      route.continue();
    });
    
    await page.goto('/classroom/test-classroom');
    await page.waitForSelector('[data-testid="classroom-container"]');
    
    // Measure recording performance with network latency
    const startTime = Date.now();
    
    const startRecordingButton = page.locator('[data-testid="start-recording-button"]');
    await startRecordingButton.click();
    await page.waitForSelector('[data-testid="recording-indicator"]');
    
    const responseTime = Date.now() - startTime;
    
    // Verify performance is still good with network latency
    expect(responseTime).toBeLessThan(RECORDING_START_THRESHOLD);
    console.log(`Recording start time with network latency: ${responseTime}ms`);
    
    // Stop recording
    const stopRecordingButton = page.locator('[data-testid="stop-recording-button"]');
    await stopRecordingButton.click();
    await page.waitForSelector('[data-testid="recording-saved-message"]');
  });
});
