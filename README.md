# Overcast Video Classroom

<div align="center">

**A futuristic video classroom platform built with Next.js 15 and Daily.co**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Daily.co](https://img.shields.io/badge/Daily.co-Video-00FFD1)](https://www.daily.co/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

*Powered by the Overclock Accelerator*

</div>

---

## 🚀 Features

- **📺 Main Lobby**: Browse 6 available classrooms (Cohort 1-6) with real-time participant counts
- **👨‍🎓 Student Mode**: Join classrooms, view video feeds, participate in discussions
- **👨‍🏫 Instructor Mode**: All student features plus participant management and mute controls
- **🎥 Real-time Video**: Powered by Daily.co with up to **10 participants per classroom**
- **🎬 Video Recording**: Record classroom sessions locally with start/stop controls
- **📥 Download Management**: Download recordings after leaving classrooms
- **🔄 Multiple Recordings**: Start multiple recording sessions within the same classroom
- **⏰ Auto Cleanup**: Recordings automatically deleted after 24 hours
- **🎨 Futuristic Design**: Black/teal/orange aesthetic with smooth animations and glow effects
- **♿ Accessible**: WCAG AA compliant with keyboard navigation and ARIA labels
- **📱 Responsive**: Works seamlessly on desktop, tablet, and mobile devices

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Daily.co Account** (free tier works) – [Sign up](https://dashboard.daily.co/signup)
- **Modern Browser** (Chrome, Firefox, Safari, or Edge with WebRTC support)
- **Git** for cloning the repository

**Time to setup**: ~10 minutes ⏱️

---

## 🎯 Quick Start

### 1. Create Daily.co Rooms

1. Log into [Daily.co Dashboard](https://dashboard.daily.co/)
2. Navigate to **Rooms** → **Create Room**
3. Create **6 rooms** with these exact names:
   ```
   cohort-1
   cohort-2
   cohort-3
   cohort-4
   cohort-5
   cohort-6
   ```
4. Copy each room URL (format: `https://your-domain.daily.co/cohort-X`)

💡 **Why 6 rooms?** The application displays 6 classrooms per requirement FR-001.

### 2. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd overcast

# Install dependencies
npm install

# Expected: "added 300+ packages in 30s"
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp env.example .env.local

# Edit with your favorite editor
nano .env.local  # or code .env.local, vim .env.local
```

**Add your Daily.co configuration to `.env.local`:**

```bash
# Daily.co Room URLs (REQUIRED)
NEXT_PUBLIC_DAILY_ROOM_1=https://your-domain.daily.co/cohort-1
NEXT_PUBLIC_DAILY_ROOM_2=https://your-domain.daily.co/cohort-2
NEXT_PUBLIC_DAILY_ROOM_3=https://your-domain.daily.co/cohort-3
NEXT_PUBLIC_DAILY_ROOM_4=https://your-domain.daily.co/cohort-4
NEXT_PUBLIC_DAILY_ROOM_5=https://your-domain.daily.co/cohort-5
NEXT_PUBLIC_DAILY_ROOM_6=https://your-domain.daily.co/cohort-6

# Application Configuration (REQUIRED)
NEXT_PUBLIC_MAX_PARTICIPANTS_PER_ROOM=10
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

You should see the Overcast landing page with name entry.

---

## 🏗️ Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15.5.4 (App Router) |
| **Language** | TypeScript 5.x |
| **Video** | Daily.co (@daily-co/daily-react, @daily-co/daily-js) |
| **Styling** | Tailwind CSS v4 with custom theme |
| **State** | React Context API + Jotai (Daily.co requirement) |
| **Testing** | Jest, React Testing Library, Playwright |
| **Deployment** | Vercel (serverless functions) |

---

## 📁 Project Structure

```
overcast/
├── app/
│   ├── page.tsx                    # Landing page with name entry
│   ├── lobby/
│   │   └── page.tsx                # Lobby page wrapper
│   ├── classroom/
│   │   └── [id]/
│   │       └── page.tsx            # Dynamic classroom pages (cohort-1 to cohort-6)
│   ├── api/
│   │   ├── rooms/
│   │   │   └── route.ts            # GET /api/rooms endpoint
│   │   └── participants/
│   │       └── [sessionId]/
│   │           └── mute/
│   │               └── route.ts    # POST /api/participants/[id]/mute
│   ├── components/
│   │   ├── UserSessionProvider.tsx # Global session context
│   │   ├── Lobby.tsx               # Lobby component with 6 classroom cards
│   │   ├── Classroom.tsx           # Classroom component with Daily integration
│   │   ├── VideoFeed.tsx           # Video grid display
│   │   ├── InstructorControls.tsx  # Instructor-only controls
│   │   ├── RecordingControls.tsx   # Recording start/stop controls
│   │   ├── RecordingManager.tsx    # Recording state management
│   │   ├── DownloadManager.tsx     # Recording download interface
│   │   └── ui/                     # Reusable UI components
│   ├── globals.css                 # Futuristic theme (black/teal/orange)
│   └── layout.tsx                  # Root layout with branding
│
├── lib/
│   ├── types.ts                    # TypeScript type definitions
│   ├── constants.ts                # Application constants
│   ├── daily-config.ts             # Daily.co room configuration
│   ├── recording-utils.ts         # Recording operations and MediaRecorder API
│   ├── storage-utils.ts           # localStorage management for recordings
│   ├── browser-compatibility.ts   # Browser support detection
│   └── utils.ts                    # Utility functions
│
├── tests/
│   ├── contract/                   # API contract tests
│   ├── integration/                # E2E Playwright tests
│   ├── performance/                 # Performance tests for recording
│   └── unit/                       # Component unit tests
│
├── specs/                          # Feature specifications
│   ├── 003-overcast-video-classroom/
│   │   ├── spec.md                 # Feature specification
│   │   ├── plan.md                 # Implementation plan
│   │   ├── tasks.md                # Task breakdown
│   │   ├── data-model.md           # Data model documentation
│   │   └── contracts/              # API contract specifications
│   └── 004-video-recording-feature/
│       ├── spec.md                 # Recording feature specification
│       ├── plan.md                 # Implementation plan
│       ├── tasks.md                # Task breakdown
│       ├── data-model.md           # Recording data model
│       ├── contracts/              # Recording API contracts
│       ├── research.md             # Technical research
│       └── quickstart.md           # Recording quickstart guide
│
└── .specify/                       # SpecStory configuration
    └── memory/
        └── constitution.md         # Project principles
```

---

## 🎓 User Workflows

### Student Journey

1. **Landing Page**: Enter your name (1-50 characters, no password required)
2. **Lobby**: View 6 classrooms with participant counts
3. **Join Classroom**: Click a classroom card to join as student
4. **Video Session**: See live video feeds of all participants
5. **Controls**: Mute/unmute yourself, toggle video
6. **Switch Rooms**: Return to lobby anytime to join a different classroom

### Instructor Journey

1. **Landing Page**: Enter your name
2. **Lobby**: Toggle to "Instructor" mode
3. **Join Classroom**: Click a classroom card to join as instructor
4. **Instructor Controls**: Access participant management panel
5. **Manage Participants**: Mute/unmute individual participants
6. **Equal Privileges**: All instructors have the same controls (FR-012)

### Recording Journey

1. **Join Classroom**: Enter any classroom as student or instructor
2. **Start Recording**: Click "Start Recording" button next to "Leave Classroom"
3. **Recording Active**: See recording indicator with duration display
4. **Stop Recording**: Click "Stop Recording" to end current session
5. **Multiple Sessions**: Start new recordings while classroom is open
6. **Leave Classroom**: Recordings automatically saved when leaving
7. **Download Recordings**: Visit `/recordings` page to download all recordings
8. **Auto Cleanup**: Recordings automatically deleted after 24 hours

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test by Type

```bash
# API contract tests (validates endpoints match specification)
npm run test:contract

# Integration tests (E2E user workflows with Playwright)
npm run test:integration

# Unit tests (component and utility function tests)
npm run test:unit

# Watch mode (for development)
npm test -- --watch
```

### Test Coverage

- **Contract Tests**: Validate API responses match OpenAPI specifications
- **Integration Tests**: Complete student and instructor journeys (17 test cases)
- **Unit Tests**: Component behavior and utility functions
- **E2E Tests**: Browser automation with Playwright

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Black** | `#000000` | Background |
| **Teal** | `#00FFD1` | Primary actions, highlights |
| **Orange** | `#FFBD17` | Secondary actions, urgency |
| **Dark Gray** | `#1a1a1a` | Cards, panels |
| **Medium Gray** | `#333333` | Borders |
| **Light Gray** | `#666666` | Muted text |

### Typography

- **Font Family**: Geist Sans (geometric, modern)
- **Headings**: Bold, uppercase, wide letter-spacing
- **Body**: Regular weight, high contrast (white on black)

### Components

- **Hover Effects**: Teal glow, translate-Y animation
- **Transitions**: Smooth 200-300ms for all state changes
- **Borders**: Subtle gray, teal on hover/focus
- **Shadows**: Teal glow for active elements

---

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit

# Format code (if configured)
npm run format
```

### Constitutional Principles

This project follows the **Overcast Constitution** emphasizing:

1. **Simplicity First**: Straightforward solutions over clever ones
2. **Single File Preference**: Keep related functionality together
3. **Comment-Driven Development**: Explain WHY, not just WHAT
4. **Newcomer-Friendly**: Code accessible to junior developers
5. **Test-Driven Clarity**: Tests as living documentation

See [`.specify/memory/constitution.md`](.specify/memory/constitution.md) for details.

### Key Development Practices

- ✅ Write tests before implementation (TDD)
- ✅ Add WHY comments for complex logic
- ✅ Use TypeScript for type safety
- ✅ Validate with linter and type checker
- ✅ Test on multiple browsers

---

## 🚀 Deployment

### Vercel (Recommended)

#### Quick Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

#### Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_DAILY_ROOM_1` | ✅ | `https://overcast.daily.co/cohort-1` |
| `NEXT_PUBLIC_DAILY_ROOM_2` | ✅ | `https://overcast.daily.co/cohort-2` |
| `NEXT_PUBLIC_DAILY_ROOM_3` | ✅ | `https://overcast.daily.co/cohort-3` |
| `NEXT_PUBLIC_DAILY_ROOM_4` | ✅ | `https://overcast.daily.co/cohort-4` |
| `NEXT_PUBLIC_DAILY_ROOM_5` | ✅ | `https://overcast.daily.co/cohort-5` |
| `NEXT_PUBLIC_DAILY_ROOM_6` | ✅ | `https://overcast.daily.co/cohort-6` |
| `NEXT_PUBLIC_MAX_PARTICIPANTS_PER_ROOM` | ✅ | `10` |

#### Production Build

```bash
# Test production build locally
npm run build
npm start

# Deploy to production
vercel --prod
```

---

## 🐛 Troubleshooting

### Common Issues

**"Failed to load classrooms"**
- ✅ Check environment variables are set correctly
- ✅ Verify Daily.co room URLs are accessible
- ✅ Check browser console for CORS errors

**Video not connecting**
- ✅ Ensure browser has camera/microphone permissions
- ✅ Verify Daily.co rooms exist and are accessible
- ✅ Check network connectivity

**Build fails**
- ✅ Run `npm install` to ensure dependencies are installed
- ✅ Check TypeScript errors with `npx tsc --noEmit`
- ✅ Verify all required environment variables are set

**Tests failing**
- ✅ Ensure dev server is running for integration tests
- ✅ Check that Daily.co credentials are valid
- ✅ Run tests individually to isolate issues

---

## 📚 API Endpoints

### GET /api/rooms

Returns all 6 classrooms with current status.

**Response:**
```json
{
  "classrooms": [
    {
      "id": "cohort-1",
      "name": "Cohort 1",
      "participantCount": 5,
      "isAtCapacity": false
    },
    // ... 5 more classrooms
  ]
}
```

### POST /api/participants/[sessionId]/mute

Mute or unmute a participant (instructor only).

**Request:**
```json
{
  "muted": true,
  "instructorSessionId": "instructor-session-123"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 📖 Documentation

- **Feature Spec**: [`specs/003-overcast-video-classroom/spec.md`](specs/003-overcast-video-classroom/spec.md)
- **Implementation Plan**: [`specs/003-overcast-video-classroom/plan.md`](specs/003-overcast-video-classroom/plan.md)
- **Task Breakdown**: [`specs/003-overcast-video-classroom/tasks.md`](specs/003-overcast-video-classroom/tasks.md)
- **Data Model**: [`specs/003-overcast-video-classroom/data-model.md`](specs/003-overcast-video-classroom/data-model.md)
- **API Contracts**: [`specs/003-overcast-video-classroom/contracts/`](specs/003-overcast-video-classroom/contracts/)
- **Quickstart Guide**: [`specs/003-overcast-video-classroom/quickstart.md`](specs/003-overcast-video-classroom/quickstart.md)

---

## 🤝 Contributing

1. Follow the [Overcast Constitution](.specify/memory/constitution.md)
2. Write tests before implementation (TDD approach)
3. Use descriptive commit messages
4. Ensure code passes linting (`npm run lint`)
5. Type check with TypeScript (`npx tsc --noEmit`)
6. Update documentation for new features

---

## 📄 License

This project is part of the **Overclock Accelerator** program.

---

## 🔗 Resources

- [Daily.co Documentation](https://docs.daily.co/)
- [Daily React Hooks](https://github.com/daily-co/daily-react)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

---

<div align="center">

**Built with ❤️ by the Overclock Accelerator Team**

*Empowering the next generation of AI engineers*

</div>
