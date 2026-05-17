import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppData, Expense, Goal, Income, MonthlyConfig, MonthState, PersonId } from "../models";
import { closeMonth } from "../services/finance";
import { supabase } from "../services/supabase";
import { localRepository } from "../storage/localRepository";
import { createSupabaseRepository } from "../storage/supabaseRepository";
import { getCurrentMonthKey, isFutureMonth } from "../utils/dates";

interface UseAppDataResult {
  data: AppData | null;
  isLoading: boolean;
  syncStatus: SyncStatus;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  addIncome: (income: Income) => Promise<void>;
  updateIncome: (income: Income) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  updatePersonName: (personId: PersonId, name: string) => Promise<void>;
  updatePersonNames: (names: Partial<Record<PersonId, string>>) => Promise<void>;
  saveMonthlyConfig: (config: MonthlyConfig) => Promise<void>;
  saveGoals: (goals: Goal[]) => Promise<void>;
  saveAppSettings: (
    closeDay: number,
    discountPersonalOverages: boolean,
    estimatedMonthlyIncome: number,
    basicBasketAmount: number
  ) => Promise<void>;
  performMonthlyClose: (month: string) => Promise<void>;
  reopenMonth: (month: string) => Promise<void>;
  importData: (nextData: AppData) => Promise<void>;
  resetDemoData: () => Promise<void>;
  getMonthStatus: (month: string) => MonthState["status"];
}

export type SyncState = "idle" | "loading" | "saving" | "synced" | "error";

export interface SyncStatus {
  state: SyncState;
  isCloudEnabled: boolean;
  lastUpdatedAt: string | null;
  errorMessage: string | null;
}

