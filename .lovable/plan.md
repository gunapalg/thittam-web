
# Comprehensive Event Form Features - Industrial Best Practice Implementation Plan

## Executive Summary

This plan addresses gaps identified through in-depth analysis of the event form system, covering **Security**, **URL Navigation & Deep Linking**, **Accessibility**, **Responsiveness**, **Optimistic Updates**, **Code Quality**, **Error Handling**, and **Missing Workflows**.

---

## Current State Assessment

### Event Form Architecture Overview

The event form is well-modularized with:

| Component Layer | Files | Status |
|-----------------|-------|--------|
| Main Orchestrator | `EventFormPage.tsx` (~376 lines) | Well-structured |
| Sections | 9 section components | Modular and reusable |
| Hooks | 4 specialized hooks | Good separation of concerns |
| Types | Centralized in `types/` | Type-safe |
| Utils | Payload builders, defaults | Clean utilities |

### Current Strengths

- Comprehensive Zod validation schema with cross-field validation
- Draft auto-save with local + server sync
- Section progress indicator with visual feedback
- Keyboard shortcuts (Ctrl+S save, Escape cancel)
- Unsaved changes warning (browser beforeunload)
- Conditional sections (venue/virtual based on mode)
- Form state management hook (`useEventFormState`)

### Identified Gaps

| Area | Gap | Impact |
|------|-----|--------|
| Deep Linking | No URL params for section navigation | Cannot share link to specific form section |
| Accessibility | No `LiveRegion` for form feedback | Screen readers miss validation errors |
| Error Boundaries | None around sections | Section crash takes down entire form |
| Optimistic Updates | Submit hook lacks `onMutate` | No instant feedback on save |
| Touch Targets | Not explicitly enforced | Mobile usability concerns |
| Mobile UX | No responsive dialogs/drawers | Poor mobile form experience |
| Draft Sync Status | Not visible to user | User doesn't know server sync state |

---

## Phase 1: URL Navigation & Deep Linking

### Current State

The form uses in-memory section state:
```typescript
const [openSections, setOpenSections] = useState<SectionState>(getInitialSectionState());
```

Sections are navigated via DOM scrolling:
```typescript
const el = document.getElementById(`section-${sectionId}`);
el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
```

### Enhancement

Add URL hash support for section deep linking:

```text
/:orgSlug/eventmanagement/create#section-schedule
/:orgSlug/eventmanagement/:eventId/edit#section-branding
```

**Files to Modify:**
- `src/components/events/form/EventFormPage.tsx` - Add `useLocation` hash parsing
- `src/components/events/form/hooks/useEventFormState.ts` - Sync section state with URL hash

**Implementation:**
```typescript
// Parse hash on mount
useEffect(() => {
  const hash = location.hash.replace('#section-', '');
  if (hash && openSections.hasOwnProperty(hash)) {
    setOpenSections(prev => ({ ...prev, [hash]: true }));
    setTimeout(() => {
      document.getElementById(`section-${hash}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
}, [location.hash]);

// Update hash on section toggle
const toggleSection = useCallback((section: keyof SectionState) => {
  setOpenSections(prev => {
    const newState = { ...prev, [section]: !prev[section] };
    if (newState[section]) {
      window.history.replaceState(null, '', `#section-${section}`);
    }
    return newState;
  });
}, []);
```

---

## Phase 2: Accessibility Enhancements

### Current Gaps

1. **No LiveRegion** for form validation announcements
2. **No focus management** after section toggle
3. **Touch targets** not explicitly 44px minimum

### Implementation

**2.1 Add LiveRegion for Form Feedback**

```typescript
// In EventFormPage.tsx
import { LiveRegion, useLiveAnnouncement } from '@/components/accessibility/LiveRegion';

const { announcement, announce } = useLiveAnnouncement();

// Announce validation errors
useEffect(() => {
  const errorCount = Object.keys(formState.errors).length;
  if (errorCount > 0 && formState.isSubmitted) {
    announce(`Form has ${errorCount} validation error${errorCount > 1 ? 's' : ''}. Please review highlighted fields.`);
  }
}, [formState.errors, formState.isSubmitted, announce]);

