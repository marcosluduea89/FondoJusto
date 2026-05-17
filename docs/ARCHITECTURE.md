# Architecture

## Runtime Architecture

FondoJusto is an Expo/React Native mobile application. It does not include a custom backend server in this repository. Backend capabilities are provided by Supabase.

```text
Mobile App
  |
  |-- Supabase JS client
  |
Supabase
  |-- Auth
  |-- Postgres tables
  |-- Row Level Security policies
  |-- RPC function for joining households
  |-- Realtime publications
```

## Application Entry

`App.tsx` wraps the app with:

- `SafeAreaProvider`
- `AuthProvider`
- conditional root flow:
  - unauthenticated users see `AuthScreen`
  - authenticated users without household see `HouseholdSetupScreen`
  - authenticated users with household enter `AppNavigator`

## Navigation

Main navigation is implemented in `src/navigation/AppNavigator.tsx` using bottom tabs.

Visible primary tabs:

- Inicio
- Ingreso
- Gasto
- Ajustes
- Mas

Secondary screens are registered as hidden tabs and opened from `MoreScreen`.

Navigation route types live in `src/navigation/types.ts`.

## State Management

There is no external state management library. State is organized through React context and hooks:

- `src/hooks/AuthContext.tsx`
  - Supabase session
  - sign in
  - sign up
  - sign out
- `src/hooks/HouseholdContext.tsx`
  - current household
  - household creation
  - invite code generation
  - join household through Supabase RPC
- `src/hooks/AppDataContext.tsx`
  - provides the financial data API to screens
- `src/hooks/useAppData.ts`
  - central financial state
  - local/cloud loading
  - automatic persistence
  - monthly auto-close flow
  - Realtime reload subscriptions

## Domain Models

Domain models are in `src/models/`:

- `AppData`
- `Income`
- `Expense`
- `Reimbursement`
- `Goal`
- `MonthlyConfig`
- `MonthlyClose`
- `MonthState`
- `Person`

TypeScript models use camelCase. Supabase columns use snake_case and are mapped in `src/storage/supabaseRepository.ts`.

## Persistence

### Local

`src/storage/localRepository.ts` stores the full `AppData` JSON in AsyncStorage. It also normalizes missing fields and seeds initial demo data from `src/storage/seedData.ts`.

### Supabase

`src/storage/supabaseRepository.ts` maps full `AppData` to Supabase tables and back.

Current behavior:

- Load local data first as fallback.
- If `householdId` exists, load cloud data from Supabase.
- If cloud data is empty, upload local data to Supabase.
- On any app data change, save to AsyncStorage and Supabase.
- Subscribe to household table changes through Supabase Realtime and reload cloud data.

The current cloud save strategy deletes and reinserts household-scoped rows for most tables. This is simple and reliable for early small-scale usage, but should be revisited before large-scale or high-concurrency usage.

## Supabase Schema

Schema setup is documented as SQL files under `supabase/`:

- `household_invites.sql`
  - `household_invites`
  - `join_household(invite_code text)`
  - invite RLS policies
- `app_data_sync.sql`
  - `household_people`
  - added reimbursement compatibility columns
  - unique constraints for `(household_id, local_id)`
  - Realtime publication setup

Core tables created earlier in Supabase include:

- `households`
- `household_members`
- `profiles`
- `app_settings`
- `incomes`
- `expenses`
- `reimbursements`
- `goals`
- `monthly_configs`
- `monthly_closes`
- `month_states`

## Authentication And Authorization

- Auth is handled by Supabase Auth.
- The app uses the publishable/anon key only.
- Row Level Security protects household data.
- Users can only read/write rows for households where they are members.
- A user joins a household by entering an invite code; the RPC function inserts the membership server-side.

Supabase users can be inspected in the Supabase dashboard under:

```text
Authentication -> Users
```

## Business Logic

Financial calculations are centralized in `src/services/finance.ts`, including:

- monthly summary
- personal money availability
- investment allocation
- goal allocation
- reimbursements
- month closing
- daily/monthly chart evolution helpers

Backup JSON parsing/building is in `src/services/backup.ts`.

## Deployment And Development

Development is Expo-based:

```bash
npm install
npm run start
npm run android
npm run typecheck
```

Expo tunnel has been useful when LAN fails:

```bash
npx expo start -c --tunnel
```

No production build/deployment pipeline is currently defined in the repository.
