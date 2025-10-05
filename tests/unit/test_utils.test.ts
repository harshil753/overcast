/**
 * Unit Tests: Utility Functions
 * 
 * Tests utility functions from lib/utils.ts and type guards from lib/types.ts
 * WHY: Validates utility logic, catches edge case bugs, ensures type safety
 */

import { describe, it, expect } from '@jest/globals';
import {
  cn,
  validateUserName,
  validateClassroomId,
  formatParticipantCount,
  getClassroomDisplayName,
  generateUUID,
} from '@/lib/utils';
import {
  isValidClassroomId,
  isValidUserName,
  isInstructor,
  deriveClassroomState,
} from '@/lib/types';
import type { UserSession, ClassroomConfig, Participant } from '@/lib/types';

// ============================================================================
// CLASS NAME UTILITY (cn)
// ============================================================================

describe('cn() - Class Name Utility', () => {
  it('should combine multiple class names', () => {
    const result = cn('class1', 'class2', 'class3');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toContain('base');
    expect(result).toContain('active');
  });

  it('should filter out false/undefined/null values', () => {
    const result = cn('class1', false, null, undefined, 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).not.toContain('false');
    expect(result).not.toContain('null');
  });

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-4', 'px-8'); // Should use px-8 (last wins)
    expect(result).toContain('px-8');
    expect(result).not.toContain('px-4');
  });
});

// ============================================================================
// USER NAME VALIDATION
// ============================================================================

