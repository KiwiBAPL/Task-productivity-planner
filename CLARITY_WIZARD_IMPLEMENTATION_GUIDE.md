# Clarity Wizard Implementation Guide

**Purpose:** This document serves as a complete reference for implementing the Clarity Wizard feature incrementally. Each step should be built by a separate agent, referencing this guide.

**Last Updated:** 2026-01-05

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Technical Stack](#architecture--technical-stack)
3. [Database Schema](#database-schema)
4. [Incremental Implementation Steps](#incremental-implementation-steps)
5. [Design System Integration](#design-system-integration)
6. [Reference Files](#reference-files)

---

## Overview

The Clarity Wizard is a multi-step guided journey that helps users:
1. Define a focus period (3-24 months)
2. Choose optional tools (Wheel of Life, SWOT, Vision Board)
3. Complete exercises to inform their Big 5 outcomes
4. Define 5 outcome buckets with OKRs
5. Review and commit their journey

**Key Features:**
- **Autosave:** All work is automatically saved (300-500ms debounce)
- **Multi-day workflow:** Users can complete over multiple sessions
- **Draft/Completed states:** Journeys can be resumed or edited
- **Vision Board versioning:** Explicit save creates committed version for use elsewhere

**Routes:**
- `/clarity-wizard` - Home (list journeys, start new)
- `/clarity-wizard/new/period` - Define focus period
- `/clarity-wizard/:journeyId/tools` - Select tools
- `/clarity-wizard/:journeyId/wheel-of-life` - Wheel of Life (optional)
- `/clarity-wizard/:journeyId/swot` - SWOT (optional)
- `/clarity-wizard/:journeyId/vision-board` - Vision Board (optional)
- `/clarity-wizard/:journeyId/big-5` - Big 5 & OKRs (required)
- `/clarity-wizard/:journeyId/summary` - Summary view

---

## Architecture & Technical Stack

### Frontend
- **Framework:** React with TypeScript
- **Routing:** React Router (BrowserRouter)
- **State Management:** Local component state with debounced autosave
- **UI Components:** Glass components from `packages/ui` (GlassPanel, GlassCard, GlassPill)
- **Buttons:** PrimaryPillButton, SecondaryPillButton from `packages/ui`
- **Styling:** Tailwind CSS with custom Auro design tokens

### Backend
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage for vision board images
- **Security:** Row Level Security (RLS) policies
- **Authentication:** Supabase Auth (existing)

### Key Patterns
- **Autosave:** Debounce form changes (300-500ms) before saving to Supabase
- **Data Hydration:** Load existing data on component mount, hydrate local state
- **Navigation:** Save state before navigating away
- **Error Handling:** Graceful error states with user feedback

---

## Database Schema

### 1. `clarity_journeys`
```sql
- id (uuid, pk, default gen_random_uuid())
- user_id (uuid, fk -> auth.users.id)
- name (text, nullable) -- Period name
- period_start (date)
- period_end (date)
- tools_wheel_of_life (boolean, default true)
- tools_swot (boolean, default true)
- tools_vision_board (boolean, default true)
- status (text, check in ('draft','completed','archived'), default 'draft')
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
```

**RLS Policy:** Users can only access their own journeys (`user_id = auth.uid()`)

### 2. `wheel_of_life_areas`
```sql
- id (uuid, pk)
- journey_id (uuid, fk -> clarity_journeys.id on delete cascade)
- label (text)
- score (int, 1-10 constraint)
- notes (text, nullable)
- created_at, updated_at (timestamptz)
```

### 3. `swot_entries`
```sql
- id (uuid, pk)
- journey_id (uuid, fk -> clarity_journeys.id on delete cascade)
- type (text, check in ('strength','weakness','opportunity','threat'))
- content (text)
- notes (text, nullable)
- created_at, updated_at (timestamptz)
```

### 4. `vision_board_versions`
```sql
- id (uuid, pk)
- journey_id (uuid, fk -> clarity_journeys.id on delete cascade)
- title (text, nullable)
- created_at (timestamptz, default now())
- is_current (boolean, default true)
- is_committed (boolean, default false) -- true when "Save Board" clicked
```

**Versioning Logic:**
- Draft version: `is_committed = false` (autosaved as user works)
- Committed version: `is_committed = true` (created on "Save Board", used elsewhere)

### 5. `vision_board_images`
```sql
- id (uuid, pk)
- version_id (uuid, fk -> vision_board_versions.id on delete cascade)
- storage_path (text) -- path in Supabase Storage
- caption (text, nullable)
- position_index (int)
- created_at (timestamptz)
```

**Storage Bucket:** `vision-board` (create in Supabase Storage)

### 6. `big5_buckets`
```sql
- id (uuid, pk)
- journey_id (uuid, fk -> clarity_journeys.id on delete cascade)
- order_index (int, 0-4)
- title (text)
- statement (text) -- "[Who] will [change] so that [benefit]"
- created_at, updated_at (timestamptz)
```

### 7. `big5_okrs`
```sql
- id (uuid, pk)
- bucket_id (uuid, fk -> big5_buckets.id on delete cascade)
- order_index (int)
- description (text) -- KR statement
- metric_type (text, check in ('boolean','number','percentage','other'))
- target_value_number (numeric, nullable)
- target_value_text (text, nullable)
- created_at, updated_at (timestamptz)
```

---

## Incremental Implementation Steps

> **Important:** Each step should be implemented by a separate agent. Complete one step fully before moving to the next.

### Step 1: Database Schema Foundation

**File to create:**
- `supabase/migrations/005_create_clarity_wizard_tables.sql`

**Tasks:**
1. Create all 7 tables with correct schema
2. Set up RLS policies for all tables
3. Create storage bucket `vision-board` with RLS policies
4. Add indexes for performance (journey_id, user_id, etc.)
5. Create triggers for `updated_at` timestamps
6. Add check constraints and foreign keys

**Acceptance Criteria:**
- Migration runs successfully
- All tables exist with correct structure
- RLS policies prevent unauthorized access
- Storage bucket is configured
- Test with Supabase client

**Dependencies:** None

---

### Step 2: Navigation & Routing Setup

**Files to modify:**
- `login-app/src/App.tsx` - Add all routes
- `login-app/src/components/Dashboard.tsx` - Add "Clarity Wizard" menu item

**Files to create:**
- `login-app/src/components/clarity-wizard/ClarityWizardHome.tsx`
- `login-app/src/components/clarity-wizard/WizardLayout.tsx`

**Tasks:**
1. Add "Clarity Wizard" menu item in sidebar (below "Home")
   - Use sparkles/magic wand icon (SVG)
   - Navigate to `/clarity-wizard` on click
2. Add routes in `App.tsx`:
   ```typescript
   <Route path="/clarity-wizard" element={<ClarityWizardHome />} />
   <Route path="/clarity-wizard/new/period" element={<DefinePeriodStep />} />
   // ... other routes
   ```
3. Create `WizardLayout` component:
   - Glass panel styling
   - Step indicator (dynamic based on tools)
   - Back/Next navigation buttons
   - Title and subtitle props
4. Create basic `ClarityWizardHome`:
   - Header: "Design your next [X months]"
   - Primary CTA: "Start a new journey"
   - Placeholder for journey list

**Acceptance Criteria:**
- Menu item appears and navigates correctly
- All routes are accessible
- Home page renders with correct styling
- Layout component provides consistent structure

**Dependencies:** Step 1

---

### Step 3: Clarity Wizard Home Page

**Files to modify:**
- `login-app/src/components/clarity-wizard/ClarityWizardHome.tsx`

**Files to create:**
- `login-app/src/lib/clarity-wizard.ts` - API functions

**Tasks:**
1. Create API functions in `clarity-wizard.ts`:
   - `getJourneys()` - Fetch user's journeys
   - `createJourney()` - Create new journey
   - `updateJourney()` - Update journey
2. Implement home page:
   - Fetch and display existing journeys
   - Show status badges (Draft/Completed)
   - Show period dates and name
   - "Resume previous" button if draft exists
   - "Start a new journey" creates journey and navigates
   - Journey list with action links
   - Loading and empty states

**Acceptance Criteria:**
- Lists all user's journeys
- Can start new journey
- Can resume draft journey
- Can view/edit completed journeys
- Proper error handling

**Dependencies:** Step 1, Step 2

---

### Step 4: Define Focus Period Step

**Files to create:**
- `login-app/src/components/clarity-wizard/DefinePeriodStep.tsx`
- `login-app/src/hooks/useAutosave.ts` - Reusable autosave hook

**Tasks:**
1. Create `useAutosave` hook:
   - Debounce function (300ms)
   - Save callback
   - Loading state
2. Implement period step:
   - Period name input (optional)
   - Start date picker (default: today)
   - End date picker (default: 12 months from start)
   - Preset buttons: 3, 6, 12 months
   - Validation: end > start, max 24 months
   - Autosave on blur/delay
   - "Continue" creates/updates journey, navigates to tools
   - "Cancel" saves as draft, returns to home

**Acceptance Criteria:**
- Date validation works
- Presets update dates correctly
- Autosave saves to database
- Navigation works correctly
- Draft preserved on cancel

**Dependencies:** Step 1, Step 2

---

### Step 5: Tool Selection Step

**Files to create:**
- `login-app/src/components/clarity-wizard/ToolSelectionStep.tsx`

**Tasks:**
1. Create tool cards:
   - Wheel of Life (toggleable)
   - SWOT (toggleable)
   - Vision Board (toggleable)
   - Big 5 & OKRs (always on, marked "Required")
2. Each card shows:
   - Description
   - Time estimate (e.g., "5-10 minutes")
   - Toggle switch
3. Behavior:
   - Default: all tools on
   - Autosave selections immediately on toggle
   - "Start exercises" navigates to first enabled tool
   - Dynamic step sequence based on selections

**Acceptance Criteria:**
- All tools toggle correctly
- Big 5 cannot be deselected
- Selections autosave
- Navigation respects tool selection order
- Visual indication of required vs optional

**Dependencies:** Step 1, Step 2

---

### Step 6: Wheel of Life Step

**Files to create:**
- `login-app/src/components/clarity-wizard/WheelOfLifeStep.tsx`

**Tasks:**
1. Default life areas (8-10):
   - Health, Career, Finances, Relationships, Personal Growth, Fun, Environment, Community, Spirituality
2. For each area:
   - Editable label
   - Slider or 1-10 rating input
   - Optional note field
3. Features:
   - Add/remove custom areas
   - Autosave all changes (debounced)
   - "Skip" button marks step as skipped
   - "Next" navigates to next enabled tool or Big 5

**Acceptance Criteria:**
- Can rate all areas
- Can add custom areas
- Can add notes
- Autosave works
- Skip functionality works
- Navigation respects tool selection

**Dependencies:** Step 1, Step 2, Step 5

---

### Step 7: SWOT Analysis Step

**Files to create:**
- `login-app/src/components/clarity-wizard/SWOTStep.tsx`

**Tasks:**
1. 2x2 grid layout:
   - Strengths (top-left)
   - Weaknesses (top-right)
   - Opportunities (bottom-left)
   - Threats (bottom-right)
2. For each quadrant:
   - Chip/tag style input
   - Add/remove items
   - Optional notes per item or quadrant
3. Features:
   - Autosave on add/edit/remove
   - "Skip" and "Next" navigation

**Acceptance Criteria:**
- Can add items to all quadrants
- Can remove items
- Can add notes
- Autosave works
- Visual layout matches spec

**Dependencies:** Step 1, Step 2, Step 5

---

### Step 8: Vision Board Step

**Files to create:**
- `login-app/src/components/clarity-wizard/VisionBoardStep.tsx`
- `login-app/src/lib/vision-board.ts` - Image upload utilities

**Tasks:**
1. Image upload:
   - Multi-file upload button
   - Upload to Supabase Storage bucket
   - Store paths in database
2. Display:
   - Grid of thumbnails
   - Optional caption per image
   - Drag-and-drop reordering (use react-beautiful-dnd or similar)
3. Versioning:
   - Autosave to draft version (`is_committed = false`)
   - "Save Board" creates committed version (`is_committed = true`)
   - Set previous committed versions to `is_current = false`
4. Navigation:
   - "Next" navigates to Big 5
   - "Back" navigates to previous step

**Acceptance Criteria:**
- Can upload multiple images
- Can add captions
- Can reorder images
- Draft autosaves
- "Save Board" creates committed version
- Images display correctly

**Dependencies:** Step 1, Step 2, Step 5

---

### Step 9: Big 5 & OKRs Step

**Files to create:**
- `login-app/src/components/clarity-wizard/Big5Step.tsx`
- `login-app/src/components/clarity-wizard/Big5Card.tsx`
- `login-app/src/components/clarity-wizard/OKRRow.tsx`

**Tasks:**
1. Intro section:
   - Rule explanation
   - Template: "[Who] will [change] so that [benefit]"
   - 2-3 example lines
2. 5 Big 5 cards:
   - Title/name input
   - Outcome statement input (with template helper)
3. For each Big 5:
   - Objective field
   - 3 Key Results rows:
     - KR statement
     - Metric type selector (percentage/numeric/binary)
     - Target value input
4. Supportive context panel (right side):
   - Show Wheel of Life highlights (lowest-rated area)
   - Show SWOT highlights (top strengths, opportunities)
5. Features:
   - Progress indicator (X of 5 completed)
   - Autosave all fields
   - "Finish and save my Big 5" marks journey complete, navigates to summary

**Acceptance Criteria:**
- Can create all 5 Big 5 outcomes
- Can add 3 OKRs per Big 5
- Template helper text is clear
- Supportive context shows insights
- Progress indicator works
- Finish marks journey complete

**Dependencies:** Step 1, Step 2, Step 5, Step 6, Step 7

---

### Step 10: Summary View

**Files to create:**
- `login-app/src/components/clarity-wizard/SummaryView.tsx`

**Tasks:**
1. Display:
   - Period and name
   - Mini vision board (if committed version exists)
   - List all Big 5 with OKRs
2. Actions:
   - "Use in Planner" button (placeholder for future)
   - "Edit Big 5" button (navigates to Big 5 step)
   - Links to edit any previous step

**Acceptance Criteria:**
- Displays all journey data
- Vision board shows if saved
- Can navigate to edit steps
- CTAs are functional

**Dependencies:** Step 1, Step 2, Step 9

---

### Step 11: Polish & Enhancements

**Files to modify:**
- All wizard components

**Tasks:**
1. Loading states for async operations
2. Error handling and user feedback
3. Optimistic UI updates
4. Keyboard navigation
5. Accessibility (ARIA labels, focus management)
6. Mobile responsiveness
7. Toast notifications for save confirmations
8. Progress persistence (remember last step)

**Acceptance Criteria:**
- Smooth user experience
- No console errors
- Accessible to screen readers
- Works on mobile devices

**Dependencies:** All previous steps

---

## Design System Integration

### Glass Components
Use components from `packages/ui/src/components/glass/`:
- `GlassPanel` - For main containers
- `GlassCard` - For cards and elevated surfaces
- `GlassPill` - For controls and inputs

### Buttons
Use components from `packages/ui/src/components/buttons/`:
- `PrimaryPillButton` - For primary CTAs
- `SecondaryPillButton` - For secondary actions

### Design Tokens
Reference `design.json` and `packages/ui/src/theme/auro-tokens.ts` for:
- Colors: `auro-text-primary`, `auro-text-secondary`, `auro-accent`, etc.
- Spacing: Use Tailwind scale (4px base)
- Typography: Follow design.json typography.usage patterns
- Shadows: Use `shadow-panel`, `shadow-card`, `shadow-control` classes

### Styling Classes
From `login-app/src/index.css`:
- `.glass-panel` - Main panel surface
- `.glass-card` - Card surface
- `.glass-control` - Input/control surface
- `.btn-primary`, `.btn-secondary`, `.btn-accent` - Button styles
- `.input-field` - Input styling

### Icon Usage
- Use SVG icons inline (follow existing Dashboard pattern)
- Icon size: 20px for nav items, 16-24px for buttons
- Color: `text-auro-text-secondary` (default), `text-auro-text-primary` (active)

---

## Reference Files

### Specification
- `Clarity Wizard.md` - Complete feature specification

### Design System
- `design.json` - Design system tokens and guidelines
- `packages/ui/src/theme/auro-tokens.ts` - Theme tokens
- `packages/ui/src/theme/auro-themes.ts` - Theme definitions
- `login-app/src/index.css` - Global styles and utilities

### Existing Components
- `login-app/src/components/Dashboard.tsx` - Reference for navigation and styling
- `packages/ui/src/components/glass/` - Glass components
- `packages/ui/src/components/buttons/` - Button components

### Database
- `supabase/migrations/` - Existing migration patterns
- `login-app/src/lib/supabase.ts` - Supabase client setup
- `login-app/src/lib/auth.ts` - Auth utilities

### Routing
- `login-app/src/App.tsx` - Route definitions

---

## Implementation Notes

### Autosave Pattern
```typescript
// Example autosave hook usage
const { save, isSaving } = useAutosave(
  async (data) => {
    await supabase.from('table').update(data).eq('id', id)
  },
  300 // debounce ms
)

// In component
useEffect(() => {
  save(formData)
}, [formData, save])
```

### Navigation Flow
The wizard sequence is dynamic based on tool selection:
1. Period → Tools → [Wheel of Life?] → [SWOT?] → [Vision Board?] → Big 5 → Summary

### Data Loading Pattern
```typescript
// Load existing data on mount
useEffect(() => {
  async function loadData() {
    const { data } = await supabase
      .from('table')
      .select('*')
      .eq('journey_id', journeyId)
    if (data) setLocalState(data)
  }
  loadData()
}, [journeyId])
```

### Error Handling
Always provide user feedback:
- Loading states
- Error messages
- Success confirmations (toast notifications)

---

## Testing Checklist (Per Step)

- [ ] Data persists correctly (autosave)
- [ ] Navigation flow works
- [ ] Validation rules enforced
- [ ] Error states handled gracefully
- [ ] Edge cases handled (empty states, long text, etc.)
- [ ] Styling matches design system
- [ ] Responsive on mobile
- [ ] Accessible (keyboard navigation, screen readers)

---

**End of Implementation Guide**

