
# Modern Onboarding Wizard Implementation Plan

## Overview

Create a premium, multi-step onboarding wizard that replaces the current simple registration flow. The wizard will collect the user's desired role (Participant or Organizer) and gather relevant information following industry best practices, including data needed for AI-powered features like team matching and event recommendations.

---

## Current State Analysis

### Existing Authentication Flow
- **Google Sign-In**: Currently redirects to `/` after OAuth, with no role selection
- **Email Registration**: Uses `RegisterForm.tsx` with basic role selection (Participant/Organizer dropdown)
- **Role Assignment**: Database trigger `handle_new_user_with_qr()` creates profile and assigns roles based on `desiredRole` metadata

### Existing Data Structures
**`user_profiles` table already has:**
- `full_name`, `bio`, `avatar_url`
- `organization`, `phone`, `website`
- `skills` (array) - good for AI matching
- `linkedin_url`, `twitter_url`, `github_url`
- `social_links` (JSONB)

**AI/Matching tables exist:**
- `ai_match_feedback`, `ai_match_impressions`, `ai_match_insights`
- `user_session_interests` - tracks event-specific interests

---

## Wizard Architecture

### Step 1: Role Selection (Required)
Choose your journey in the Thittam1Hub ecosystem.

| Field | Description |
|-------|-------------|
| **Role** | Participant or Organizer (visual card selection) |
| **Tagline** | One-line description for each role |

### Step 2: Basic Profile (Required)
Essential information for your profile.

| Field | Description | Stored In |
|-------|-------------|-----------|
| **Full Name** | Pre-filled from Google if available | `user_profiles.full_name` |
| **Username** | Unique handle for portfolio URL | `user_profiles.username` |
| **Profile Photo** | Upload or use Google avatar | `user_profiles.avatar_url` |

### Step 3: About You (Conditional - differs by role)

**For Participants:**
| Field | Description | Stored In |
|-------|-------------|-----------|
| **Organization/College** | Current affiliation | `user_profiles.organization` |
| **Bio** | Short introduction | `user_profiles.bio` |
| **Skills/Expertise** | Multi-select tags (AI matching) | `user_profiles.skills` |
| **Experience Level** | Beginner/Intermediate/Expert | New: `user_profiles.experience_level` |
| **Interests** | Event categories they're interested in | New: `user_preferences.event_interests` |

**For Organizers:**
| Field | Description | Stored In |
|-------|-------------|-----------|
| **Organization Name** | Their organization | `user_profiles.organization` |
| **Role in Organization** | Job title/position | New: `user_profiles.job_title` |
| **Organization Type** | College/Company/Non-profit | Saved when creating org later |

### Step 4: Connectivity (Optional - skippable)
| Field | Description | Stored In |
|-------|-------------|-----------|
| **LinkedIn URL** | Professional networking | `user_profiles.linkedin_url` |
| **GitHub URL** | For developers | `user_profiles.github_url` |
| **Twitter/X URL** | Social presence | `user_profiles.twitter_url` |
| **Phone** | Optional contact | `user_profiles.phone` |

### Step 5: Preferences (Conditional)

**For Participants:**
| Field | Description | Purpose |
|-------|-------------|---------|
| **Event Types** | Hackathons, Workshops, Conferences, etc. | AI event recommendations |
| **Notification Preferences** | Email frequency | Communication settings |
| **Looking For** | Networking, Learning, Team building | AI matching context |

**For Organizers:**
| Field | Description | Purpose |
|-------|-------------|---------|
| **Expected Event Types** | What they plan to organize | Onboarding customization |
| **Team Size** | Solo/Small team/Large org | Feature recommendations |

---

## Database Changes Required

### New Columns on `user_profiles`
```sql
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0;
```

### New Table: `user_preferences`
```sql
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  event_interests text[] DEFAULT '{}',
  looking_for text[] DEFAULT '{}',
  notification_frequency text DEFAULT 'weekly',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```

---

## New Components