describe('validateUserName() - User Name Validation', () => {
  it('should validate correct names', () => {
    expect(validateUserName('John Doe').isValid).toBe(true);
    expect(validateUserName('A').isValid).toBe(true);
    expect(validateUserName('a'.repeat(50)).isValid).toBe(true);
  });

  it('should reject empty names', () => {
    const result = validateUserName('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject whitespace-only names', () => {
    const result = validateUserName('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject names longer than 50 characters', () => {
    const result = validateUserName('a'.repeat(51));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('50 characters');
  });

  it('should trim whitespace before validation', () => {
    expect(validateUserName('  John Doe  ').isValid).toBe(true);
  });
});

describe('isValidUserName() - Type Guard', () => {
  it('should return true for valid names', () => {
    expect(isValidUserName('John')).toBe(true);
    expect(isValidUserName('A')).toBe(true);
    expect(isValidUserName('a'.repeat(50))).toBe(true);
  });

  it('should return false for invalid names', () => {
    expect(isValidUserName('')).toBe(false);
    expect(isValidUserName('a'.repeat(51))).toBe(false);
  });

  it('should enforce FR-015 (1-50 character requirement)', () => {
    // WHY: FR-015 requires name between 1 and 50 characters
    expect(isValidUserName('a')).toBe(true);
    expect(isValidUserName('a'.repeat(50))).toBe(true);
    expect(isValidUserName('')).toBe(false);
    expect(isValidUserName('a'.repeat(51))).toBe(false);
  });
});

// ============================================================================
// CLASSROOM ID VALIDATION
// ============================================================================

describe('validateClassroomId() - Classroom ID Validation', () => {
  it('should validate correct classroom IDs (1-6)', () => {
    expect(validateClassroomId('1')).toBe(true);
    expect(validateClassroomId('2')).toBe(true);
    expect(validateClassroomId('3')).toBe(true);
    expect(validateClassroomId('4')).toBe(true);
    expect(validateClassroomId('5')).toBe(true);
    expect(validateClassroomId('6')).toBe(true);
  });

  it('should reject invalid classroom IDs', () => {
    expect(validateClassroomId('0')).toBe(false);
    expect(validateClassroomId('7')).toBe(false);
    expect(validateClassroomId('10')).toBe(false);
    expect(validateClassroomId('abc')).toBe(false);
    expect(validateClassroomId('')).toBe(false);
  });
});

describe('isValidClassroomId() - Type Guard', () => {
  it('should validate cohort-[1-6] pattern', () => {
    expect(isValidClassroomId('cohort-1')).toBe(true);
    expect(isValidClassroomId('cohort-2')).toBe(true);
    expect(isValidClassroomId('cohort-3')).toBe(true);
    expect(isValidClassroomId('cohort-4')).toBe(true);
    expect(isValidClassroomId('cohort-5')).toBe(true);
    expect(isValidClassroomId('cohort-6')).toBe(true);
  });

  it('should reject invalid cohort IDs', () => {
    expect(isValidClassroomId('cohort-0')).toBe(false);
    expect(isValidClassroomId('cohort-7')).toBe(false);
    expect(isValidClassroomId('cohort-10')).toBe(false);
    expect(isValidClassroomId('classroom-1')).toBe(false);
    expect(isValidClassroomId('cohort1')).toBe(false);
    expect(isValidClassroomId('cohort-')).toBe(false);
    expect(isValidClassroomId('')).toBe(false);
  });
});

// ============================================================================
// PARTICIPANT COUNT FORMATTING
// ============================================================================

describe('formatParticipantCount() - Participant Count Formatting', () => {
  it('should format zero participants', () => {
    expect(formatParticipantCount(0)).toBe('No participants');
  });

  it('should format single participant (singular)', () => {
    expect(formatParticipantCount(1)).toBe('1 participant');
  });

  it('should format multiple participants (plural)', () => {
    expect(formatParticipantCount(2)).toBe('2 participants');
    expect(formatParticipantCount(5)).toBe('5 participants');
    expect(formatParticipantCount(10)).toBe('10 participants');
  });

  it('should handle maximum capacity (10 participants per FR-016)', () => {
    expect(formatParticipantCount(10)).toBe('10 participants');
  });
});

// ============================================================================
// CLASSROOM DISPLAY NAME
// ============================================================================

describe('getClassroomDisplayName() - Classroom Display Name', () => {
  it('should return correct names for valid IDs', () => {
    expect(getClassroomDisplayName('1')).toBe('Cohort 1');
    expect(getClassroomDisplayName('2')).toBe('Cohort 2');
    expect(getClassroomDisplayName('3')).toBe('Cohort 3');
    expect(getClassroomDisplayName('4')).toBe('Cohort 4');
    expect(getClassroomDisplayName('5')).toBe('Cohort 5');
    expect(getClassroomDisplayName('6')).toBe('Cohort 6');
  });

  it('should return fallback for invalid IDs', () => {
    expect(getClassroomDisplayName('0')).toBe('Classroom 0');
    expect(getClassroomDisplayName('7')).toBe('Classroom 7');
    expect(getClassroomDisplayName('abc')).toBe('Classroom abc');
  });
});

// ============================================================================
// UUID GENERATION
// ============================================================================

describe('generateUUID() - UUID Generation', () => {
  it('should generate valid UUID v4 format', () => {
    const uuid = generateUUID();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  it('should generate unique UUIDs', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });

  it('should generate UUIDs with correct length', () => {
    const uuid = generateUUID();
    expect(uuid.length).toBe(36); // 32 hex chars + 4 hyphens
  });
});

// ============================================================================
// INSTRUCTOR TYPE GUARD
// ============================================================================

describe('isInstructor() - Instructor Type Guard', () => {
  it('should return true for instructor sessions', () => {
    const instructorSession: UserSession = {
      name: 'Dr. Smith',
      role: 'instructor',
      sessionId: 'session-123',
      currentClassroom: 'cohort-1',
    };
    expect(isInstructor(instructorSession)).toBe(true);
  });

  it('should return false for student sessions', () => {
    const studentSession: UserSession = {
      name: 'John Doe',
      role: 'student',
      sessionId: 'session-456',
      currentClassroom: 'cohort-1',
    };
    expect(isInstructor(studentSession)).toBe(false);
  });
});

// ============================================================================
// DERIVE CLASSROOM STATE
// ============================================================================

describe('deriveClassroomState() - Derive Classroom State', () => {
  const mockConfig: ClassroomConfig = {
    id: 'cohort-1',
    name: 'Cohort 1',
    dailyUrl: 'https://example.daily.co/cohort-1',
    maxParticipants: 10,
  };

  it('should derive state from empty participant list', () => {
    const participants: Participant[] = [];
    const state = deriveClassroomState(mockConfig, participants);
    
    expect(state.id).toBe('cohort-1');
    expect(state.name).toBe('Cohort 1');
    expect(state.participantCount).toBe(0);
    expect(state.isAtCapacity).toBe(false);
    expect(state.isActive).toBe(false);
  });

  it('should derive state from participant list', () => {
    const participants: Participant[] = [
      { session_id: '1', user_name: 'User 1', local: false, owner: false },
      { session_id: '2', user_name: 'User 2', local: false, owner: false },
      { session_id: '3', user_name: 'User 3', local: true, owner: false },
    ];
    const state = deriveClassroomState(mockConfig, participants);
    
    expect(state.participantCount).toBe(3);
    expect(state.isAtCapacity).toBe(false);
    expect(state.isActive).toBe(true);
  });

  it('should detect capacity when at maximum (10 participants)', () => {
    const participants: Participant[] = Array.from({ length: 10 }, (_, i) => ({
      session_id: `session-${i}`,
      user_name: `User ${i}`,
      local: i === 0,
      owner: false,
    }));
    const state = deriveClassroomState(mockConfig, participants);
    
    expect(state.participantCount).toBe(10);
    expect(state.isAtCapacity).toBe(true);
    expect(state.isActive).toBe(true);
  });

  it('should validate FR-016 (10 participant maximum)', () => {
    // WHY: FR-016 requires enforcing 10 participant capacity
    const participants: Participant[] = Array.from({ length: 10 }, (_, i) => ({
      session_id: `session-${i}`,
      user_name: `User ${i}`,
      local: false,
      owner: false,
    }));
    const state = deriveClassroomState(mockConfig, participants);
    
    expect(state.isAtCapacity).toBe(true);
  });

  it('should mark classroom as active with 1 participant', () => {
    const participants: Participant[] = [
      { session_id: 'session-1', user_name: 'User 1', local: true, owner: false },
    ];
    const state = deriveClassroomState(mockConfig, participants);
    
    expect(state.isActive).toBe(true);
    expect(state.participantCount).toBe(1);
  });
});

// ============================================================================
// EDGE CASES AND ERROR CONDITIONS
// ============================================================================

describe('Edge Cases and Error Conditions', () => {
  describe('validateUserName - Edge Cases', () => {
    it('should handle special characters', () => {
      expect(validateUserName('José García').isValid).toBe(true);
      expect(validateUserName('李明').isValid).toBe(true);
      expect(validateUserName('Müller').isValid).toBe(true);
    });

    it('should handle emoji in names', () => {
      expect(validateUserName('John 😊').isValid).toBe(true);
    });

    it('should handle boundary cases', () => {
      expect(validateUserName('a').isValid).toBe(true);
      expect(validateUserName('a'.repeat(50)).isValid).toBe(true);
      expect(validateUserName('a'.repeat(51)).isValid).toBe(false);
    });
  });

  describe('formatParticipantCount - Edge Cases', () => {
    it('should handle negative numbers gracefully', () => {
      // Should handle edge case even though it shouldn't occur in practice
      const result = formatParticipantCount(-1);
      expect(result).toBeTruthy(); // Should not crash
    });

    it('should handle very large numbers', () => {
      const result = formatParticipantCount(1000);
      expect(result).toBe('1000 participants');
    });
  });

  describe('deriveClassroomState - Edge Cases', () => {
    it('should handle invalid participant data gracefully', () => {
      const mockConfig: ClassroomConfig = {
        id: 'cohort-1',
        name: 'Cohort 1',
        dailyUrl: 'https://example.daily.co/cohort-1',
        maxParticipants: 10,
      };
      
      // Empty participants array should not crash
      const state = deriveClassroomState(mockConfig, []);
      expect(state).toBeDefined();
      expect(state.participantCount).toBe(0);
    });
  });
});
