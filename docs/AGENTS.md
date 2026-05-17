# AGENTS

## Purpose

This document gives future AI/Codex agents the working rules for this repository. Keep changes consistent with the existing Expo + React Native TypeScript app and avoid introducing architecture that is not already present unless the user explicitly asks for it.

## Project Rules

- Preserve the current TypeScript-first structure under `src/`.
- Prefer existing reusable components in `src/components/` before creating new UI primitives.
- Keep financial calculations in `src/services/finance.ts` or focused utility modules. Screens should orchestrate UI and call hooks/services, not duplicate business math.
- Keep persistence behind repository-style modules in `src/storage/`.
- Keep Supabase access centralized in `src/services/supabase.ts` and `src/storage/supabaseRepository.ts`.
- Do not commit `.env`; it is ignored and contains local Supabase configuration.
- Run `npm run typecheck` before committing meaningful changes.

## Current Stack

- Expo 54 / React Native 0.81
- React 19
- TypeScript strict mode
- React Navigation bottom tabs
- AsyncStorage for local cache/persistence
- Supabase Auth, Postgres tables, RLS policies, RPC and Realtime
- `react-native-gifted-charts` for charts
- `react-native-safe-area-context` for safe-area layout

## Coding Conventions

- Use functional React components.
- Use hooks for shared state and cross-screen flows:
  - `AuthContext` for Supabase session.
  - `HouseholdContext` for current household and invite flow.
  - `AppDataContext` / `useAppData` for financial state.
- Keep domain entities typed in `src/models/`.
- Use camelCase in TypeScript models and snake_case when mapping Supabase rows.
- Keep Spanish UI copy consistent with the existing app.
- Keep comments short and useful; avoid restating obvious code.

## UI Guidelines

- Use `Screen`, `Card`, `PrimaryButton`, `TextInputField`, `SegmentedControl`, `MonthSelector`, and `DateSelector` where applicable.
- Respect safe areas. `App.tsx` wraps the app in `SafeAreaProvider`; `Screen` handles top safe area and `AppNavigator` handles bottom tabs.
- Maintain the current restrained financial-app style: light background, white cards, green primary action color, compact but readable layout.
- Avoid adding decorative UI that does not improve financial workflows.

## Data And Sync Guidelines

- `useAppData` is the central state point for screens.
- When a `householdId` exists, data is loaded from Supabase and saved to both AsyncStorage and Supabase.
- Local data is used as a cache/fallback and is automatically uploaded when the household cloud data is empty.
- Realtime subscriptions in `useAppData` reload cloud data for household-scoped table changes.
- Be careful with destructive sync changes: deleting and reinserting rows is currently used by `supabaseRepository.save`.
- Preserve `local_id` mappings because UI/domain IDs are local string IDs while Supabase rows use UUID primary keys.

## Supabase Guidelines

- RLS is required for all client-accessible tables.
- Store schema changes as SQL files under `supabase/`.
- Existing SQL files:
  - `supabase/household_invites.sql`
  - `supabase/app_data_sync.sql`
- Do not use or expose the Supabase service role key in the mobile app.
- The mobile app should only use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Verification

Minimum verification before handing work back:

```bash
npm run typecheck
```

For runtime validation, use Expo:

```bash
npx expo start -c --tunnel
```

## Known Constraints

- There is no test runner configured beyond TypeScript typechecking.
- There is no lint script configured.
- Supabase schema changes are manual SQL scripts, not an automated migration pipeline.
- The project is currently optimized for Android/Expo Go development; packaged release workflow is not documented in the repo yet.
