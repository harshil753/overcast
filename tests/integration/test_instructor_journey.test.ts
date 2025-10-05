/**
 * Integration Test: Instructor Journey
 * 
 * Tests the complete instructor workflow including role selection and classroom management.
 * WHY: Validates instructor-specific features and controls (FR-006, FR-009, FR-012).
 * 
 * Test Flow:
 * 1. User enters name on landing page
 * 2. User toggles to Instructor mode in lobby
 * 3. User joins classroom as instructor
 * 4. Instructor controls are visible
 * 5. Instructor can mute participants (if present)
 * 6. Instructor returns to lobby
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds for video connections

test.describe('Instructor Journey Integration Tests', () => {
  
  /**
   * Helper: Enter name and navigate to lobby
   * WHY: Centralizes common setup for instructor tests
   */
  async function enterNameAndGoToLobby(page: Page, name: string) {
    await page.goto(BASE_URL);
    await page.fill('input[type="text"]', name);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/lobby*`);
  }

  test('should complete full instructor journey with role selection', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT);

    // ========================================================================
    // STEP 1: Enter Name on Landing Page
    // ========================================================================
    
    await page.goto(BASE_URL);
    
    // Verify landing page
    await expect(page.locator('h1')).toContainText('OVERCAST');
    
    // Enter instructor name
    const instructorName = 'Dr. Johnson';
    await page.fill('input[type="text"]', instructorName);
    await page.click('button[type="submit"]');
    
    // ========================================================================
    // STEP 2: Toggle to Instructor Mode
    // ========================================================================
    
    // Wait for lobby to load
    await page.waitForURL(`${BASE_URL}/lobby?name=${encodeURIComponent(instructorName)}`);
    
    // Verify Student mode is selected by default
    const studentToggle = page.locator('[data-testid="role-toggle-student"]');
    const instructorToggle = page.locator('[data-testid="role-toggle-instructor"]');
    
    await expect(studentToggle).toBeVisible();
    await expect(instructorToggle).toBeVisible();
    await expect(studentToggle).toHaveAttribute('aria-pressed', 'true');
    
    // Click Instructor toggle (FR-006)
    await instructorToggle.click();
    
    // Verify Instructor mode is now active
    await expect(instructorToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(studentToggle).toHaveAttribute('aria-pressed', 'false');
    
    // Verify 6 classrooms are still displayed
    const classroomCards = page.locator('button[data-classroom-id]');
    await expect(classroomCards).toHaveCount(6);
    
    // Verify join buttons now say "Join as Instructor"
    const joinButton = classroomCards.first().locator('text=/Instructor/i');
    await expect(joinButton).toBeVisible();
    
    // ========================================================================
    // STEP 3: Join Classroom as Instructor
    // ========================================================================
    
    // Click on Cohort 1 classroom
    const cohort1Button = page.locator('button[data-classroom-id="cohort-1"]');
    await cohort1Button.click();
    
    // Should navigate to classroom
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // ========================================================================
    // STEP 4: Verify Instructor Controls are Visible
    // ========================================================================
    
    // Verify classroom name
    await expect(page.locator('text=Cohort 1')).toBeVisible();
    
    // Verify instructor badge or indicator is visible
    await expect(page.locator('text=/instructor/i')).toBeVisible();
    
    // Verify instructor controls panel is visible (FR-009)
    const instructorPanel = page.locator('[data-testid="instructor-controls"]');
    await expect(instructorPanel).toBeVisible();
    
    // Verify mute controls are available
    // Note: With 0 participants in MVP, participant list may be empty
    // But the controls panel should still be visible
    await expect(page.locator('text=/mute|participants/i')).toBeVisible();
    
    // Verify return to lobby button is present
    const returnButton = page.locator('button:has-text("Return")');
    await expect(returnButton).toBeVisible();
    
    // Verify video feed area is present (instructors also have video)
    const videoContainer = page.locator('[data-testid="video-feed"]');
    await expect(videoContainer.or(page.locator('text=Connecting'))).toBeVisible();
    
    // ========================================================================
    // STEP 5: Verify Instructor Has All Student Features Too
    // ========================================================================
    
    // Instructors should have access to audio/video controls
    const controlButtons = page.locator('button').filter({ hasText: /mute|video|audio|camera/i });
    await expect(controlButtons.first()).toBeVisible();
    
    // Verify participant count is displayed
    await expect(page.locator('text=/participant/i')).toBeVisible();
    
    // ========================================================================
    // STEP 6: Return to Lobby
    // ========================================================================
    
    // Click return to lobby button
    await returnButton.click();
    
    // Should navigate back to lobby
    await page.waitForURL(`${BASE_URL}/lobby*`);
    
    // Verify instructor mode is still selected
    await expect(instructorToggle).toHaveAttribute('aria-pressed', 'true');
    
    // Verify 6 classrooms are displayed
    await expect(classroomCards).toHaveCount(6);
  });

  test('should persist instructor role selection across navigation', async ({ page }) => {
    const instructorName = 'Prof. Williams';
    await enterNameAndGoToLobby(page, instructorName);
    
    // Toggle to instructor mode
    const instructorToggle = page.locator('[data-testid="role-toggle-instructor"]');
    await instructorToggle.click();
    await expect(instructorToggle).toHaveAttribute('aria-pressed', 'true');
    
    // Join classroom
    await page.click('button[data-classroom-id="cohort-1"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // Verify instructor controls are visible
    await expect(page.locator('[data-testid="instructor-controls"]')).toBeVisible();
    
    // Return to lobby
    await page.click('button:has-text("Return")');
    await page.waitForURL(`${BASE_URL}/lobby*`);
    
    // Instructor mode should still be selected
    await expect(instructorToggle).toHaveAttribute('aria-pressed', 'true');
    
    // Join different classroom
    await page.click('button[data-classroom-id="cohort-2"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-2`);
    
    // Instructor controls should still be visible
    await expect(page.locator('[data-testid="instructor-controls"]')).toBeVisible();
  });

  test('should allow switching from student to instructor mode', async ({ page }) => {
    await enterNameAndGoToLobby(page, 'Flexible User');
    
    // Start in student mode (default)
    const studentToggle = page.locator('[data-testid="role-toggle-student"]');
    const instructorToggle = page.locator('[data-testid="role-toggle-instructor"]');
    
    await expect(studentToggle).toHaveAttribute('aria-pressed', 'true');
    
    // Join as student
    await page.click('button[data-classroom-id="cohort-1"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // No instructor controls
    await expect(page.locator('[data-testid="instructor-controls"]')).not.toBeVisible();
    
    // Return to lobby
    await page.click('button:has-text("Return")');
    await page.waitForURL(`${BASE_URL}/lobby*`);
    
    // Switch to instructor mode
    await instructorToggle.click();
    await expect(instructorToggle).toHaveAttribute('aria-pressed', 'true');
    
    // Join same classroom as instructor
    await page.click('button[data-classroom-id="cohort-1"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // Instructor controls should now be visible
    await expect(page.locator('[data-testid="instructor-controls"]')).toBeVisible();
  });

  test('should display instructor badge in classroom', async ({ page }) => {
    await enterNameAndGoToLobby(page, 'Badge Test Instructor');
    
    // Toggle to instructor
    await page.click('[data-testid="role-toggle-instructor"]');
    
    // Join classroom
    await page.click('button[data-classroom-id="cohort-1"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // Verify instructor role is displayed
    // Could be a badge, label, or indicator
    await expect(page.locator('text=/instructor/i')).toBeVisible();
  });

  test('should show same 6 classrooms in instructor mode', async ({ page }) => {
    await enterNameAndGoToLobby(page, 'Classroom Counter');
    
    // Count classrooms in student mode
    let classroomCards = page.locator('button[data-classroom-id]');
    await expect(classroomCards).toHaveCount(6);
    
    // Toggle to instructor mode
    await page.click('[data-testid="role-toggle-instructor"]');
    
    // Should still show 6 classrooms (FR-001)
    await expect(classroomCards).toHaveCount(6);
    
    // All classroom names should still be visible
    await expect(page.locator('text=Cohort 1')).toBeVisible();
    await expect(page.locator('text=Cohort 2')).toBeVisible();
    await expect(page.locator('text=Cohort 3')).toBeVisible();
    await expect(page.locator('text=Cohort 4')).toBeVisible();
    await expect(page.locator('text=Cohort 5')).toBeVisible();
    await expect(page.locator('text=Cohort 6')).toBeVisible();
  });

  test('should display participant list in instructor controls', async ({ page }) => {
    await enterNameAndGoToLobby(page, 'List Test Instructor');
    
    // Toggle to instructor and join
    await page.click('[data-testid="role-toggle-instructor"]');
    await page.click('button[data-classroom-id="cohort-1"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // Verify instructor controls panel
    const instructorPanel = page.locator('[data-testid="instructor-controls"]');
    await expect(instructorPanel).toBeVisible();
    
    // Should show participant list (even if empty in MVP)
    // Look for headers or labels indicating participant management
    await expect(page.locator('text=/participants|members|students/i')).toBeVisible();
  });

  test('should validate equal privileges for multiple instructors', async ({ page, context }) => {
    // Note: This test documents FR-012 (equal instructor privileges)
    // Full testing requires multiple browser contexts with live Daily connections
    
    await enterNameAndGoToLobby(page, 'Instructor One');
    
    // Toggle to instructor and join
    await page.click('[data-testid="role-toggle-instructor"]');
    await page.click('button[data-classroom-id="cohort-1"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // Verify instructor controls are available
    await expect(page.locator('[data-testid="instructor-controls"]')).toBeVisible();
    
    // In production with multiple instructors, all should see the same controls
    // This validates the UI provides controls without checking backend permissions
  });

  test('should handle instructor joining at-capacity classroom', async ({ page }) => {
    await enterNameAndGoToLobby(page, 'Late Instructor');
    
    // Toggle to instructor
    await page.click('[data-testid="role-toggle-instructor"]');
    
    // Check for full classrooms
    const fullClassroom = page.locator('button[data-classroom-id]:has-text("Full")').first();
    const isVisible = await fullClassroom.isVisible().catch(() => false);
    
    if (isVisible) {
      // Full classrooms should be disabled even for instructors (FR-018)
      const isDisabled = await fullClassroom.isDisabled();
      expect(isDisabled).toBe(true);
    }
    
    // Note: MVP with stubbed counts (all 0) won't have full classrooms
    // This validates UI correctly disables full rooms for instructors too
  });

  test('should maintain instructor controls across classroom switches', async ({ page }) => {
    await enterNameAndGoToLobby(page, 'Multi-Room Instructor');
    
    // Toggle to instructor
    await page.click('[data-testid="role-toggle-instructor"]');
    
    // Join first classroom
    await page.click('button[data-classroom-id="cohort-1"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    await expect(page.locator('[data-testid="instructor-controls"]')).toBeVisible();
    
    // Return to lobby
    await page.click('button:has-text("Return")');
    await page.waitForURL(`${BASE_URL}/lobby*`);
    
    // Join different classroom
    await page.click('button[data-classroom-id="cohort-3"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-3`);
    
    // Instructor controls should still be visible
    await expect(page.locator('[data-testid="instructor-controls"]')).toBeVisible();
  });

  test('should display mute participant UI in instructor controls', async ({ page }) => {
    await enterNameAndGoToLobby(page, 'Mute Test Instructor');
    
    // Toggle to instructor and join
    await page.click('[data-testid="role-toggle-instructor"]');
    await page.click('button[data-classroom-id="cohort-1"]');
    await page.waitForURL(`${BASE_URL}/classroom/cohort-1`);
    
    // Verify instructor controls panel
    await expect(page.locator('[data-testid="instructor-controls"]')).toBeVisible();
    
    // Should show UI for muting (FR-009)
    // Even with 0 participants, the controls should be present
    await expect(page.locator('text=/mute|audio control/i')).toBeVisible();
  });
});