// In JSX
<LiveRegion message={announcement} priority="assertive" />
```

**2.2 Add Focus Management for Sections**

```typescript
const toggleSection = useCallback((section: keyof SectionState) => {
  setOpenSections(prev => {
    const isOpening = !prev[section];
    if (isOpening) {
      // Focus first input in section after animation
      setTimeout(() => {
        const sectionEl = document.getElementById(`section-${section}`);
        const firstInput = sectionEl?.querySelector('input, select, textarea');
        (firstInput as HTMLElement)?.focus();
      }, 300);
    }
    return { ...prev, [section]: !prev[section] };
  });
}, []);
```

**2.3 Add ARIA Labels to Section Headers**

```typescript
// In SectionComponents.tsx - SectionHeader
<button
  type="button"
  className="w-full hover:bg-muted/30 transition-colors"
  aria-expanded={isOpen}
  aria-controls={`section-content-${sectionId}`}
  aria-label={`${title} section, ${isOpen ? 'expanded' : 'collapsed'}, step ${stepNumber}`}
>
```

**2.4 Enforce Touch Targets**

Update button/input classes in sections:
```typescript
className="h-11 min-h-[44px] min-w-[44px]"
```

**Files to Modify:**
- `src/components/events/form/EventFormPage.tsx`
- `src/components/events/form/SectionComponents.tsx`
- `src/components/events/form/SectionProgressIndicator.tsx`
- All section components (touch target enforcement)

---

## Phase 3: Error Boundaries for Sections

### Current State

No error boundaries exist in the form. A crash in any section (e.g., rich text editor) crashes the entire form.

### Implementation

Wrap each section with `SectionErrorBoundary`:

```typescript
// In EventFormPage.tsx
import { SectionErrorBoundary } from '@/components/events/shared/SectionErrorBoundary';

<div id="section-basic">
  <SectionErrorBoundary sectionName="Basic Info">
    <BasicInfoSection
      form={form}
      isOpen={openSections.basic}
      onToggle={() => toggleSection('basic')}
      // ...
    />
  </SectionErrorBoundary>
</div>
```

**Files to Modify:**
- `src/components/events/form/EventFormPage.tsx` - Wrap all 9 sections

---

## Phase 4: Optimistic Submit Feedback

### Current State

The submit hook sets `isSubmitting` but lacks optimistic UI patterns:
```typescript
setIsSubmitting(true);
// ... API call
setIsSubmitting(false);
```

### Enhancement

Add optimistic feedback with rollback on error:

```typescript
// In useEventFormSubmit.ts
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const onSubmit = useCallback(async (values: EventFormValues) => {
  setServerError(null);
  setIsSubmitting(true);
  
  // Optimistic: Show success toast immediately with undo option
  const optimisticToastId = toast({
    title: mode === 'create' ? 'Creating event...' : 'Saving changes...',
    description: 'This will only take a moment',
  });

  try {
    // ... existing API logic

    // Success: Update toast
    toast.dismiss(optimisticToastId);
    toast({
      title: mode === 'create' ? 'Event created!' : 'Changes saved!',
      description: 'Redirecting...',
    });

    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: eventQueryKeys.lists() });
    
    // Navigate after success
    // ...
    
    return { success: true, eventId: createdEventId || eventId };
  } catch (err) {
    // Rollback: Update toast with error
    toast.dismiss(optimisticToastId);
    // ... error handling
  }
}, [/* deps */]);
```

**Files to Modify:**
- `src/components/events/form/hooks/useEventFormSubmit.ts`

---

## Phase 5: Draft Sync Status UI Enhancement

### Current State

`useEventDraft` tracks `syncStatus` but only `isSaving` and `lastSaved` are exposed in the UI.

### Enhancement

Show server sync status in `DraftStatusIndicator`:

```typescript
// DraftStatusIndicator.tsx
interface DraftStatusIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  className?: string;
}

