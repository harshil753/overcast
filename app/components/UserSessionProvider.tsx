'use client';

/**
 * UserSession Context Provider
 * 
 * Manages user session state across the application using React Context.
 * WHY: Avoids prop drilling by sharing user session data (name, role, etc.)
 * across all components that need it.
 * 
 * Session data includes:
 * - name: User's display name (required, 1-50 characters)
 * - role: 'student' or 'instructor'
 * - sessionId: Daily.co session ID (null when not in classroom)
 * - currentClassroom: Classroom ID (null when in lobby)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserSession, UserRole } from '@/lib/types';
import { STORAGE_KEYS, DEFAULT_USER_ROLE } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

interface UserSessionContextType {
  /** Current user session state */
  session: UserSession | null;
  
  /** Update the entire user session */
  setSession: (session: UserSession | null) => void;
  
  /** Update just the user's name */
  setName: (name: string) => void;
  
  /** Update just the user's role */
  setRole: (role: UserRole) => void;
  
  /** Update session ID when joining/leaving classroom */
  setSessionId: (sessionId: string | null) => void;
  
  /** Update current classroom ID */
  setCurrentClassroom: (classroomId: string | null) => void;
  
  /** Clear all session data */
  clearSession: () => void;
  
  /** Check if user has a valid session */
  hasSession: () => boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface UserSessionProviderProps {
  children: ReactNode;
  /** Initial session data (useful for SSR or testing) */
  initialSession?: UserSession | null;
}

export function UserSessionProvider({ 
  children, 
  initialSession = null 
}: UserSessionProviderProps) {
  const [session, setSessionState] = useState<UserSession | null>(initialSession);

  /**
   * Load session from localStorage on mount
   * WHY: Persist user session across page refreshes
   */
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    try {
      const storedSession = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (storedSession) {
        const parsed = JSON.parse(storedSession) as UserSession;
        setSessionState(parsed);
      }
    } catch (error) {
      console.error('[UserSession] Failed to load session from localStorage:', error);
      // Clear invalid data
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    }
  }, []);

  /**
   * Save session to localStorage whenever it changes
   * WHY: Persist session across page refreshes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (session) {
        localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      }
    } catch (error) {
      console.error('[UserSession] Failed to save session to localStorage:', error);
    }
  }, [session]);

  // ============================================================================
  // CONTEXT VALUE METHODS
  // ============================================================================

  const setSession = (newSession: UserSession | null) => {
    setSessionState(newSession);
  };

  const setName = (name: string) => {
    setSessionState(prev => prev ? { ...prev, name } : null);
  };

  const setRole = (role: UserRole) => {
    setSessionState(prev => prev ? { ...prev, role } : null);
  };

  const setSessionId = (sessionId: string | null) => {
    setSessionState(prev => prev ? { ...prev, sessionId } : null);
  };

  const setCurrentClassroom = (currentClassroom: string | null) => {
    setSessionState(prev => prev ? { ...prev, currentClassroom } : null);
  };

  const clearSession = () => {
    setSessionState(null);
  };

  const hasSession = (): boolean => {
    return session !== null && session.name.trim().length > 0;
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: UserSessionContextType = {
    session,
    setSession,
    setName,
    setRole,
    setSessionId,
    setCurrentClassroom,
    clearSession,
    hasSession,
  };

  return (
    <UserSessionContext.Provider value={contextValue}>
      {children}
    </UserSessionContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access UserSession context
 * 
 * WHY: Provides type-safe access to user session data and methods.
 * Throws error if used outside provider to catch bugs early.
 * 
 * @throws Error if used outside UserSessionProvider
 */
export function useUserSession(): UserSessionContextType {
  const context = useContext(UserSessionContext);
  
  if (context === undefined) {
    throw new Error('useUserSession must be used within UserSessionProvider');
  }
  
  return context;
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get just the current user's name
 * WHY: Convenience hook for components that only need the name
 */
export function useUserName(): string | null {
  const { session } = useUserSession();
  return session?.name ?? null;
}

/**
 * Hook to get just the current user's role
 * WHY: Convenience hook for role-based UI rendering
 */
export function useUserRole(): UserRole {
  const { session } = useUserSession();
  return session?.role ?? DEFAULT_USER_ROLE;
}

/**
 * Hook to check if user is an instructor
 * WHY: Common check for showing instructor-only controls
 */
export function useIsInstructor(): boolean {
  const role = useUserRole();
  return role === 'instructor';
}

/**
 * Hook to get current classroom ID
 * WHY: Useful for components that need to know which classroom user is in
 */
export function useCurrentClassroom(): string | null {
  const { session } = useUserSession();
  return session?.currentClassroom ?? null;
}

