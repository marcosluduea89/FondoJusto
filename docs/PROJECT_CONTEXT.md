# Project Context

## Overview

FondoJusto is a mobile app for managing shared finances in a couple or household. It helps track income, shared expenses, personal money, investments, goals, reimbursements and monthly closings.

The app began as a local-first Expo/React Native MVP and now includes Supabase authentication, household membership, invitation codes, automatic cloud sync and Realtime updates between devices.

## Primary Users

- A couple or household sharing monthly finances.
- Each person can use a separate mobile device.
- Both devices can belong to the same Supabase household and see shared financial data.

## Main Features

- User registration and login with Supabase Auth.
- Household creation after login.
- Household invite codes for a second user/device.
- Dashboard with monthly financial summary.
- Income creation, editing and deletion.
- Expense creation, editing and deletion.
- Date selection through a visual calendar component.
- Monthly configuration:
  - investment percentage
  - goals percentage
  - personal money percentages
  - close day
  - estimated monthly income
  - basic basket amount
  - personal overage handling
- Goal tracking.
- Monthly close and reopen flow.
- Historical views and charts.
- Backup import/export.
- Automatic Supabase sync when a household exists.
- Supabase Realtime refresh for household data changes.

## Technology Stack

- Expo mobile app
- React Native
- TypeScript
- React Navigation bottom tabs
- AsyncStorage
- Supabase Auth, Postgres, RLS, RPC, Realtime
- `react-native-gifted-charts`
- `react-native-safe-area-context`

## Current Persistence Model

The app keeps a local cache in AsyncStorage and syncs household data to Supabase when a user is authenticated and associated with a household.

If Supabase has no household data yet, the app uploads local data automatically as the initial cloud state. After that, saves go to both local storage and Supabase.

## Environment

Local environment variables are expected in `.env`:

```text
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

The `.env` file is ignored by Git.

## Important Product Direction

The app is moving from local-first MVP toward shared household cloud sync. Future work should protect user data carefully and avoid surprising overwrites between devices.
