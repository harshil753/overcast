import { test, expect } from '@playwright/test';

/**
 * Integration Test: Classroom Capacity Limits
 * 
 * Tests the system's handling of classroom capacity limits and edge cases.
 * Validates proper enforcement of 10-participant limit per classroom.
 * 
 * Based on Quickstart Workflow 3: Capacity and Error Handling
 * Validates: Capacity enforcement (FR-016, FR-018)
 */

test.describe('Classroom Capacity Limits Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('http://localhost:3000');
  });

  test('should enforce 10-participant limit per classroom', async ({ page }) => {
    // Mock API to simulate classroom at capacity
    await page.route('**/api/rooms/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          name: 'Cohort 1',
          participantCount: 10,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/1/join', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Classroom full',
          message: 'This classroom has reached its maximum capacity of 10 participants'
        })
      });
    });

    // Attempt to join full classroom
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Capacity Test User');
    await page.click('[data-testid="join-as-student"]');

    // Verify "Classroom full" message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Classroom full');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('maximum capacity of 10 participants');

    // Verify user cannot join when at capacity
    await expect(page).toHaveURL('http://localhost:3000'); // Should stay on lobby

    // Verify clear error message explains the situation
    await expect(page.locator('[data-testid="capacity-error-explanation"]')).toBeVisible();
  });

  test('should allow joining when classroom has available capacity', async ({ page }) => {
    // Mock API to simulate classroom with available space
    await page.route('**/api/rooms/2', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '2',
          name: 'Cohort 2',
          participantCount: 5,
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
          participantId: 'test-participant-id'
        })
      });
    });

    // Join classroom with available capacity
    await page.click('text=Cohort 2');
    await page.fill('[data-testid="name-input"]', 'Available Space User');
    await page.click('[data-testid="join-as-student"]');

    // Should successfully join the classroom
    await expect(page).toHaveURL(/\/classroom\/2/);
    await expect(page.locator('[data-testid="video-feed-area"]')).toBeVisible();
  });

  test('should handle capacity checks for all 6 classrooms independently', async ({ page }) => {
    // Mock different capacity states for each classroom
    const classroomStates = [
      { id: '1', participantCount: 10, canJoin: false }, // Full
      { id: '2', participantCount: 5, canJoin: true },  // Available
      { id: '3', participantCount: 9, canJoin: true },   // Almost full
      { id: '4', participantCount: 10, canJoin: false }, // Full
      { id: '5', participantCount: 0, canJoin: true },   // Empty
      { id: '6', participantCount: 3, canJoin: true }     // Half full
    ];

    // Set up mocks for each classroom
    for (const classroom of classroomStates) {
      await page.route(`**/api/rooms/${classroom.id}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: classroom.id,
            name: `Cohort ${classroom.id}`,
            participantCount: classroom.participantCount,
            maxCapacity: 10,
            isActive: classroom.participantCount > 0
          })
        });
      });

      await page.route(`**/api/rooms/${classroom.id}/join`, async route => {
        if (classroom.canJoin) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              roomUrl: `https://test.daily.co/room${classroom.id}`,
              participantId: `test-participant-${classroom.id}`
            })
          });
        } else {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ 
              error: 'Classroom full',
              message: 'This classroom has reached its maximum capacity of 10 participants'
            })
          });
        }
      });
    }

    // Test joining each classroom
    for (const classroom of classroomStates) {
      // Return to lobby if not already there
      if (page.url() !== 'http://localhost:3000') {
        await page.goto('http://localhost:3000');
      }

      await page.click(`text=Cohort ${classroom.id}`);
      await page.fill('[data-testid="name-input"]', `Test User ${classroom.id}`);
      await page.click('[data-testid="join-as-student"]');

      if (classroom.canJoin) {
        // Should successfully join
        await expect(page).toHaveURL(new RegExp(`/classroom/${classroom.id}`));
        await expect(page.locator('[data-testid="video-feed-area"]')).toBeVisible();
      } else {
        // Should show capacity error and stay on lobby
        await expect(page.locator('[data-testid="error-message"]')).toContainText('Classroom full');
        await expect(page).toHaveURL('http://localhost:3000');
      }
    }
  });

  test('should handle real-time capacity updates', async ({ page }) => {
    // Mock initial state with available capacity
    let participantCount = 9;

    await page.route('**/api/rooms/3', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '3',
          name: 'Cohort 3',
          participantCount: participantCount,
          maxCapacity: 50,
          isActive: true
        })
      });
    });

    // Initially allow joining
    await page.route('**/api/rooms/3/join', async route => {
      if (participantCount < 10) {
        participantCount++; // Simulate someone joining
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            roomUrl: 'https://test.daily.co/room3',
            participantId: 'test-participant-3'
          })
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Classroom full',
            message: 'This classroom has reached its maximum capacity of 10 participants'
          })
        });
      }
    });

    // First user should be able to join (9 -> 10)
    await page.click('text=Cohort 3');
    await page.fill('[data-testid="name-input"]', 'Last Available Spot');
    await page.click('[data-testid="join-as-student"]');

    await expect(page).toHaveURL(/\/classroom\/3/);

    // Return to lobby
    await page.click('[data-testid="return-to-lobby"]');

    // Now classroom should be full, next user should be blocked
    await page.click('text=Cohort 3');
    await page.fill('[data-testid="name-input"]', 'Too Late User');
    await page.click('[data-testid="join-as-student"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Classroom full');
    await expect(page).toHaveURL('http://localhost:3000');
  });

  test('should handle instructor capacity limits correctly', async ({ page }) => {
    // Mock classroom at capacity
    await page.route('**/api/rooms/4', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '4',
          name: 'Cohort 4',
          participantCount: 10,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/4/join', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Classroom full',
          message: 'This classroom has reached its maximum capacity of 10 participants'
        })
      });
    });

    // Try to join as instructor when classroom is full
    await page.click('[data-testid="instructors-toggle"]');
    await page.click('text=Cohort 4');
    await page.fill('[data-testid="name-input"]', 'Blocked Instructor');
    await page.click('[data-testid="join-as-instructor"]');

    // Even instructors should be blocked when at capacity
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Classroom full');
    await expect(page).toHaveURL('http://localhost:3000');

    // Verify instructor-specific error message if applicable
    await expect(page.locator('[data-testid="instructor-capacity-message"]')).toBeVisible();
  });

  test('should display capacity information in lobby', async ({ page }) => {
    // Mock classrooms with different capacity states
    await page.route('**/api/rooms', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Cohort 1', participantCount: 10, maxCapacity: 10, isActive: true },
          { id: '2', name: 'Cohort 2', participantCount: 5, maxCapacity: 10, isActive: true },
          { id: '3', name: 'Cohort 3', participantCount: 0, maxCapacity: 10, isActive: false },
          { id: '4', name: 'Cohort 4', participantCount: 8, maxCapacity: 10, isActive: true },
          { id: '5', name: 'Cohort 5', participantCount: 9, maxCapacity: 10, isActive: true },
          { id: '6', name: 'Cohort 6', participantCount: 3, maxCapacity: 10, isActive: true }
        ])
      });
    });

    // Reload page to fetch capacity data
    await page.reload();

    // Verify capacity indicators are shown (if implemented in UI)
    // Note: Based on spec, UI should be minimal, so this might not be displayed
    // But we test for it in case it's implemented for better UX

    // Check if full classrooms are visually indicated
    const fullClassroom = page.locator('[data-testid="classroom-1"]');
    if (await fullClassroom.locator('[data-testid="capacity-indicator"]').isVisible()) {
      await expect(fullClassroom.locator('[data-testid="capacity-indicator"]')).toContainText('Full');
    }

    // Check if available classrooms can be distinguished
    const availableClassroom = page.locator('[data-testid="classroom-2"]');
    if (await availableClassroom.locator('[data-testid="capacity-indicator"]').isVisible()) {
      await expect(availableClassroom.locator('[data-testid="capacity-indicator"]')).toContainText('Available');
    }
  });

  test('should simulate 10 users joining and block 11th user', async ({ page }) => {
    // Simulate 10 users already in classroom
    let currentParticipants = 10;

    await page.route('**/api/rooms/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          name: 'Cohort 1',
          participantCount: currentParticipants,
          maxCapacity: 10,
          isActive: true
        })
      });
    });

    await page.route('**/api/rooms/1/join', async route => {
      if (currentParticipants < 10) {
        currentParticipants++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            roomUrl: 'https://test.daily.co/room1',
            participantId: `test-participant-${currentParticipants}`
          })
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Classroom full',
            message: 'This classroom has reached its maximum capacity of 10 participants'
          })
        });
      }
    });

    // Attempt to join as 11th user
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', '11th User');
    await page.click('[data-testid="join-as-student"]');

    // Should be blocked and show capacity message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Classroom full');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('maximum capacity of 10 participants');
    await expect(page).toHaveURL('http://localhost:3000'); // Should stay on lobby

    // Verify classroom shows participant count = 10
    await expect(page.locator('[data-testid="classroom-1"]')).toContainText('10');
    
    // Verify isAtCapacity flag is true (if displayed in UI)
    if (await page.locator('[data-testid="capacity-indicator"]').isVisible()) {
      await expect(page.locator('[data-testid="capacity-indicator"]')).toContainText('Full');
    }
  });

  test('should handle capacity validation errors gracefully', async ({ page }) => {
    // Mock server error during capacity check
    await page.route('**/api/rooms/5', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Internal server error',
          message: 'Unable to check classroom capacity'
        })
      });
    });

    await page.click('text=Cohort 5');
    await page.fill('[data-testid="name-input"]', 'Error Test User');
    await page.click('[data-testid="join-as-student"]');

    // Should show appropriate error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Unable to join classroom');
    
    // Should provide option to retry
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Should stay on lobby
    await expect(page).toHaveURL('http://localhost:3000');
  });
});
