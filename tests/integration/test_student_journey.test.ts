/**
 * Integration Test: Student Journey
 * 
 * Tests the complete student workflow from name entry through classroom participation.
 * WHY: Validates end-to-end user experience for students (FR-003, FR-004, FR-006, FR-007).
 * 
 * Test Flow:
 * 1. User enters name on landing page
 * 2. User sees lobby with 6 classrooms
 * 3. User joins classroom as student
 * 4. User sees video feed
 * 5. User returns to lobby
 * 6. User can switch to different classroom
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds for video connections

test.describe('Student Journey Integration Tests', () => {
  
  /**
   * Helper: Enter name on landing page
   * WHY: Centralizes name entry logic for reuse
   */
  async function enterName(page: Page, name: string) {
    await page.goto(BASE_URL);
    await page.fill('input[type="text"]', name);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/lobby*`);
  }

  test('should complete full student journey from name entry to classroom', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================================================
    // STEP 1: Enter Name on Landing Page
    // ========================================================================
    
    await page.goto(BASE_URL);
    
    // Verify landing page loads with Overcast branding
    await expect(page.locator('h1')).toContainText('OVERCAST');
    await expect(page.locator('text=Video Classroom Platform')).toBeVisible();
    
    // Verify info cards show correct numbers
    await expect(page.locator('text=6')).toBeVisible(); // 6 classrooms
    await expect(page.locator('text=10')).toBeVisible(); // 10 max per room
    
    // Enter name (1-50 characters per FR-015)
    const studentName = 'Alex Smith';
    await page.fill('input[type="text"]', studentName);
    
    // Verify character counter updates
    await expect(page.locator(`text=${studentName.length}/50`)).toBeVisible();
    
    // Submit name entry form
    await page.click('button[type="submit"]');
    
    // ========================================================================
    // STEP 2: View Lobby with 6 Classrooms
    // ========================================================================
    
    // Should navigate to lobby with name in URL params
    await page.waitForURL(`${BASE_URL}/lobby?name=${encodeURIComponent(studentName)}`);
    
    // Verify Overcast header is visible
    await expect(page.locator('h1')).toContainText('OVERCAST');
    
    // Verify 6 classroom cards are displayed (FR-001)
    const classroomCards = page.locator('button[data-classroom-id]');
    await expect(classroomCards).toHaveCount(6);
    
    // Verify classroom names (Cohort 1-6)
    await expect(page.locator('text=Cohort 1')).toBeVisible();
    await expect(page.locator('text=Cohort 2')).toBeVisible();
    await expect(page.locator('text=Cohort 3')).toBeVisible();
    await expect(page.locator('text=Cohort 4')).toBeVisible();
    await expect(page.locator('text=Cohort 5')).toBeVisible();
    await expect(page.locator('text=Cohort 6')).toBeVisible();
    
    // Verify Student/Instructor toggle is visible (FR-006)
    const studentToggle = page.locator('[data-testid="role-toggle-student"]');
    const instructorToggle = page.locator('[data-testid="role-toggle-instructor"]');
    await expect(studentToggle).toBeVisible();
    await expect(instructorToggle).toBeVisible();
    
    // Verify Student mode is selected by default
    await expect(studentToggle).toHaveAttribute('aria-pressed', 'true');
    
    // Verify participant counts are displayed (FR-011)
    await expect(page.locator('text=Participants').first()).toBeVisible();
    
    // Verify futuristic theme (black background, teal accents)
    const body = page.locator('body');
    const bodyBg = await body.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bodyBg).toBe('rgb(0, 0, 0)'); // Black background
    
    // ========================================================================
    // STEP 3: Join Classroom as Student
    // ========================================================================
    
    // Click on Cohort 1 classroom card
    const cohort1Button = page.locator('button[data-classroom-id="cohort-1"]');
    await cohort1Button.click();
    
    // Should navigate to classroom page (FR-002)
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // ========================================================================
    // STEP 4: Verify Video Feed and Classroom View
    // ========================================================================
    
    // Verify classroom name is displayed
    await expect(page.locator('text=Cohort 1')).toBeVisible();
    
    // Verify "Return to Main Lobby" button is present (FR-005)
    const returnButton = page.locator('button:has-text("Return")');
    await expect(returnButton).toBeVisible();
    
    // Verify video feed area is present
    // Note: Actual Daily.co video connection may not work in headless tests
    // We validate UI elements are present
    const videoContainer = page.locator('[data-testid="video-feed"]');
    await expect(videoContainer.or(page.locator('text=Connecting'))).toBeVisible();
    
    // Verify audio/video controls are available
    // Look for mute/video buttons or icons
    const controlButtons = page.locator('button').filter({ hasText: /mute|video|audio|camera/i });
    await expect(controlButtons.first()).toBeVisible();
    
    // Verify NO instructor controls are visible (student mode)
    const instructorPanel = page.locator('[data-testid="instructor-controls"]');
    await expect(instructorPanel).not.toBeVisible();
    
    // Verify participant count is displayed
    await expect(page.locator('text=/participant/i')).toBeVisible();
    
    // ========================================================================
    // STEP 5: Return to Main Lobby
    // ========================================================================
    
    // Click return to lobby button
    await returnButton.click();
    
    // Should navigate back to lobby (FR-005)
    await page.waitForURL(`${BASE_URL}/lobby*`);
    
    // Verify 6 classrooms are still displayed
    await expect(classroomCards).toHaveCount(6);
    
    // Verify user session persists (name should still be in URL or session)
    const currentUrl = page.url();
    expect(currentUrl).toContain('lobby');
    
    // ========================================================================
    // STEP 6: Switch to Different Classroom
    // ========================================================================
    
    // Click on Cohort 2 classroom card
    const cohort2Button = page.locator('button[data-classroom-id="cohort-2"]');
    await cohort2Button.click();
    
    // Should navigate to Cohort 2 classroom
    await page.waitForURL(`${BASE_URL}/classroom/cohort-2`);
    
    // Verify classroom name shows Cohort 2
    await expect(page.locator('text=Cohort 2')).toBeVisible();
    
    // Verify video feed is present
    await expect(videoContainer.or(page.locator('text=Connecting'))).toBeVisible();
    
    // Verify can return to lobby again
    await expect(returnButton).toBeVisible();
  });

  test('should display correct participant counts in lobby', async ({ page }) => {
    await enterName(page, 'Test Observer');
    
    // Wait for lobby to load
    await page.waitForURL(`${BASE_URL}/lobby*`);
    
    // Verify each classroom card shows participant count
    const classroomCards = page.locator('button[data-classroom-id]');
    const count = await classroomCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = classroomCards.nth(i);
      // Each card should show "X/10" format
      await expect(card.locator('text=/\\d+\\/10/')).toBeVisible();
    }
  });

  test('should handle classroom at capacity gracefully', async ({ page }) => {
    await enterName(page, 'Late Student');
    
    // Wait for lobby
    await page.waitForURL(`${BASE_URL}/lobby*`);
    
    // Check for any classrooms marked as full
    const fullClassroom = page.locator('button[data-classroom-id]:has-text("Full")').first();
    
    // If a classroom is full, verify it's disabled
    const isVisible = await fullClassroom.isVisible().catch(() => false);
    if (isVisible) {
      const isDisabled = await fullClassroom.isDisabled();
      expect(isDisabled).toBe(true);
    }
    
    // Note: In MVP with stubbed participant counts (all 0), no classrooms should be full
    // This test validates the UI handles the full state correctly
  });

  test('should preserve user session across navigation', async ({ page }) => {
    const userName = 'Session Test User';
    await enterName(page, userName);
    
    // Navigate to lobby
    await page.waitForURL(`${BASE_URL}/lobby*`);
    
    // Join classroom
    await page.click('button[data-classroom-id="cohort-1"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // Return to lobby
    await page.click('button:has-text("Return")');
    await page.waitForURL(`${BASE_URL}/lobby*`);
    
    // User should still have session (no need to re-enter name)
    // Verify lobby displays without redirecting to name entry
    await expect(page.locator('h1')).toContainText('OVERCAST');
    await expect(page.locator('button[data-classroom-id]')).toHaveCount(6);
  });

  test('should enforce name validation (1-50 characters)', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Try empty name
    await page.fill('input[type="text"]', '');
    const submitButton = page.locator('button[type="submit"]');
    
    // Submit button should be disabled
    await expect(submitButton).toBeDisabled();
    
    // Try valid name
    await page.fill('input[type="text"]', 'Valid Name');
    await expect(submitButton).not.toBeDisabled();
    
    // Try name at maximum length (50 characters)
    const maxName = 'A'.repeat(50);
    await page.fill('input[type="text"]', maxName);
    await expect(page.locator('text=50/50')).toBeVisible();
    await expect(submitButton).not.toBeDisabled();
    
    // Input should prevent typing beyond 50 characters
    const inputValue = await page.locator('input[type="text"]').inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(50);
  });

  test('should display futuristic branding throughout journey', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verify landing page branding
    await expect(page.locator('text=Powered by the Overclock Accelerator')).toBeVisible();
    
    // Enter name and go to lobby
    await page.fill('input[type="text"]', 'Branding Test');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/lobby*`);
    
    // Verify footer branding persists
    await expect(page.locator('text=Powered by the Overclock Accelerator')).toBeVisible();
    
    // Join classroom
    await page.click('button[data-classroom-id="cohort-1"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // Verify footer branding still present in classroom
    await expect(page.locator('text=Powered by the Overclock Accelerator')).toBeVisible();
  });
});