// Add sync status indicator
{syncStatus === 'synced' && (
  <CloudCheck className="h-3.5 w-3.5 text-green-500" />
)}
{syncStatus === 'error' && (
  <CloudOff className="h-3.5 w-3.5 text-amber-500" />
)}
```

**Files to Modify:**
- `src/components/events/form/DraftStatusIndicator.tsx`
- `src/components/events/form/EventFormHeader.tsx` - Pass syncStatus prop

---

## Phase 6: Mobile Responsiveness Enhancements

### Current State

Form sections use responsive grids (`grid-cols-1 gap-6 md:grid-cols-2`) but:
- Header/actions are not optimized for small screens
- No mobile drawer pattern for complex inputs
- DateTime picker may be cramped

### Enhancement

**6.1 Mobile-Optimized Form Header**

```typescript
// EventFormHeader.tsx
<div className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-sm">
  <div className="mx-auto max-w-4xl px-4 py-3 sm:py-4 sm:px-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between sm:block">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{pageTitle}</h1>
        {/* Show draft status inline on mobile */}
        <div className="sm:hidden">
          <DraftStatusIndicator compact {...draftProps} />
        </div>
      </div>
      {/* Desktop draft status */}
      <div className="hidden sm:flex items-center gap-3">
        <DraftStatusIndicator {...draftProps} />
        <SectionProgressIndicator sections={sectionProgress} />
      </div>
    </div>
    {/* Mobile progress indicator - horizontal scroll */}
    <div className="sm:hidden mt-3 -mx-4 px-4 overflow-x-auto">
      <SectionProgressIndicator sections={sectionProgress} compact />
    </div>
  </div>
</div>
```

**6.2 Mobile-Friendly Form Actions**

```typescript
// EventFormActions.tsx - sticky bottom bar
<div className="fixed bottom-0 left-0 right-0 sm:relative sm:sticky sm:bottom-0 bg-card/95 backdrop-blur-sm border-t border-border/50 p-3 sm:p-4 safe-area-inset-bottom">
  <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
    <Button 
      type="button" 
      variant="ghost" 
      onClick={onCancel}
      className="flex-1 sm:flex-none h-11 min-h-[44px]"
    >
      Cancel
    </Button>
    <Button 
      type="submit" 
      disabled={isSubmitting} 
      className="flex-1 sm:flex-none h-11 min-h-[44px] min-w-[120px]"
    >
      {/* ... */}
    </Button>
  </div>
</div>
```

**Files to Modify:**
- `src/components/events/form/EventFormHeader.tsx`
- `src/components/events/form/EventFormActions.tsx`
- `src/components/events/form/SectionProgressIndicator.tsx` - Add `compact` prop

---

## Phase 7: Missing Workflow Integration

### Current State

After event creation, the user is navigated to workspace creation:
```typescript
navigate(`${basePath}/events/new/${createdEventId}/workspaces`, { replace: true });
```

However:
- No link back to edit event from workspace
- No "continue editing" option after quick save

### Enhancement

**7.1 Add Post-Creation Options Dialog**

```typescript
// Create new component: PostCreateOptionsDialog.tsx
interface PostCreateOptionsDialogProps {
  open: boolean;
  eventId: string;
  onContinueEditing: () => void;
  onCreateWorkspace: () => void;
  onViewEvent: () => void;
}

// Show after successful create
<PostCreateOptionsDialog
  open={showPostCreate}
  eventId={createdEventId}
  onContinueEditing={() => {
    setShowPostCreate(false);
    // Stay on edit mode
  }}
  onCreateWorkspace={() => {
    setShowPostCreate(false);
    navigate(`${basePath}/events/new/${createdEventId}/workspaces`);
  }}
  onViewEvent={() => {
    setShowPostCreate(false);
    navigate(`/event/${eventSlug}`);
  }}
/>
```

**Files to Create:**
- `src/components/events/form/PostCreateOptionsDialog.tsx`

**Files to Modify:**
- `src/components/events/form/hooks/useEventFormSubmit.ts`
- `src/components/events/form/EventFormPage.tsx`

---

## Phase 8: Real-Time Validation Enhancement

### Current State

`useFormValidation` hook exists but is not integrated into the form. Validation only runs on submit.

### Enhancement

Integrate real-time validation for key fields:

```typescript
// In BasicInfoSection.tsx
const { validateFieldRealtime, getFieldState } = useFormValidation({
  debounceMs: 300,
  realtimeFields: ['name', 'customSlug'],
});

// On field change
<Input
  {...field}
  onChange={(e) => {
    field.onChange(e);
    validateFieldRealtime('name', e.target.value);
  }}
  onBlur={(e) => {
    field.onBlur();
    validateFieldRealtime('name', e.target.value, true);
  }}
/>

// Show validation state icon
{getFieldState('name').state === 'valid' && <CheckCircle className="text-green-500" />}
{getFieldState('name').state === 'invalid' && <AlertCircle className="text-destructive" />}
```

**Files to Modify:**
- `src/components/events/form/sections/BasicInfoSection.tsx`
- `src/hooks/useFormValidation.ts` - Enhance with field-level validation

---

## Phase 9: Query Key Factory Integration

### Current State

The form submit/load hooks use inline query invalidation. The centralized `eventQueryKeys` factory exists but is not used in form hooks.

### Enhancement

```typescript
// In useEventFormSubmit.ts
import { eventQueryKeys } from '@/lib/query-keys/events';

