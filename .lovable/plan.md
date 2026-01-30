
# Workspace Team Member Status Case Normalization

## Executive Summary

This plan addresses a **critical data integrity and security issue** where the `status` column in `workspace_team_members` has mixed-case values (`'active'` and `'ACTIVE'`), causing RLS policy failures and inconsistent query results.

---

## Problem Analysis

### Current State

| Status Value | Row Count | Impact |
|--------------|-----------|--------|
| `'active'` (lowercase) | 22 rows | **Invisible to RLS** - blocked by security policies |
| `'ACTIVE'` (uppercase) | 3 rows | Works correctly |

### Root Cause

The database column defaults to `'ACTIVE'::text` but has no CHECK constraint to enforce case consistency. Historical code paths may have inserted lowercase values.

### Security Impact

The `is_workspace_member()` security function (used in RLS policies) only checks for uppercase:

```sql
SELECT EXISTS (
  SELECT 1 FROM workspace_team_members
  WHERE workspace_id = _workspace_id
  AND user_id = _user_id
  AND status = 'ACTIVE'  -- Only uppercase!
);
```

**Result:** 88% of members (22/25) with lowercase status are effectively locked out from RLS-protected workspace data.

---

## Files with Case Inconsistencies

### Querying lowercase `'active'` (2 files - causing data to be missed):

| File | Line | Issue |
|------|------|-------|
| `src/components/workspace/WorkspaceHierarchyTree.tsx` | 103 | `.eq('status', 'active')` |
| `src/hooks/useAllPendingApprovals.ts` | 53 | `.eq('status', 'active')` |

### Existing workaround (1 file):

| File | Line | Workaround |
|------|------|-----------|
| `src/hooks/useMemberDirectory.ts` | 61 | `.or('status.ilike.active,status.eq.ACTIVE')` |

### Correctly using uppercase `'ACTIVE'` (50+ files):

Most files correctly use uppercase, including all edge functions and the majority of hooks.

---

## Solution Overview

### Phase 1: Database Migration

1. Normalize existing data to uppercase
2. Add CHECK constraint to prevent future inconsistencies
3. Update the RLS helper function to be case-insensitive (defensive)

### Phase 2: Code Updates

1. Fix `WorkspaceHierarchyTree.tsx` - change to uppercase
2. Fix `useAllPendingApprovals.ts` - change to uppercase
3. Remove workaround from `useMemberDirectory.ts` - simplify to uppercase only

---

## Technical Implementation

### Database Migration

```sql
-- 1. Normalize all existing status values to uppercase
UPDATE workspace_team_members
SET status = 'ACTIVE'
WHERE status = 'active';

-- 2. Add CHECK constraint to enforce uppercase values going forward
ALTER TABLE workspace_team_members
ADD CONSTRAINT workspace_team_members_status_check
CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'));

-- 3. (Defensive) Update RLS function to be case-insensitive
CREATE OR REPLACE FUNCTION public.is_workspace_member(
  _workspace_id UUID,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_team_members
    WHERE workspace_id = _workspace_id
    AND user_id = _user_id
    AND UPPER(status) = 'ACTIVE'
  );
$$;
```

### Code Changes

**File 1: `src/components/workspace/WorkspaceHierarchyTree.tsx` (line 103)**

```diff
-        .eq('status', 'active');
+        .eq('status', 'ACTIVE');
```

**File 2: `src/hooks/useAllPendingApprovals.ts` (line 53)**

```diff
-        .eq('status', 'active');
+        .eq('status', 'ACTIVE');
```

**File 3: `src/hooks/useMemberDirectory.ts` (line 61)**

```diff
-        .or('status.ilike.active,status.eq.ACTIVE');
+        .eq('status', 'ACTIVE');
```

---

## Validation Steps

1. **Pre-migration**: Confirm current state
   ```sql
   SELECT status, COUNT(*) FROM workspace_team_members GROUP BY status;
   ```
   
2. **Post-migration**: Verify normalization
   ```sql
   SELECT status, COUNT(*) FROM workspace_team_members GROUP BY status;
   -- Expected: Only 'ACTIVE' (25 rows)
   ```

3. **Constraint test**: Attempt lowercase insert (should fail)
   ```sql
   INSERT INTO workspace_team_members (workspace_id, user_id, role, status)
   VALUES ('...', '...', 'VOLUNTEER_COORDINATOR', 'active');
   -- Expected: CHECK constraint violation
   ```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | High | `UPDATE` only changes existing rows, no deletions |
| Application downtime | Low | Medium | Migration is atomic, code changes are non-breaking |
| Future lowercase inserts | Low | Low | CHECK constraint prevents this |
| Edge function compatibility | None | - | All edge functions already use uppercase |

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/migrations/YYYYMMDD_*.sql` | Create | Data normalization + CHECK constraint |
| `src/components/workspace/WorkspaceHierarchyTree.tsx` | Edit | Line 103: `'active'` → `'ACTIVE'` |
| `src/hooks/useAllPendingApprovals.ts` | Edit | Line 53: `'active'` → `'ACTIVE'` |
| `src/hooks/useMemberDirectory.ts` | Edit | Line 61: Simplify `.or()` to `.eq()` |

---

## Testing Checklist

- [ ] Run migration against test database
- [ ] Verify all 25 rows have `status = 'ACTIVE'`
- [ ] Test workspace hierarchy tree displays all members
- [ ] Test pending approvals shows correct workspaces
- [ ] Test member directory no longer needs `.or()` workaround
- [ ] Attempt to insert lowercase status value (should fail)
- [ ] Verify RLS policies work correctly for all members
