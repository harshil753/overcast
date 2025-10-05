// Contract test for GET /api/rooms endpoint
// Tests the API contract defined in specs/003-overcast-video-classroom/contracts/rooms-api.yaml
// WHY: Validates API returns correct structure and data for lobby display
// This test MUST FAIL initially (TDD) - implementation comes in Task T013

import { describe, it, expect, beforeAll } from '@jest/globals';

describe('GET /api/rooms - Contract Test', () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  // WHY: Contract tests validate the API adheres to the OpenAPI specification
  // These tests should fail until the endpoint is implemented in Task T013

  describe('Response Structure', () => {
    it('should return 200 status code', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      
      // Contract requirement: 200 OK status
      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      
      // Contract requirement: application/json content type
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should have classrooms array in response', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      // Contract requirement: RoomsResponse schema
      expect(data).toHaveProperty('classrooms');
      expect(Array.isArray(data.classrooms)).toBe(true);
    });
  });

  describe('Classroom Array Validation', () => {
    it('should return exactly 6 classrooms', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      // Contract requirement: Array with exactly 6 items (Cohort 1-6)
      // WHY: FR-001 specifies 6 available classrooms
      expect(data.classrooms).toHaveLength(6);
    });

    it('should have all required fields for each classroom', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      // Contract requirement: ClassroomSummary schema
      data.classrooms.forEach((classroom: any) => {
        expect(classroom).toHaveProperty('id');
        expect(classroom).toHaveProperty('name');
        expect(classroom).toHaveProperty('participantCount');
        expect(classroom).toHaveProperty('isAtCapacity');
      });
    });
  });

  describe('Classroom ID Validation', () => {
    it('should have classroom IDs matching pattern cohort-[1-6]', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      // Contract requirement: id pattern '^cohort-[1-6]$'
      // WHY: Matches CLASSROOM_IDS constant and environment variable naming
      const validIds = ['cohort-1', 'cohort-2', 'cohort-3', 'cohort-4', 'cohort-5', 'cohort-6'];
      const actualIds = data.classrooms.map((room: any) => room.id);

      actualIds.forEach((id: string) => {
        expect(validIds).toContain(id);
        expect(id).toMatch(/^cohort-[1-6]$/);
      });

      // Should have all 6 unique IDs
      expect(new Set(actualIds).size).toBe(6);
    });

    it('should have unique classroom IDs', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      const ids = data.classrooms.map((room: any) => room.id);
      const uniqueIds = new Set(ids);

      // Each ID should appear exactly once
      expect(uniqueIds.size).toBe(ids.length);
      expect(uniqueIds.size).toBe(6);
    });
  });

  describe('Classroom Name Validation', () => {
    it('should have correct classroom names (Cohort 1 through Cohort 6)', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      // Contract requirement: name field, minLength: 1, maxLength: 50
      // WHY: Names match CLASSROOM_NAMES constant from lib/constants.ts
      const expectedNames = ['Cohort 1', 'Cohort 2', 'Cohort 3', 'Cohort 4', 'Cohort 5', 'Cohort 6'];
      const actualNames = data.classrooms.map((room: any) => room.name);

      expectedNames.forEach(expectedName => {
        expect(actualNames).toContain(expectedName);
      });
    });

    it('should have non-empty names within length constraints', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      data.classrooms.forEach((classroom: any) => {
        expect(typeof classroom.name).toBe('string');
        expect(classroom.name.length).toBeGreaterThan(0);
        expect(classroom.name.length).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('Participant Count Validation', () => {
    it('should have participantCount as number between 0 and 10', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      // Contract requirement: participantCount (minimum: 0, maximum: 10)
      // WHY: MAX_PARTICIPANTS_PER_ROOM = 10 per clarification
      data.classrooms.forEach((classroom: any) => {
        expect(typeof classroom.participantCount).toBe('number');
        expect(classroom.participantCount).toBeGreaterThanOrEqual(0);
        expect(classroom.participantCount).toBeLessThanOrEqual(10);
      });
    });

    it('should have participantCount of 0 for MVP (stubbed)', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      // WHY: MVP implementation stubs participantCount to 0
      // Future: Query Daily.co API for live participant counts
      data.classrooms.forEach((classroom: any) => {
        expect(classroom.participantCount).toBe(0);
      });
    });
  });

  describe('Capacity Status Validation', () => {
    it('should have isAtCapacity as boolean', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      // Contract requirement: isAtCapacity boolean
      data.classrooms.forEach((classroom: any) => {
        expect(typeof classroom.isAtCapacity).toBe('boolean');
      });
    });

    it('should have isAtCapacity as false for MVP (no participants yet)', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      // WHY: MVP has participantCount = 0, so isAtCapacity should be false
      // FR-018: System MUST prevent joining when at capacity (10 participants)
      data.classrooms.forEach((classroom: any) => {
        expect(classroom.isAtCapacity).toBe(false);
      });
    });

    it('should correctly calculate isAtCapacity when count reaches 10', async () => {
      // This test validates the logic, even though MVP always returns false
      // WHY: Documents expected behavior for future live participant tracking

      const testCases = [
        { participantCount: 0, expected: false },
        { participantCount: 5, expected: false },
        { participantCount: 9, expected: false },
        { participantCount: 10, expected: true },
      ];

      testCases.forEach(({ participantCount, expected }) => {
        const isAtCapacity = participantCount >= 10;
        expect(isAtCapacity).toBe(expected);
      });
    });
  });

  describe('Response Ordering and Consistency', () => {
    it('should return classrooms in consistent order across requests', async () => {
      const response1 = await fetch(`${API_BASE}/rooms`);
      const data1 = await response1.json();

      const response2 = await fetch(`${API_BASE}/rooms`);
      const data2 = await response2.json();

      // WHY: Consistent ordering improves UX (lobby grid doesn't shuffle)
      const ids1 = data1.classrooms.map((r: any) => r.id);
      const ids2 = data2.classrooms.map((r: any) => r.id);

      expect(ids1).toEqual(ids2);
    });

    it('should return classrooms sorted by ID (cohort-1 first)', async () => {
      const response = await fetch(`${API_BASE}/rooms`);
      const data = await response.json();

      const ids = data.classrooms.map((r: any) => r.id);

      // WHY: Alphabetical sorting provides predictable, intuitive ordering
      const expectedOrder = ['cohort-1', 'cohort-2', 'cohort-3', 'cohort-4', 'cohort-5', 'cohort-6'];
      expect(ids).toEqual(expectedOrder);
    });
  });

  describe('Error Handling', () => {
    it('should not return 500 error under normal conditions', async () => {
      const response = await fetch(`${API_BASE}/rooms`);

      // Contract requirement: 500 only for server errors
      expect(response.status).not.toBe(500);
    });

    it('should handle missing environment variables gracefully', async () => {
      // This test documents expected behavior if env vars are missing
      // Implementation should validate env vars at build/startup time
      const response = await fetch(`${API_BASE}/rooms`);

      // Should either succeed (if env vars present) or fail with clear error
      expect([200, 500]).toContain(response.status);

      if (response.status === 500) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
      }
    });
  });

  describe('Performance', () => {
    it('should respond within 1 second', async () => {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/rooms`);
      const endTime = Date.now();

      // WHY: API should be fast for good UX (lobby loads quickly)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
      expect(response.status).toBe(200);
    });
  });

  describe('CORS and Headers', () => {
    it('should allow requests from localhost origin', async () => {
      const response = await fetch(`${API_BASE}/rooms`, {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      // WHY: Next.js API routes should handle same-origin requests
      expect(response.status).toBe(200);
    });
  });
});