// After successful create/update
queryClient.invalidateQueries({ queryKey: eventQueryKeys.lists() });
queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) });
```

**Files to Modify:**
- `src/components/events/form/hooks/useEventFormSubmit.ts`
- `src/components/events/form/hooks/useEventFormLoader.ts`

---

## Phase 10: Security Audit for Form Inputs

### Current State

Form uses Zod validation with proper sanitization (`.trim()`), but:
- RichTextEditor uses `dangerouslySetInnerHTML` (needs review)
- Image URLs are passed without validation
- No CSRF protection on form submission

### Enhancement

**10.1 Sanitize RichText Output**

```typescript
// In RichTextEditor or where content is rendered
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(htmlContent, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
});
```

**10.2 Validate Image URLs**

```typescript
// In eventFormSchema
logoUrl: z.string()
  .optional()
  .refine(
    val => !val || val.startsWith('https://') || val.startsWith('data:image'),
    { message: 'Image URL must use HTTPS' }
  ),
```

**Files to Modify:**
- `src/lib/event-form-schema.ts` - Add URL scheme validation
- `src/components/ui/rich-text-editor.tsx` - Add DOMPurify sanitization

---

## Implementation Priority Matrix

| Phase | Priority | Effort | Impact | Dependencies |
|-------|----------|--------|--------|--------------|
| 1. URL Deep Linking | High | Low | Medium | None |
| 2. Accessibility | High | Medium | High | None |
| 3. Error Boundaries | High | Low | High | SectionErrorBoundary exists |
| 4. Optimistic Submit | Medium | Low | High | Query keys |
| 5. Draft Sync UI | Medium | Low | Medium | None |
| 6. Mobile Responsiveness | Medium | Medium | Medium | None |
| 7. Workflow Integration | Low | Medium | Medium | None |
| 8. Real-Time Validation | Low | Medium | Medium | useFormValidation hook |
| 9. Query Key Integration | Low | Low | Low | eventQueryKeys exists |
| 10. Security Audit | High | Medium | High | DOMPurify package |

---

## Files Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/events/form/EventFormPage.tsx` | URL hash, LiveRegion, ErrorBoundaries, PostCreate dialog |
| `src/components/events/form/hooks/useEventFormState.ts` | URL hash sync, focus management |
| `src/components/events/form/hooks/useEventFormSubmit.ts` | Optimistic updates, query invalidation |
| `src/components/events/form/SectionComponents.tsx` | ARIA labels, touch targets |
| `src/components/events/form/SectionProgressIndicator.tsx` | Compact mode, ARIA |
| `src/components/events/form/DraftStatusIndicator.tsx` | Sync status, compact mode |
| `src/components/events/form/EventFormHeader.tsx` | Mobile layout, sync status prop |
| `src/components/events/form/EventFormActions.tsx` | Mobile sticky, touch targets |
| `src/components/events/form/sections/BasicInfoSection.tsx` | Real-time validation, touch targets |
| `src/lib/event-form-schema.ts` | URL scheme validation |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/events/form/PostCreateOptionsDialog.tsx` | Post-creation action chooser |

---

## Testing Checklist

### Manual Testing

- [ ] Deep link to specific section (e.g., `#section-branding`)
- [ ] Screen reader announces validation errors
- [ ] Focus moves to first input when section opens
- [ ] Section crash is isolated (other sections still work)
- [ ] Draft sync status visible in header
- [ ] Form usable on 375px mobile width
- [ ] Touch targets are 44px minimum
- [ ] Submit shows optimistic feedback
- [ ] Cancel button triggers unsaved changes dialog

### Accessibility Testing

- [ ] Navigate entire form with keyboard only
- [ ] VoiceOver/NVDA announces section states
- [ ] Error messages are announced
- [ ] Focus is managed correctly

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| URL-preserved form state | 0% | 100% (section hash) |
| LiveRegion announcements | 0 | All validation errors |
| Error boundary coverage | 0% | 100% (all 9 sections) |
| Touch target compliance | ~60% | 100% |
| Mobile usability score | ~70% | 95%+ |
| Accessibility score | ~75% | 95%+ |