### File Structure
```text
src/components/onboarding/
├── OnboardingWizard.tsx          # Main wizard container
├── steps/
│   ├── RoleSelectionStep.tsx     # Step 1: Role cards
│   ├── BasicProfileStep.tsx      # Step 2: Name, username, photo
│   ├── AboutYouStep.tsx          # Step 3: Skills, experience, bio
│   ├── ConnectivityStep.tsx      # Step 4: Social links
│   └── PreferencesStep.tsx       # Step 5: Event interests
├── components/
│   ├── WizardProgress.tsx        # Step indicator
│   ├── SkillSelector.tsx         # Multi-select skill tags
│   ├── InterestSelector.tsx      # Event category selector
│   └── RoleCard.tsx              # Animated role selection card
└── hooks/
    └── useOnboardingState.ts     # Wizard state management
```

### Key UI Elements
- **Progress indicator**: Elegant step counter with animations
- **Role cards**: Premium glassmorphism cards with icons
- **Skill chips**: Searchable, multi-select tag input
- **Interest grid**: Visual event category selector with icons
- **Skip option**: Clear skip button for optional steps
- **Mobile-first**: Touch-optimized, 44px minimum touch targets

---

## User Flow Changes

### Google OAuth Flow (Updated)
```text
User clicks "Continue with Google"
        ↓
Google OAuth completes
        ↓
Redirect to /onboarding/welcome
        ↓
Onboarding Wizard (5 steps)
        ↓
Check role:
  - Participant → /dashboard
  - Organizer → /onboarding/organization
```

### Route Changes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/onboarding/welcome` | `OnboardingWizard` | New unified onboarding |
| `/onboarding/organization` | Existing | Org creation (organizers only) |

### Auth Hook Updates
- Update `signInWithGoogle()` to redirect to `/onboarding/welcome`
- Check if user has completed onboarding before redirecting to dashboard

---

## Data for AI Features

The collected data enables these AI capabilities:

| Data Field | AI Feature |
|------------|------------|
| `skills` | Team matching, mentor matching |
| `experience_level` | Balanced team composition |
| `event_interests` | Event recommendations, personalized feed |
| `looking_for` | Networking suggestions, connection recommendations |
| `organization` | Professional context for matching |

---

## Implementation Phases

### Phase 1: Core Wizard
1. Create database migrations for new columns/tables
2. Build `OnboardingWizard` container with step navigation
3. Implement `RoleSelectionStep` with premium role cards
4. Update OAuth redirect to `/onboarding/welcome`

### Phase 2: Profile Steps
1. Build `BasicProfileStep` with avatar upload
2. Implement `AboutYouStep` with conditional fields
3. Create `SkillSelector` component with predefined options
4. Add username validation (already exists)

### Phase 3: Preferences & Polish
1. Build `ConnectivityStep` for social links
2. Implement `PreferencesStep` with event category selector
3. Add skip functionality for optional steps
4. Implement progress persistence (save partial progress)

### Phase 4: Integration
1. Update `LoginForm` to check onboarding status
2. Connect wizard submission to Supabase
3. Update database trigger for new users
4. Add analytics tracking for funnel analysis

---

## Technical Specifications

### Wizard State Management
- Use React state with `useReducer` for step management
- Persist partial progress to `localStorage` with 24h expiry
- Save to database only on final submission

### Validation
- Zod schemas for each step
- Real-time username availability check
- Async validation on blur for URLs

### Animation
- Framer Motion for step transitions
- Staggered animations for cards and inputs
- Progress bar animation between steps

---

## Premium Aesthetic Guidelines

Following the project's modern, elite, and premium design aesthetic:

- **Glassmorphism**: Subtle backdrop blur on cards
- **Gradient accents**: Primary color gradients on active elements
- **Micro-animations**: Smooth hover states and transitions
- **Dark mode support**: Full theme compatibility
- **Typography**: Clean, hierarchical type scale
- **Spacing**: Generous whitespace, 8px grid system
