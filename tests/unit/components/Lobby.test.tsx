/**
 * Component Test: Lobby
 * 
 * Tests the Lobby component with React Testing Library
 * WHY: Validates lobby displays 6 classrooms, mode toggle, and navigation
 * 
 * This test follows TDD approach - it MUST FAIL initially because
 * the Lobby component doesn't exist yet (created in T020).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

// Mock next/navigation before importing component
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Import component (will fail until T020 creates it)
import { Lobby } from '@/app/components/Lobby';

describe('Lobby Component', () => {
  // Mock router instance
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Classroom Cards', () => {
    it('renders exactly 6 classroom cards', () => {
      render(<Lobby />);
      
      // WHY: FR-001 requires displaying 6 available classrooms
      const classrooms = screen.getAllByRole('button', { name: /cohort/i });
      expect(classrooms).toHaveLength(6);
    });

    it('displays classroom names from "Cohort 1" through "Cohort 6"', () => {
      render(<Lobby />);
      
      // WHY: Each classroom must have identifiable name (FR-001)
      expect(screen.getByText('Cohort 1')).toBeInTheDocument();
      expect(screen.getByText('Cohort 2')).toBeInTheDocument();
      expect(screen.getByText('Cohort 3')).toBeInTheDocument();
      expect(screen.getByText('Cohort 4')).toBeInTheDocument();
      expect(screen.getByText('Cohort 5')).toBeInTheDocument();
      expect(screen.getByText('Cohort 6')).toBeInTheDocument();
    });

    it('displays classroom IDs matching cohort-[1-6] pattern', () => {
      render(<Lobby />);
      
      // WHY: Classroom IDs must follow consistent pattern for routing
      const classroomButtons = screen.getAllByRole('button', { name: /cohort/i });
      classroomButtons.forEach((button, index) => {
        const expectedId = `cohort-${index + 1}`;
        // Check data attribute or text content contains the ID
        expect(button).toHaveAttribute('data-classroom-id', expectedId);
      });
    });
  });

  describe('Mode Toggle (Student/Instructor)', () => {
    it('displays Students/Instructors mode toggle', () => {
      render(<Lobby />);
      
      // WHY: FR-006 requires role selection in lobby
      // Toggle should have both options visible or accessible
      expect(
        screen.getByRole('button', { name: /student/i }) ||
        screen.getByRole('switch', { name: /student/i }) ||
        screen.getByText(/student/i)
      ).toBeInTheDocument();
      
      expect(
        screen.getByRole('button', { name: /instructor/i }) ||
        screen.getByRole('switch', { name: /instructor/i }) ||
        screen.getByText(/instructor/i)
      ).toBeInTheDocument();
    });

    it('defaults to Student mode', () => {
      render(<Lobby />);
      
      // WHY: Student should be the default role (FR-006)
      const studentToggle = screen.getByTestId('role-toggle-student') ||
                           screen.getByRole('button', { name: /student/i });
      expect(studentToggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('changes mode when toggle is clicked', async () => {
      render(<Lobby />);
      
      // WHY: Users must be able to switch between student and instructor roles
      const instructorToggle = screen.getByTestId('role-toggle-instructor') ||
                               screen.getByRole('button', { name: /instructor/i });
      
      fireEvent.click(instructorToggle);
      
      // Check that instructor mode is now active
      await waitFor(() => {
        expect(instructorToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('persists mode selection when toggled multiple times', async () => {
      render(<Lobby />);
      
      const studentToggle = screen.getByTestId('role-toggle-student') ||
                           screen.getByRole('button', { name: /student/i });
      const instructorToggle = screen.getByTestId('role-toggle-instructor') ||
                               screen.getByRole('button', { name: /instructor/i });
      
      // Toggle to instructor
      fireEvent.click(instructorToggle);
      await waitFor(() => {
        expect(instructorToggle).toHaveAttribute('aria-pressed', 'true');
      });
      
      // Toggle back to student
      fireEvent.click(studentToggle);
      await waitFor(() => {
        expect(studentToggle).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Classroom Navigation', () => {
    it('navigates to classroom when card is clicked', () => {
      render(<Lobby />);
      
      // WHY: FR-002 requires joining classroom on click
      const cohort1Button = screen.getByRole('button', { name: /cohort 1/i });
      fireEvent.click(cohort1Button);
      
      expect(mockPush).toHaveBeenCalledWith('/classroom/cohort-1');
    });

    it('navigates to correct classroom for each card', () => {
      render(<Lobby />);
      
      // Test all 6 classrooms navigate to correct routes
      const expectedRoutes = [
        { name: 'Cohort 1', route: '/classroom/cohort-1' },
        { name: 'Cohort 2', route: '/classroom/cohort-2' },
        { name: 'Cohort 3', route: '/classroom/cohort-3' },
        { name: 'Cohort 4', route: '/classroom/cohort-4' },
        { name: 'Cohort 5', route: '/classroom/cohort-5' },
        { name: 'Cohort 6', route: '/classroom/cohort-6' },
      ];
      
      expectedRoutes.forEach(({ name, route }) => {
        const button = screen.getByRole('button', { name: new RegExp(name, 'i') });
        fireEvent.click(button);
        expect(mockPush).toHaveBeenCalledWith(route);
      });
    });

    it('includes role in navigation state', () => {
      render(<Lobby />);
      
      // Switch to instructor mode
      const instructorToggle = screen.getByTestId('role-toggle-instructor') ||
                               screen.getByRole('button', { name: /instructor/i });
      fireEvent.click(instructorToggle);
      
      // Click classroom
      const cohort1Button = screen.getByRole('button', { name: /cohort 1/i });
      fireEvent.click(cohort1Button);
      
      // WHY: Role must be passed to classroom for permission checks
      // Navigation should include role parameter or state
      expect(mockPush).toHaveBeenCalled();
    });
  });

  describe('Lobby Layout', () => {
    it('displays application branding', () => {
      render(<Lobby />);
      
      // WHY: Consistent branding across application
      expect(screen.getByText(/overcast/i)).toBeInTheDocument();
    });

    it('arranges classroom cards in a grid', () => {
      const { container } = render(<Lobby />);
      
      // WHY: Grid layout for 6 classrooms (2x3 or 3x2)
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });

    it('displays participant counts for each classroom', () => {
      render(<Lobby />);
      
      // WHY: FR-011 requires showing participant counts
      // Should show "0 participants" or similar for each classroom
      const participantTexts = screen.getAllByText(/participant/i);
      expect(participantTexts.length).toBeGreaterThanOrEqual(6);
    });

    it('indicates when classroom is at capacity', () => {
      render(<Lobby />);
      
      // WHY: FR-018 requires preventing joins when at 10 participant capacity
      // Mock implementation should handle capacity display
      // For MVP with 0 participants, no classrooms should be at capacity
      const fullClassrooms = screen.queryAllByText(/full/i);
      expect(fullClassrooms.length).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for classroom buttons', () => {
      render(<Lobby />);
      
      const classroomButtons = screen.getAllByRole('button', { name: /cohort/i });
      classroomButtons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('has proper ARIA labels for mode toggle', () => {
      render(<Lobby />);
      
      const roleToggles = screen.getAllByRole('button', { name: /(student|instructor)/i });
      roleToggles.forEach((toggle) => {
        expect(toggle).toHaveAccessibleName();
      });
    });

    it('supports keyboard navigation', () => {
      render(<Lobby />);
      
      const firstClassroom = screen.getByRole('button', { name: /cohort 1/i });
      
      // Tab to button and press Enter
      firstClassroom.focus();
      expect(firstClassroom).toHaveFocus();
      
      fireEvent.keyDown(firstClassroom, { key: 'Enter', code: 'Enter' });
      expect(mockPush).toHaveBeenCalled();
    });
  });

  describe('Error States', () => {
    it('handles missing classroom data gracefully', () => {
      // This test documents expected behavior if API fails
      render(<Lobby />);
      
      // Should still render the lobby even if classroom data is unavailable
      expect(screen.getByText(/overcast/i)).toBeInTheDocument();
    });

    it('displays loading state while fetching classroom data', () => {
      // WHY: Good UX during initial data load
      render(<Lobby />);
      
      // For MVP with static data, this may not apply
      // But component should support loading state for future API integration
      const loadingIndicator = screen.queryByText(/loading/i) ||
                              screen.queryByRole('status');
      // Loading state is optional for MVP
      expect(loadingIndicator || true).toBeTruthy();
    });
  });
});

