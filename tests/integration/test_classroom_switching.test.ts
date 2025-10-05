import { test, expect } from '@playwright/test';

/**
 * Integration Test: Classroom Switching
 * 
 * Tests the ability to switch between different classrooms while maintaining
 * user session state and role persistence. Validates navigation and user
 * experience continuity across classroom changes.
 * 
 * Based on Quickstart Workflow 3: Classroom Switching (Navigation Path)
 * Validates: FR-007 (return to lobby), FR-013 (role persistence)
 */

test.describe('Classroom Switching Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('http://localhost:3000');
  });

  test('should allow user to switch between different classrooms', async ({ page }) => {
    // Step 1: Join Cohort 1 as student
    await page.click('text=Cohort 1');
    
    // Verify name entry modal appears
    await expect(page.locator('[data-testid="name-entry-modal"]')).toBeVisible();
    
    // Enter name and join as student
    await page.fill('[data-testid="name-input"]', 'Switching Test User');
    await page.click('[data-testid="join-as-student"]');
    
    // Verify redirected to Cohort 1 classroom
    await expect(page).toHaveURL(/\/classroom\/1/);
    
    // Verify classroom name is displayed correctly
    await expect(page.locator('[data-testid="classroom-name"]')).toContainText('Cohort 1');
    
    // Verify user name is displayed
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Switching Test User');
    
    // Verify role is student (no instructor controls)
    await expect(page.locator('[data-testid="instructor-controls"]')).not.toBeVisible();
    
    // Step 2: Return to lobby
    await page.click('[data-testid="return-to-lobby"]');
    
    // Verify back to main lobby
    await expect(page).toHaveURL('http://localhost:3000');
    
    // Verify 6 classrooms are still visible
    const classrooms = page.locator('[data-testid="classroom-option"]');
    await expect(classrooms).toHaveCount(6);
    
    // Step 3: Join Cohort 2
    await page.click('text=Cohort 2');
    
    // Name should be pre-filled from previous session
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue('Switching Test User');
    
    // Role should still be student (default)
    await expect(page.locator('[data-testid="role-indicator"]')).toContainText('student');
    
    await page.click('[data-testid="join-as-student"]');
    
    // Verify redirected to Cohort 2 classroom
    await expect(page).toHaveURL(/\/classroom\/2/);
    
    // Verify different classroom name is displayed
    await expect(page.locator('[data-testid="classroom-name"]')).toContainText('Cohort 2');
    
    // Verify user name persists
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Switching Test User');
    
    // Verify still in student mode
    await expect(page.locator('[data-testid="instructor-controls"]')).not.toBeVisible();
  });

  test('should maintain instructor role across classroom switches', async ({ page }) => {
    // Step 1: Switch to instructor mode
    await page.click('[data-testid="instructors-toggle"]');
    
    // Verify instructor mode is active
    await expect(page.locator('[data-testid="instructor-mode-indicator"]')).toBeVisible();
    
    // Step 2: Join Cohort 1 as instructor
    await page.click('text=Cohort 1');
    
    await page.fill('[data-testid="name-input"]', 'Instructor Switching Test');
    await page.click('[data-testid="join-as-instructor"]');
    
    // Verify in Cohort 1 with instructor controls
    await expect(page).toHaveURL(/\/classroom\/1/);
    await expect(page.locator('[data-testid="classroom-name"]')).toContainText('Cohort 1');
    await expect(page.locator('[data-testid="instructor-controls"]')).toBeVisible();
    
    // Step 3: Return to lobby
    await page.click('[data-testid="return-to-lobby"]');
    
    // Verify back to lobby
    await expect(page).toHaveURL('http://localhost:3000');
    
    // Step 4: Join Cohort 3 - should maintain instructor role
    await page.click('text=Cohort 3');
    
    // Name should be pre-filled
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue('Instructor Switching Test');
    
    // Role should still be instructor
    await expect(page.locator('[data-testid="role-indicator"]')).toContainText('instructor');
    
    await page.click('[data-testid="join-as-instructor"]');
    
    // Verify in Cohort 3 with instructor controls
    await expect(page).toHaveURL(/\/classroom\/3/);
    await expect(page.locator('[data-testid="classroom-name"]')).toContainText('Cohort 3');
    await expect(page.locator('[data-testid="instructor-controls"]')).toBeVisible();
    
    // Verify instructor controls are functional
    await expect(page.locator('[data-testid="mute-all-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-breakout-button"]')).toBeVisible();
  });

  test('should handle role switching between classroom visits', async ({ page }) => {
    // Step 1: Join Cohort 1 as student
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Role Switch Test');
    await page.click('[data-testid="join-as-student"]');
    
    await expect(page).toHaveURL(/\/classroom\/1/);
    await expect(page.locator('[data-testid="instructor-controls"]')).not.toBeVisible();
    
    // Step 2: Return to lobby
    await page.click('[data-testid="return-to-lobby"]');
    
    // Step 3: Switch to instructor mode
    await page.click('[data-testid="instructors-toggle"]');
    await expect(page.locator('[data-testid="instructor-mode-indicator"]')).toBeVisible();
    
    // Step 4: Join Cohort 2 as instructor
    await page.click('text=Cohort 2');
    
    // Name should be pre-filled
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue('Role Switch Test');
    
    // Role should now be instructor
    await expect(page.locator('[data-testid="role-indicator"]')).toContainText('instructor');
    
    await page.click('[data-testid="join-as-instructor"]');
    
    // Verify in Cohort 2 with instructor controls
    await expect(page).toHaveURL(/\/classroom\/2/);
    await expect(page.locator('[data-testid="classroom-name"]')).toContainText('Cohort 2');
    await expect(page.locator('[data-testid="instructor-controls"]')).toBeVisible();
  });

  test('should maintain session state across multiple classroom switches', async ({ page }) => {
    const testName = 'Session Persistence Test';
    
    // Step 1: Join Cohort 1
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', testName);
    await page.click('[data-testid="join-as-student"]');
    
    await expect(page).toHaveURL(/\/classroom\/1/);
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testName);
    
    // Step 2: Switch to Cohort 2
    await page.click('[data-testid="return-to-lobby"]');
    await page.click('text=Cohort 2');
    
    // Name should persist
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue(testName);
    await page.click('[data-testid="join-as-student"]');
    
    await expect(page).toHaveURL(/\/classroom\/2/);
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testName);
    
    // Step 3: Switch to Cohort 3
    await page.click('[data-testid="return-to-lobby"]');
    await page.click('text=Cohort 3');
    
    // Name should still persist
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue(testName);
    await page.click('[data-testid="join-as-student"]');
    
    await expect(page).toHaveURL(/\/classroom\/3/);
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testName);
    
    // Step 4: Switch to Cohort 4
    await page.click('[data-testid="return-to-lobby"]');
    await page.click('text=Cohort 4');
    
    // Name should still persist
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue(testName);
    await page.click('[data-testid="join-as-student"]');
    
    await expect(page).toHaveURL(/\/classroom\/4/);
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testName);
  });

  test('should handle rapid classroom switching without errors', async ({ page }) => {
    // Test rapid switching between classrooms
    const classrooms = ['Cohort 1', 'Cohort 2', 'Cohort 3', 'Cohort 4'];
    
    for (let i = 0; i < classrooms.length; i++) {
      const classroom = classrooms[i];
      
      // Join classroom
      await page.click(`text=${classroom}`);
      await page.fill('[data-testid="name-input"]', 'Rapid Switch Test');
      await page.click('[data-testid="join-as-student"]');
      
      // Verify in correct classroom
      await expect(page).toHaveURL(new RegExp(`/classroom/${i + 1}`));
      await expect(page.locator('[data-testid="classroom-name"]')).toContainText(classroom);
      
      // Return to lobby (except for last iteration)
      if (i < classrooms.length - 1) {
        await page.click('[data-testid="return-to-lobby"]');
        await expect(page).toHaveURL('http://localhost:3000');
      }
    }
  });

  test('should handle classroom switching with different user roles', async ({ page, context }) => {
    // Create multiple browser contexts to simulate different users
    const studentContext = await context.browser()?.newContext();
    const instructorContext = await context.browser()?.newContext();
    
    const studentPage = await studentContext?.newPage();
    const instructorPage = await instructorContext?.newPage();
    
    if (studentPage && instructorPage) {
      // Student joins Cohort 1
      await studentPage.goto('http://localhost:3000');
      await studentPage.click('text=Cohort 1');
      await studentPage.fill('[data-testid="name-input"]', 'Student User');
      await studentPage.click('[data-testid="join-as-student"]');
      
      // Instructor joins Cohort 1
      await instructorPage.goto('http://localhost:3000');
      await instructorPage.click('[data-testid="instructors-toggle"]');
      await instructorPage.click('text=Cohort 1');
      await instructorPage.fill('[data-testid="name-input"]', 'Instructor User');
      await instructorPage.click('[data-testid="join-as-instructor"]');
      
      // Both should be in Cohort 1
      await expect(studentPage).toHaveURL(/\/classroom\/1/);
      await expect(instructorPage).toHaveURL(/\/classroom\/1/);
      
      // Student switches to Cohort 2
      await studentPage.click('[data-testid="return-to-lobby"]');
      await studentPage.click('text=Cohort 2');
      await studentPage.click('[data-testid="join-as-student"]');
      
      // Instructor switches to Cohort 3
      await instructorPage.click('[data-testid="return-to-lobby"]');
      await instructorPage.click('text=Cohort 3');
      await instructorPage.click('[data-testid="join-as-instructor"]');
      
      // Verify both are in different classrooms
      await expect(studentPage).toHaveURL(/\/classroom\/2/);
      await expect(instructorPage).toHaveURL(/\/classroom\/3/);
      
      // Clean up contexts
      await studentContext?.close();
      await instructorContext?.close();
    }
  });

  test('should handle classroom switching with network interruptions', async ({ page }) => {
    // Join first classroom
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Network Test User');
    await page.click('[data-testid="join-as-student"]');
    
    await expect(page).toHaveURL(/\/classroom\/1/);
    
    // Simulate network interruption
    await page.context().setOffline(true);
    
    // Try to return to lobby (should handle gracefully)
    await page.click('[data-testid="return-to-lobby"]');
    
    // Re-enable network
    await page.context().setOffline(false);
    
    // Should be back on lobby page
    await expect(page).toHaveURL('http://localhost:3000');
    
    // Should be able to join different classroom
    await page.click('text=Cohort 2');
    await expect(page.locator('[data-testid="name-input"]')).toHaveValue('Network Test User');
    await page.click('[data-testid="join-as-student"]');
    
    await expect(page).toHaveURL(/\/classroom\/2/);
  });

  test('should validate classroom names are displayed correctly after switching', async ({ page }) => {
    const expectedClassrooms = [
      { id: 1, name: 'Cohort 1' },
      { id: 2, name: 'Cohort 2' },
      { id: 3, name: 'Cohort 3' },
      { id: 4, name: 'Cohort 4' },
      { id: 5, name: 'Cohort 5' },
      { id: 6, name: 'Cohort 6' }
    ];
    
    for (const classroom of expectedClassrooms) {
      // Join classroom
      await page.click(`text=${classroom.name}`);
      await page.fill('[data-testid="name-input"]', 'Name Validation Test');
      await page.click('[data-testid="join-as-student"]');
      
      // Verify correct classroom name is displayed
      await expect(page.locator('[data-testid="classroom-name"]')).toContainText(classroom.name);
      
      // Verify URL contains correct classroom ID
      await expect(page).toHaveURL(new RegExp(`/classroom/${classroom.id}`));
      
      // Return to lobby for next iteration
      await page.click('[data-testid="return-to-lobby"]');
      await expect(page).toHaveURL('http://localhost:3000');
    }
  });
});
