# Handoff

## Current Status

The project is a working Expo/React Native financial app for shared household finances. It currently supports Supabase login, household creation, invite codes for a second user and automatic Supabase sync with Realtime refresh.

The latest tested flow includes:

- creating/logging into a Supabase user
- confirming email
- creating a household
- generating an invite code
- joining the same household with another user/device
- automatic sync of financial data between devices

## Implemented

### App And UI

- Bottom-tab navigation with primary screens and secondary screens under `Mas`.
- Safe-area aware layout.
- Reusable UI components:
  - `Screen`
  - `Card`
  - `PrimaryButton`
  - `TextInputField`
  - `SegmentedControl`
  - `MonthSelector`
  - `DateSelector`
  - financial display components
- Calendar-style date selector for income and expense dates.

### Finance

- Dashboard monthly summary.
- Income CRUD.
- Expense CRUD.
- Reimbursement handling.
- Goals and goal allocation.
- Monthly configuration.
- Monthly close/reopen.
- Graph and history screens.
- Backup import/export.

### Auth And Household

- Supabase Auth via `AuthContext`.
- Login/register screen.
- Household setup screen.
- Household creation.
- Invite code generation.
- Join household by code.
- Sign out in `Ajustes`.
- Current user and household displayed in `Ajustes`.

### Sync

- AsyncStorage local cache.
- Supabase cloud repository.
- Automatic initial upload when household cloud data is empty.
- Automatic save to local and Supabase.
- Realtime reload subscriptions for household-scoped tables.

## Supabase Setup Done

The following scripts exist in the repo and have been run in Supabase during development:

- `supabase/household_invites.sql`
- `supabase/app_data_sync.sql`

Supabase users can be viewed in:

```text
Authentication -> Users
```

## Validation

Most recent validation:

```bash
npm run typecheck
```

Runtime sync was manually tested by the user with two accounts/household flow and reported working correctly.

## Known Gaps

- No automated tests are configured.
- No lint script is configured.
- Supabase migrations are manual SQL scripts, not automated migrations.
- Current Supabase save strategy deletes and reinserts most household rows, which is acceptable for early small household usage but not ideal for heavy concurrent editing.
- Conflict resolution is basic. Last save can effectively replace the household dataset.
- Realtime reloads the full household data after changes rather than applying row-level patches.
- Production packaging/release process is not documented yet.
- Supabase redirect URLs for email confirmation may still use default localhost behavior unless configured in Supabase.

## Recommended Next Steps

1. Add visible sync status in the UI:
   - loading from cloud
   - saved
   - sync error
2. Improve conflict safety:
   - move from full delete/reinsert saves toward per-entity upsert/delete operations.
3. Add basic tests for `finance.ts` calculations.
4. Add linting and formatting scripts.
5. Document Supabase setup from scratch in a dedicated setup guide if the project will be shared.
6. Review packaged Android build path with Expo/EAS before release.
7. Configure Supabase Auth redirect URLs/deep links for mobile confirmation flows.

## Important Files

- `App.tsx`
- `src/hooks/AuthContext.tsx`
- `src/hooks/HouseholdContext.tsx`
- `src/hooks/useAppData.ts`
- `src/storage/localRepository.ts`
- `src/storage/supabaseRepository.ts`
- `src/services/finance.ts`
- `src/services/supabase.ts`
- `supabase/household_invites.sql`
- `supabase/app_data_sync.sql`
