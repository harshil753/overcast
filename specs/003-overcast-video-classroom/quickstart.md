# Quickstart: Overcast Video Classroom

**Feature**: 003-overcast-video-classroom  
**Date**: 2025-10-05  
**Purpose**: Get the Overcast video classroom running locally in <10 minutes

## Prerequisites

Before starting, ensure you have:
- **Node.js 18+** installed ([download](https://nodejs.org/))
- **Daily.co account** (free tier works) - [Sign up](https://dashboard.daily.co/signup)
- **Modern browser** (Chrome, Firefox, Safari, or Edge)
- **Git** for cloning the repository

**Time Estimate**: 5-10 minutes

---

## Step 1: Get Daily.co Room URLs (5 minutes)

### Create 6 Daily Rooms

1. **Log into Daily.co Dashboard**: https://dashboard.daily.co/
2. **Navigate to Rooms** → Create Room
3. **Create 6 rooms** with these names:
   - `cohort-1`
   - `cohort-2`
   - `cohort-3`
   - `cohort-4`
   - `cohort-5`
   - `cohort-6`

4. **Copy each room URL** (format: `https://your-domain.daily.co/cohort-1`)

**WHY 6 rooms?**: Application displays 6 classrooms per requirement (FR-001)

### Get Your API Key

1. In Daily Dashboard, go to **Developers** → **API Keys**
2. Copy your API key (starts with a long alphanumeric string)
3. Keep this handy for the next step

**WHY API key?**: Needed for future instructor actions like muting (optional for MVP)

---

## Step 2: Clone and Setup Project (2 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd overcast

# Install dependencies
npm install

# WHY npm install: Installs Next.js, Daily.co SDK, Tailwind, and all dependencies
```

**Expected Output**:
```
added 300+ packages in 30s
```

---

## Step 3: Configure Environment Variables (2 minutes)

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp env.example .env.local

# Edit with your favorite editor
nano .env.local  # or code .env.local, vim .env.local, etc.
```

**Add your Daily.co configuration**:

```bash
# .env.local
# WHY: Environment variables keep secrets out of code and allow easy config changes

# Daily.co API Key (from Step 1)
DAILY_API_KEY=your_actual_api_key_here

# Daily.co Room URLs (from Step 1)
# IMPORTANT: Use HTTPS URLs, must match format https://*.daily.co/*
DAILY_ROOM_1=https://your-domain.daily.co/cohort-1
DAILY_ROOM_2=https://your-domain.daily.co/cohort-2
DAILY_ROOM_3=https://your-domain.daily.co/cohort-3
DAILY_ROOM_4=https://your-domain.daily.co/cohort-4
DAILY_ROOM_5=https://your-domain.daily.co/cohort-5
DAILY_ROOM_6=https://your-domain.daily.co/cohort-6

# Application Configuration
NEXT_PUBLIC_APP_NAME=Overcast
NEXT_PUBLIC_MAX_PARTICIPANTS_PER_ROOM=10
```

**Validation Checklist**:
- ✅ All 6 DAILY_ROOM_* variables filled
- ✅ URLs start with `https://` and contain `.daily.co`
- ✅ MAX_PARTICIPANTS_PER_ROOM set to 10
- ✅ File saved in project root as `.env.local`

**Common Mistakes**:
- ❌ Using `env.local` instead of `.env.local` (must have leading dot)
- ❌ Forgetting HTTPS in URLs
- ❌ Using placeholder text instead of actual Daily URLs

---

## Step 4: Start Development Server (1 minute)

```bash
npm run dev
```

**Expected Output**:
```
▲ Next.js 15.x
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

**WHY this command?**: Starts Next.js development server with hot-reload for instant feedback

---

## Step 5: Test the Application (2 minutes)

### Test 1: Landing Page & Name Entry

1. Open browser to http://localhost:3000
2. You should see: **Landing page with name input**
3. Enter your name (e.g., "Test User")
4. Click **Continue** button

**Expected**: Redirected to lobby showing 6 classrooms

**Validates**: FR-015 (name entry requirement)

### Test 2: Lobby Display

You should see:
- **6 classroom cards** labeled "Cohort 1" through "Cohort 6"
- **Students/Instructors toggle** at top
- **Black background with teal highlights** (futuristic theme)

**Expected**: Clean grid layout, all classrooms showing 0 participants

**Validates**: FR-001 (6 classrooms), FR-002 (mode toggle)

### Test 3: Join Classroom as Student

1. Ensure **Students** mode is selected (default)
2. Click **"Cohort 1"** card
3. Browser will ask for camera/microphone permissions → **Allow**

**Expected**:
- Redirected to `/classroom/cohort-1`
- See your own video feed
- Classroom header shows "Cohort 1: Class Session"
- **"Return to Main Lobby"** button visible

**Validates**: FR-003 (join classroom), FR-004 (video feed), FR-005 (classroom name), FR-006 (return button)

### Test 4: Return to Lobby

1. Click **"Return to Main Lobby"** button

**Expected**:
- Back at lobby showing all 6 classrooms
- Cohort 1 now shows "1 participant" (you, still connected)

**Validates**: FR-006 (return to lobby), FR-007 (switch without logout)

### Test 5: Join as Instructor

1. Toggle to **"Instructors"** mode at top
2. Click **"Cohort 2"** card
3. Allow camera/mic permissions again

**Expected**:
- In Cohort 2 classroom
- **Instructor Control Panel** visible (bottom or side)
- Panel shows: "Participants" list, "Mute" buttons

**Validates**: FR-008 (instructor control panel), FR-012 (instructor access)

### Test 6: Test with Multiple Users (Optional)

1. Open browser in **Incognito/Private window**
2. Go to http://localhost:3000
3. Enter different name, join same classroom

**Expected**:
- Both users see each other's video feeds
- Participant count updates to 2
- Instructor can see mute buttons for each participant

**Validates**: FR-011 (separate sessions), FR-014 (dynamic join/leave)

---

## Quick Troubleshooting

### Issue: "Cannot read environment variable DAILY_ROOM_1"

**Fix**: 
1. Check `.env.local` exists in project root
2. Verify all DAILY_ROOM_* variables are set
3. Restart dev server (`Ctrl+C`, then `npm run dev`)

**WHY**: Next.js loads env vars at startup

---

### Issue: Camera/Mic permissions denied

**Fix**:
1. Browser settings → Site permissions
2. Allow camera and microphone for localhost:3000
3. Refresh page

**WHY**: Daily.co requires media permissions for video

---

### Issue: "Room not found" or 403 error

**Fix**:
1. Verify Daily.co room URLs are correct
2. Check rooms exist in Daily dashboard
3. Ensure rooms are **not** private/password-protected

**WHY**: Daily.co validates room existence before allowing join

---

### Issue: No video appears

**Check**:
- Browser console for errors (F12 → Console tab)
- Daily.co room status in dashboard
- Network tab shows WebRTC connections

**Common Causes**:
- Firewall blocking WebRTC
- Browser doesn't support WebRTC (unlikely)
- Daily.co room configuration issue

---

## Validation Checklist

After completing quickstart, verify:

- [x] ✅ Landing page loads at http://localhost:3000
- [x] ✅ Name entry works and redirects to lobby
- [x] ✅ Lobby displays all 6 classrooms (Cohort 1-6)
- [x] ✅ Students/Instructors mode toggle visible
- [x] ✅ Can join classroom and see video feed
- [x] ✅ Return to lobby button works
- [x] ✅ Instructor mode shows control panel
- [x] ✅ Multiple users can join same classroom

**If all checked**: ✅ **Quickstart successful!** Application is working correctly.

---

## Next Steps

### For Developers

1. **Run Tests**: `npm test` (validates all features work)
2. **Explore Code**: Start with `app/page.tsx` (landing page)
3. **Read Comments**: Code includes WHY comments for newcomers
4. **Review Data Model**: See `lib/types.ts` for TypeScript interfaces

### For Testing

1. **Test Capacity Limits**: Join 10 users to one classroom → 11th blocked (FR-016, FR-018)
2. **Test Mute/Unmute**: Instructor mutes student → Student unmutes self (FR-009, FR-019)
3. **Test Role Persistence**: Switch classrooms → Role stays same (FR-007)

### For Deployment

1. **Vercel Deployment**: See README for Vercel setup
2. **Environment Variables**: Add same env vars to Vercel dashboard
3. **Custom Domain**: Configure in Vercel settings

---

## Architecture Overview

**For Newcomers**: Here's how the application works at a high level:

```
┌─────────────┐
│   Browser   │
│  localhost  │
└──────┬──────┘
       │
       │ 1. User enters name
       ▼
┌─────────────┐
│  Next.js    │
│  Frontend   │ (app/page.tsx → app/lobby → app/classroom/[id])
└──────┬──────┘
       │
       │ 2. Join classroom
       ▼
┌─────────────┐
│  Daily.co   │ (Video infrastructure)
│  WebRTC     │ - Manages video/audio streams
│             │ - Handles participant state
│             │ - Provides React hooks
└─────────────┘
```

**WHY this architecture?**:
- **Next.js**: Provides routing, API, and UI framework (simple, batteries-included)
- **Daily.co**: Handles complex WebRTC video (abstracts low-level details)
- **No Database**: Configuration via env vars (keeps it simple)

**File Structure**:
- `app/` → Pages and API routes
- `lib/` → Configuration, types, utilities
- `components/` → Reusable UI components
- `tests/` → Automated tests

---

## Support

**Common Questions**:

**Q: Can I use different Daily.co room names?**  
A: Yes! Environment variables can point to any Daily room URLs. Just keep 6 rooms total.

**Q: How do I change max participants from 10?**  
A: Edit `NEXT_PUBLIC_MAX_PARTICIPANTS_PER_ROOM` in `.env.local`

**Q: Can I run multiple classrooms on different ports?**  
A: Not needed - single Next.js server handles all 6 classrooms via routing.

**Q: Do I need to create Daily.co rooms manually every time?**  
A: No - rooms persist in Daily.co. Create once, use forever (until you delete them).

---

**Time Spent**: ~10 minutes  
**Next Step**: Run `/tasks` command to generate implementation tasks

**Quickstart Complete!** 🎉

