# Research: Overcast Video Classroom Technical Decisions

**Feature**: 003-overcast-video-classroom  
**Date**: 2025-10-05  
**Phase**: 0 - Research & Technical Discovery

## Overview
This document consolidates technical research for building the Overcast video classroom application using Daily.co, Next.js, and Tailwind CSS with a futuristic aesthetic.

---

## 1. Daily.co Video Integration

### Decision
Use **@daily-co/daily-react** hooks library with **@daily-co/daily-js** core

### Rationale
- **React-Native Integration**: Hooks provide idiomatic React patterns (useDaily, useParticipants, useDailyEvent)
- **Automatic Cleanup**: Hooks handle component lifecycle and event listener cleanup
- **Type Safety**: Full TypeScript support with DailyCall and DailyParticipant types
- **State Management**: Built-in state synchronization via jotai (peer dependency)
- **Proven Pattern**: Official Daily.co recommendation for React applications

### Implementation Approach
```typescript
// WHY: DailyProvider wraps the entire classroom to share Daily instance
// across all components without prop drilling
import { DailyProvider, useDaily, useParticipants } from '@daily-co/daily-react';

// Classroom component initializes Daily connection
function Classroom({ roomUrl, userName, role }) {
  // WHY: useDaily creates call instance and handles join/leave lifecycle
  const callObject = useDaily({
    url: roomUrl,
    userName: userName,
    // Token would go here for auth (not needed for public rooms)
  });
  
  return (
    <DailyProvider callObject={callObject}>
      <VideoFeed />
      {role === 'instructor' && <InstructorControls />}
    </DailyProvider>
  );
}

// VideoFeed accesses participants from Daily context
function VideoFeed() {
  // WHY: useParticipants automatically updates when people join/leave
  const participants = useParticipants();
  
  return participants.map(p => (
    <VideoTile key={p.session_id} participant={p} />
  ));
}
```