// Hook central de estado: las pantallas leen y escriben datos desde un unico punto.
export function useAppData(householdId?: string): UseAppDataResult {
  const [data, setData] = useState<AppData | null>(null);
  const dataRef = useRef<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: householdId ? "loading" : "idle",
    isCloudEnabled: Boolean(householdId),
    lastUpdatedAt: null,
    errorMessage: null
  });
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const autoClosuresApplied = useRef(false);
  const realtimeReloadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateDataState = useCallback((nextData: AppData) => {
    dataRef.current = nextData;
    setData(nextData);
  }, []);

  function shouldAutoCloseMonth(month: string, closeDay: number): boolean {
    const today = new Date();
    const currentMonth = getCurrentMonthKey();

    if (month < currentMonth) {
      return true;
    }

    return today.getDate() >= closeDay;
  }

  const persist = useCallback(
    async (nextData: AppData) => {
      updateDataState(nextData);
      setSyncStatus((current) => ({
        ...current,
        state: householdId ? "saving" : "synced",
        isCloudEnabled: Boolean(householdId),
        errorMessage: null
      }));

      try {
        await localRepository.save(nextData);

        if (householdId) {
          await createSupabaseRepository(householdId).save(nextData);
        }

        setSyncStatus({
          state: "synced",
          isCloudEnabled: Boolean(householdId),
          lastUpdatedAt: new Date().toISOString(),
          errorMessage: null
        });
      } catch (error) {
        setSyncStatus((current) => ({
          ...current,
          state: "error",
          isCloudEnabled: Boolean(householdId),
          errorMessage: error instanceof Error ? error.message : "No se pudo sincronizar."
        }));
      }
    },
    [householdId, updateDataState]
  );

  const persistEntityChange = useCallback(
    async (nextData: AppData, saveEntity: (repository: ReturnType<typeof createSupabaseRepository>) => Promise<void>) => {
      updateDataState(nextData);
      setSyncStatus((current) => ({
        ...current,
        state: householdId ? "saving" : "synced",
        isCloudEnabled: Boolean(householdId),
        errorMessage: null
      }));

      try {
        await localRepository.save(nextData);

        if (householdId) {
          await saveEntity(createSupabaseRepository(householdId));
        }

        setSyncStatus({
          state: "synced",
          isCloudEnabled: Boolean(householdId),
          lastUpdatedAt: new Date().toISOString(),
          errorMessage: null
        });
      } catch (error) {
        setSyncStatus((current) => ({
          ...current,
          state: "error",
          isCloudEnabled: Boolean(householdId),
          errorMessage: error instanceof Error ? error.message : "No se pudo sincronizar."
        }));
      }
    },
    [householdId, updateDataState]
  );

  const applyAutomaticClosures = useCallback(
    async (currentData: AppData) => {
      const closeDay = currentData.appSettings?.closeDay ?? 31;
      const allMonths = new Set<string>([
        ...currentData.incomes.map((income) => income.month),
        ...currentData.expenses.map((expense) => expense.month),
        ...currentData.reimbursements.map((reimbursement) => reimbursement.targetMonth),
        ...currentData.monthStates.map((state) => state.month),
        ...currentData.monthlyCloses.map((close) => close.month)
      ]);

      const monthsToClose = Array.from(allMonths)
        .filter((month) => !isFutureMonth(month))
        .filter((month) => {
          const status = currentData.monthStates.find((state) => state.month === month)?.status ?? "open";
          return status === "open";
        })
        .filter((month) => shouldAutoCloseMonth(month, closeDay))
        .sort();

      if (!monthsToClose.length) {
        return;
      }

      let updatedData = currentData;

      for (const month of monthsToClose) {
        const result = closeMonth(updatedData, month);
        const closesWithoutMonth = updatedData.monthlyCloses.filter((close) => close.month !== month);

        updatedData = {
          ...updatedData,
          reimbursements: result.reimbursements,
          monthlyCloses: [...closesWithoutMonth, result.close],
          monthStates: [
            ...updatedData.monthStates.filter((state) => state.month !== month),
            { month, status: "closed" as const, closedAt: new Date().toISOString() }
          ]
        };
      }

      await persist(updatedData);
    },
    [persist]
  );

  useEffect(() => {
    setIsLoading(true);
    setSyncStatus((current) => ({
      ...current,
      state: householdId ? "loading" : "idle",
      isCloudEnabled: Boolean(householdId),
      errorMessage: null
    }));
    autoClosuresApplied.current = false;

    localRepository.load().then(async (localData) => {
      try {
        const loadedData = householdId
          ? (await createSupabaseRepository(householdId).load(localData)).data
          : localData;

        await localRepository.save(loadedData);
        updateDataState(loadedData);
        setSyncStatus({
          state: "synced",
          isCloudEnabled: Boolean(householdId),
          lastUpdatedAt: new Date().toISOString(),
          errorMessage: null
        });
        setIsLoading(false);
        if (!autoClosuresApplied.current) {
          autoClosuresApplied.current = true;
          await applyAutomaticClosures(loadedData);
        }
      } catch (error) {
        updateDataState(localData);
        setSyncStatus((current) => ({
          ...current,
          state: "error",
          isCloudEnabled: Boolean(householdId),
          errorMessage: error instanceof Error ? error.message : "No se pudo cargar la nube."
        }));
        setIsLoading(false);
      }
    });
  }, [applyAutomaticClosures, householdId, updateDataState]);

  useEffect(() => {
    if (!householdId) return;

    const reloadFromCloud = () => {
      if (realtimeReloadTimeout.current) {
        clearTimeout(realtimeReloadTimeout.current);
      }

      realtimeReloadTimeout.current = setTimeout(() => {
        setSyncStatus((current) => ({
          ...current,
          state: "loading",
          isCloudEnabled: true,
          errorMessage: null
        }));
        localRepository.load().then(async (localData) => {
          try {
            const cloudData = (await createSupabaseRepository(householdId).load(localData)).data;
            await localRepository.save(cloudData);
            updateDataState(cloudData);
            setSyncStatus({
              state: "synced",
              isCloudEnabled: true,
              lastUpdatedAt: new Date().toISOString(),
              errorMessage: null
            });
          } catch (error) {
            setSyncStatus((current) => ({
              ...current,
              state: "error",
              isCloudEnabled: true,
              errorMessage: error instanceof Error ? error.message : "No se pudo actualizar desde la nube."
            }));
          }
        });
      }, 500);
    };

    const channel = supabase.channel(`household-sync-${householdId}`);
    [
      "household_people",
      "incomes",
      "expenses",
      "reimbursements",
      "goals",
      "monthly_configs",
      "monthly_closes",
      "month_states",
      "app_settings"
    ].forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `household_id=eq.${householdId}` },
        reloadFromCloud
      );
    });

    channel.subscribe();

    return () => {
      if (realtimeReloadTimeout.current) {
        clearTimeout(realtimeReloadTimeout.current);
      }
      supabase.removeChannel(channel);
    };
  }, [householdId, updateDataState]);

  const addIncome = useCallback(
    async (income: Income) => {
      const currentData = dataRef.current;
      if (!currentData) return;
      await persistEntityChange({ ...currentData, incomes: [...currentData.incomes, income] }, (repository) =>
        repository.upsertIncome(income)
      );
    },
    [persistEntityChange]
  );

  const updateIncome = useCallback(
    async (income: Income) => {
      const currentData = dataRef.current;
      if (!currentData) return;
      await persistEntityChange(
        {
          ...currentData,
          incomes: currentData.incomes.map((item) => (item.id === income.id ? income : item))
        },
        (repository) => repository.upsertIncome(income)
      );
    },
    [persistEntityChange]
  );

  const deleteIncome = useCallback(
    async (incomeId: string) => {
      const currentData = dataRef.current;
      if (!currentData) return;
      await persistEntityChange(
        { ...currentData, incomes: currentData.incomes.filter((income) => income.id !== incomeId) },
        (repository) => repository.deleteIncome(incomeId)
      );
    },
    [persistEntityChange]
  );

  const addExpense = useCallback(
    async (expense: Expense) => {
      const currentData = dataRef.current;
      if (!currentData) return;
      await persistEntityChange({ ...currentData, expenses: [...currentData.expenses, expense] }, (repository) =>
        repository.upsertExpense(expense)
      );
    },
    [persistEntityChange]
  );

  const updateExpense = useCallback(
    async (expense: Expense) => {
      const currentData = dataRef.current;
      if (!currentData) return;
      await persistEntityChange(
        {
          ...currentData,
          expenses: currentData.expenses.map((item) => (item.id === expense.id ? expense : item))
        },
        (repository) => repository.upsertExpense(expense)
      );
    },
    [persistEntityChange]
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      const currentData = dataRef.current;
      if (!currentData) return;
      await persistEntityChange(
        {
          ...currentData,
          expenses: currentData.expenses.filter((expense) => expense.id !== expenseId),
          reimbursements: currentData.reimbursements.filter((reimbursement) => reimbursement.originalExpenseId !== expenseId)
        },
        (repository) => repository.deleteExpense(expenseId)
      );
    },
    [persistEntityChange]
  );

  const updatePersonName = useCallback(
    async (personId: PersonId, name: string) => {
      const currentData = dataRef.current;
      if (!currentData) return;
      const people = currentData.people.map((person) =>
        person.id === personId ? { ...person, name: name.trim() || person.name } : person
      );

      await persistEntityChange({ ...currentData, people }, (repository) => repository.upsertPeople(people));
    },
    [persistEntityChange]
  );

  const updatePersonNames = useCallback(
    async (names: Partial<Record<PersonId, string>>) => {
      const currentData = dataRef.current;
      if (!currentData) return;
      const people = currentData.people.map((person) => ({
        ...person,
        name: names[person.id]?.trim() || person.name
      }));

      await persistEntityChange({ ...currentData, people }, (repository) => repository.upsertPeople(people));
    },
    [persistEntityChange]
  );

  const saveMonthlyConfig = useCallback(
    async (config: MonthlyConfig) => {
      const currentData = dataRef.current;
      if (!currentData) return;

      const otherConfigs = currentData.monthlyConfigs.filter((item) => item.month !== config.month);
      await persistEntityChange({ ...currentData, monthlyConfigs: [...otherConfigs, config] }, (repository) =>
        repository.upsertMonthlyConfig(config)
      );
    },
    [persistEntityChange]
  );

  const saveGoals = useCallback(
    async (goals: Goal[]) => {
      const currentData = dataRef.current;
      if (!currentData) return;

      await persistEntityChange({ ...currentData, goals }, (repository) => repository.upsertGoals(goals));
    },
    [persistEntityChange]
  );

  const saveAppSettings = useCallback(
    async (
      closeDay: number,
      discountPersonalOverages: boolean,
      estimatedMonthlyIncome: number,
      basicBasketAmount: number
    ) => {
      const currentData = dataRef.current;
      if (!currentData) return;
      const appSettings = {
        closeDay,
        discountPersonalOverages,
        estimatedMonthlyIncome,
        basicBasketAmount
      };

      await persistEntityChange({ ...currentData, appSettings }, (repository) => repository.upsertAppSettings(appSettings));
    },
    [persistEntityChange]
  );

  const performMonthlyClose = useCallback(
    async (month: string) => {
      const currentData = dataRef.current;
      if (!currentData) return;

      const result = closeMonth(currentData, month);
      const closesWithoutMonth = currentData.monthlyCloses.filter((close) => close.month !== month);
      const monthState = { month, status: "closed" as const, closedAt: new Date().toISOString() };

      await persistEntityChange(
        {
          ...currentData,
          reimbursements: result.reimbursements,
          monthlyCloses: [...closesWithoutMonth, result.close],
          monthStates: [...currentData.monthStates.filter((state) => state.month !== month), monthState]
        },
        async (repository) => {
          await repository.upsertReimbursements(result.reimbursements);
          await repository.upsertMonthlyClose(result.close);
          await repository.upsertMonthState(monthState);
        }
      );
    },
    [persistEntityChange]
  );

  const reopenMonth = useCallback(
    async (month: string) => {
      const currentData = dataRef.current;
      if (!currentData) return;
      const monthState = { month, status: "reopened" as const, reopenedAt: new Date().toISOString() };

      await persistEntityChange(
        {
          ...currentData,
          monthStates: [...currentData.monthStates.filter((state) => state.month !== month), monthState]
        },
        (repository) => repository.upsertMonthState(monthState)
      );
    },
    [persistEntityChange]
  );

  const importData = useCallback(
    async (nextData: AppData) => {
      await persist(nextData);
    },
    [persist]
  );

  const resetDemoData = useCallback(async () => {
    const resetData = await localRepository.reset();
    await persist(resetData);
  }, [persist]);

  const getMonthStatus = useCallback(
    (month: string): MonthState["status"] =>
      data?.monthStates.find((state) => state.month === month)?.status ?? "open",
    [data]
  );

  return useMemo(
    () => ({
      data,
      isLoading,
      syncStatus,
      selectedMonth,
      setSelectedMonth,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      updatePersonName,
      updatePersonNames,
      saveMonthlyConfig,
      saveGoals,
      saveAppSettings,
      performMonthlyClose,
      reopenMonth,
      importData,
      getMonthStatus,
      resetDemoData
    }),
    [
      addExpense,
      addIncome,
      data,
      deleteExpense,
      deleteIncome,
      getMonthStatus,
      importData,
      isLoading,
      performMonthlyClose,
      reopenMonth,
      resetDemoData,
      saveAppSettings,
      saveGoals,
      saveMonthlyConfig,
      selectedMonth,
      syncStatus,
      updateExpense,
      updateIncome,
      updatePersonName,
      updatePersonNames
    ]
  );
}