### Key Hooks Reference
([Source: Daily React API](https://github.com/daily-co/daily-react/blob/main/README.md))

- **`useDaily()`**: Initialize Daily call object with room URL and user config
- **`useParticipants()`**: Get array of all participants, auto-updates on join/leave
- **`useParticipant(sessionId)`**: Get single participant data
- **`useDevices()`**: Access camera/mic/speaker devices with enable/disable methods
- **`useDailyEvent(event, callback)`**: Subscribe to Daily events (joined-meeting, participant-updated, etc.)
- **`useScreenShare()`**: Manage screen sharing state

### Alternatives Considered
1. **daily-js directly**: More control but requires manual state management and cleanup (increases complexity)
2. **Agora SDK**: Similar features but steeper learning curve, no React hooks library
3. **Twilio Video**: More expensive, overkill for simple classroom use case
4. **Native WebRTC**: Extremely complex, violates simplicity principle

### References
- [Daily React Documentation](https://docs.daily.co/reference/daily-react)
- [Daily JS Core API](https://docs.daily.co/reference/daily-js)
- [Code Snippets from context7.com](https://context7.com/daily-co/daily-react/llms.txt)

---

## 2. Next.js 15 App Router Architecture

### Decision
Use **Next.js 15 App Router** with hybrid Server/Client Components

### Rationale
- **Modern Pattern**: App Router is the recommended approach for new Next.js projects
- **Performance**: Server Components reduce client bundle size for static content
- **File-System Routing**: Pages map directly to URLs (app/classroom/[id]/page.tsx → /classroom/1)
- **API Routes as Functions**: Route handlers deploy as Vercel serverless functions automatically
- **Built-in Optimization**: Image optimization, font loading, code splitting out of the box

### Component Strategy
**Server Components** (default, no 'use client'):
- Layout wrappers (app/layout.tsx)
- Static content pages
- Data fetching for initial room config

**Client Components** (marked with 'use client'):
- Video feed (requires Daily.co hooks)
- Interactive controls (instructor panel, mode toggle)
- Form inputs (name entry)

### Directory Structure Explanation
```
app/
├── page.tsx                  # Landing page with name entry (Server Component)
├── lobby/
│   └── page.tsx              # Lobby with 6 classrooms (Client - needs interaction)
├── classroom/
│   └── [id]/
│       └── page.tsx          # Dynamic routes for Cohort 1-6 (Client - Daily video)
├── api/
│   └── rooms/
│       └── route.ts          # GET /api/rooms (Serverless function)
└── components/
    └── *.tsx                 # Reusable UI (Client Components)
```

**WHY this structure**:
- **Co-located routing**: Pages live next to their route definition
- **Dynamic routes**: [id] folder creates /classroom/cohort-1, /classroom/cohort-2, etc.
- **API separation**: /api folder maps to API endpoints, not UI pages
- **Component reuse**: Shared components in components/ used across pages

### Alternatives Considered
1. **Pages Router**: Legacy Next.js pattern, less performant, no Server Components
2. **Create React App**: No SSR, no file-system routing, manual build config
3. **Vite + React Router**: Simpler but lose Next.js optimizations and Vercel integration

### References
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## 3. State Management Strategy

### Decision
**Jotai** (required by daily-react) + **React Context** for user session

### Rationale
- **Jotai Required**: Peer dependency of @daily-co/daily-react for Daily state
- **Atomic Updates**: Jotai provides fine-grained reactivity for Daily participant updates
- **Simplicity**: React Context sufficient for user session (name, role) - no extra library needed
- **No Over-Engineering**: Redux/MobX would add complexity without benefit

### Implementation Pattern
```typescript
// WHY: User session is simple and doesn't need atomic updates
// Context API is built-in and newcomer-friendly
import { createContext, useContext, useState } from 'react';

interface UserSession {
  name: string;
  role: 'student' | 'instructor';
}

const UserSessionContext = createContext<UserSession | null>(null);

export function UserSessionProvider({ children }) {
  const [session, setSession] = useState<UserSession | null>(null);
  
  return (
    <UserSessionContext.Provider value={session}>
      {children}
    </UserSessionContext.Provider>
  );
}

// Daily state is managed automatically by daily-react hooks
// We don't need to manually manage participants, video tracks, etc.
```

### Alternatives Considered
1. **Redux**: Overkill for simple user session, adds boilerplate
2. **Zustand**: Cleaner than Redux but still unnecessary extra dependency
3. **URL State**: Could store role in query params but loses state on refresh

---

## 4. Tailwind v4 Futuristic Theme

### Decision
Custom CSS variables in **globals.css** with Tailwind v4 CSS-first config

### Rationale
- **v4 Pattern**: Tailwind v4 moved configuration to CSS custom properties
- **Theme Consistency**: CSS variables ensure consistent colors across components
- **Design System**: Matches provided aesthetic (black/teal/orange, high contrast)
- **Performance**: Tailwind's JIT compiler only includes used classes

### Color Palette Implementation
```css
/* globals.css - WHY: CSS variables make theme colors accessible to all components */
@import "tailwindcss";

:root {
  /* Primary Colors */
  --color-background: #000000;        /* Black - authority, futuristic */
  --color-primary: #00FFD1;           /* Neon Teal - innovation, energy */
  --color-accent: #FFBD17;            /* Orange - urgency, attention */
  
  /* Semantic Colors */
  --color-text-primary: #FFFFFF;      /* White - high contrast */
  --color-text-secondary: #B0B0B0;    /* Gray - secondary info */
  --color-border: #333333;            /* Dark gray - subtle divisions */
  
  /* Interactive States */
  --color-hover: #00D4B3;             /* Lighter teal - hover feedback */
  --color-active: #FFD147;            /* Lighter orange - active state */
}

/* Custom utility classes */
.glow-teal {
  box-shadow: 0 0 20px rgba(0, 255, 209, 0.5);
}

.glow-orange {
  box-shadow: 0 0 20px rgba(255, 189, 23, 0.5);
}
```

### Typography & Layout
- **Font Family**: System font stack with geometric sans-serif fallbacks
- **Headings**: Bold, uppercase, teal highlights
- **Body Text**: White/gray on black for maximum legibility
- **Spacing**: Generous negative space prevents cluttered feel
- **Cards**: Minimal borders with subtle glow effects on hover

### Component Styling Example
```tsx
// WHY: Tailwind utility classes keep styles co-located with components
// Descriptive class names make intent clear for newcomers
<button className="
  bg-primary text-background           /* Teal button, black text */
  font-bold uppercase tracking-wider   /* Bold, geometric feel */
  px-6 py-3 rounded-lg                 /* Padding and rounded corners */
  hover:bg-hover hover:glow-teal       /* Hover state with glow effect */
  transition-all duration-200          /* Smooth transitions */
">
  Join Cohort 1
</button>
```

### Alternatives Considered
1. **Styled Components**: Runtime CSS-in-JS adds bundle size, violates simplicity
2. **CSS Modules**: Requires separate files, fragments understanding
3. **Plain CSS**: No utility classes, more boilerplate for responsive design

### References
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- Visual aesthetic provided by user (black/teal/orange, futuristic, minimalist)

---

## 5. Configuration Management (No Database)

### Decision
**Environment Variables** for Daily.co room URLs via `.env.local`

### Rationale
- **12-Factor App**: Config via environment is industry best practice
- **No Database Needed**: Only 6 static classroom configurations
- **Security**: URLs not committed to git, easily rotated
- **Vercel Compatible**: Environment variables sync to Vercel dashboard automatically

### Configuration Structure
```bash
# .env.local (WHY: Environment variables keep secrets out of code)
DAILY_API_KEY=your_daily_api_key_here

# Pre-configured Daily room URLs for each cohort
DAILY_ROOM_1=https://your-domain.daily.co/cohort-1
DAILY_ROOM_2=https://your-domain.daily.co/cohort-2
DAILY_ROOM_3=https://your-domain.daily.co/cohort-3
DAILY_ROOM_4=https://your-domain.daily.co/cohort-4
DAILY_ROOM_5=https://your-domain.daily.co/cohort-5
DAILY_ROOM_6=https://your-domain.daily.co/cohort-6

# App configuration
NEXT_PUBLIC_MAX_PARTICIPANTS_PER_ROOM=10
NEXT_PUBLIC_APP_NAME=Overcast
```

### Config Mapping Implementation
```typescript
// lib/daily-config.ts
// WHY: Centralize configuration mapping for easy maintenance
// Single file = easy for newcomers to find and understand

export interface ClassroomConfig {
  id: string;
  name: string;
  dailyUrl: string;
  maxParticipants: number;
}

// WHY: Export const instead of function - simpler, no runtime overhead
export const CLASSROOMS: ClassroomConfig[] = [
  {
    id: 'cohort-1',
    name: 'Cohort 1',
    dailyUrl: process.env.DAILY_ROOM_1 || '',
    maxParticipants: parseInt(process.env.NEXT_PUBLIC_MAX_PARTICIPANTS_PER_ROOM || '10'),
  },
  // ... repeat for cohorts 2-6
];

// WHY: Helper function for quick lookups
export function getClassroomById(id: string): ClassroomConfig | undefined {
  return CLASSROOMS.find(classroom => classroom.id === id);
}
```

### Alternatives Considered
1. **JSON Config File**: Less secure for URLs, not externalized config
2. **Database (Supabase/Firestore)**: Overkill for 6 static configs, adds complexity
3. **Hardcoded Values**: Inflexible, requires code changes to update URLs

---

## 6. Vercel Serverless API Routes

### Decision
Minimal **Next.js API Route Handlers** deployed as Vercel serverless functions

### Rationale
- **Auto-Deploy**: Next.js API routes become serverless functions on Vercel automatically
- **Stateless**: Perfect for serverless (no persistent connections needed)
- **Minimal Backend**: Only need 2 endpoints (room listing, participant mute)
- **Edge-Ready**: Can run on Vercel Edge for lower latency if needed

### API Route Pattern
```typescript
// app/api/rooms/route.ts
// WHY: Export GET function creates GET /api/rooms endpoint
// Next.js convention = easy to understand for newcomers

import { NextResponse } from 'next/server';
import { CLASSROOMS } from '@/lib/daily-config';

// WHY: This runs server-side only - can access Daily API safely
export async function GET() {
  // In future, could fetch live participant counts from Daily API
  // For now, return configured classrooms
  return NextResponse.json({
    classrooms: CLASSROOMS.map(c => ({
      id: c.id,
      name: c.name,
      participantCount: 0, // Would query Daily API in production
      isAtCapacity: false,
    })),
  });
}
```

### Why Only 2 Endpoints?
1. **GET /api/rooms**: List classrooms (could enhance with live participant counts)
2. **POST /api/participants/[id]/mute**: Proxy mute actions (future: validate instructor role)

**WHY not more?**:
- Daily.co handles all video/audio infrastructure
- Room joining happens client-side via Daily SDK
- Participant tracking handled by Daily state
- No user accounts = no auth endpoints needed

### Alternatives Considered
1. **Separate Express Backend**: Overkill, violates simplicity
2. **Client-Only (no API)**: Security concerns for Daily API key usage
3. **GraphQL**: Unnecessary complexity for 2 endpoints

---

## 7. Testing Strategy

### Decision
**Jest + React Testing Library** (unit/component) + **Playwright** (E2E integration)

### Rationale
- **Jest Integration**: Next.js has built-in Jest support, zero config needed
- **React Testing Library**: Tests user behavior, not implementation details
- **Playwright**: Full browser automation for real Daily.co video testing
- **Test as Documentation**: Tests demonstrate how features work for newcomers

### Test Pyramid
```
        /\
       /  \          E2E Integration (Playwright)
      /    \         - 3-5 critical user journeys
     /------\        - Real browser, real Daily rooms
    /        \
   /  Unit &  \      Component Tests (Jest + RTL)
  / Component  \     - 10-15 component tests
 /    Tests     \    - Mock Daily.co for isolation
/________________\   - Fast, run on every commit
```

### Unit Test Example
```typescript
// tests/unit/components/Lobby.test.tsx
// WHY: Test names describe user scenarios in plain language
// Tests serve as documentation for how Lobby works

import { render, screen } from '@testing-library/react';
import { Lobby } from '@/app/components/Lobby';

describe('Lobby Component', () => {
  it('displays 6 classroom options when user views lobby', () => {
    render(<Lobby />);
    
    // WHY: Test user-visible text, not implementation
    expect(screen.getByText('Cohort 1')).toBeInTheDocument();
    expect(screen.getByText('Cohort 2')).toBeInTheDocument();
    // ... assert all 6 classrooms visible
  });
  
  it('toggles between Students and Instructors mode when user clicks toggle', () => {
    render(<Lobby />);
    
    const toggle = screen.getByRole('button', { name: /instructors/i });
    fireEvent.click(toggle);
    
    // WHY: Assert mode change is reflected in UI
    expect(screen.getByText(/instructor mode/i)).toBeInTheDocument();
  });
});
```

### Integration Test Example
```typescript
// tests/integration/test_student_journey.test.ts
// WHY: E2E test validates complete user workflow
// Demonstrates the entire feature working together

import { test, expect } from '@playwright/test';

test('student can join classroom and see video feed', async ({ page }) => {
  // WHY: Step-by-step user journey
  // 1. User enters name
  await page.goto('/');
  await page.fill('input[name="username"]', 'Test Student');
  await page.click('button:has-text("Continue")');
  
  // 2. User sees lobby with 6 classrooms
  await expect(page.locator('text=Cohort 1')).toBeVisible();
  
  // 3. User selects Students mode (default)
  await expect(page.locator('text=Students')).toHaveClass(/active/);
  
  // 4. User joins Cohort 1
  await page.click('button:has-text("Cohort 1")');
  
  // 5. User sees video feed interface
  await expect(page.locator('[data-testid="video-feed"]')).toBeVisible();
  await expect(page.locator('text=Test Student')).toBeVisible();
  
  // 6. User can return to lobby
  await page.click('button:has-text("Return to Main Lobby")');
  await expect(page.locator('text=Cohort 1')).toBeVisible();
});
```

### Mock Strategy for Daily.co
```typescript
// tests/unit/__mocks__/@daily-co/daily-react.ts
// WHY: Mock Daily hooks to test components in isolation
// Prevents real video calls during unit tests

export const useParticipants = jest.fn(() => [
  {
    session_id: '123',
    user_name: 'Mock User',
    local: false,
    owner: false,
    tracks: {
      video: { state: 'playable' },
      audio: { state: 'playable' },
    },
  },
]);

export const useDaily = jest.fn(() => ({
  join: jest.fn(),
  leave: jest.fn(),
  setLocalAudio: jest.fn(),
  setLocalVideo: jest.fn(),
}));
```

### Alternatives Considered
1. **Cypress**: Heavier than Playwright, slower test execution
2. **Testing Library Only**: Can't test real browser video functionality
3. **Manual Testing**: Not repeatable, violates Test-Driven Clarity principle

---

## Summary of Technical Decisions

| Area | Decision | Key Rationale |
|------|----------|---------------|
| Video Platform | Daily.co with @daily-co/daily-react | React hooks, automatic state management, simple API |
| Framework | Next.js 15 App Router | Modern pattern, Server Components, Vercel integration |
| Styling | Tailwind v4 CSS-first | Custom theme via CSS variables, utility-first, performant |
| State | Jotai (Daily) + Context (user) | Required by Daily, Context sufficient for simple session |
| Config | Environment variables | No database needed, 12-factor app, secure |
| API | Next.js route handlers | Serverless on Vercel, minimal backend logic |
| Testing | Jest + RTL + Playwright | Unit isolation, E2E validation, test as docs |

**Constitutional Compliance**: All decisions favor simplicity, single-file patterns, and newcomer-friendly approaches. No over-engineering detected.

---

**Next Phase**: Design & Contracts (data-model.md, API contracts, quickstart.md)

