import { useCallback, useEffect, useMemo, useState } from "react";
import { AppData, Expense, Income, MonthlyConfig, MonthState } from "../models";
import { closeMonth } from "../services/finance";
import { localRepository } from "../storage/localRepository";
import { getCurrentMonthKey } from "../utils/dates";

interface UseAppDataResult {
  data: AppData | null;
  isLoading: boolean;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  addIncome: (income: Income) => Promise<void>;
  updateIncome: (income: Income) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  saveMonthlyConfig: (config: MonthlyConfig) => Promise<void>;
  performMonthlyClose: (month: string) => Promise<void>;
  reopenMonth: (month: string) => Promise<void>;
  importData: (nextData: AppData) => Promise<void>;
  resetDemoData: () => Promise<void>;
  getMonthStatus: (month: string) => MonthState["status"];
}

// Hook central de estado: las pantallas leen y escriben datos desde un unico punto.
export function useAppData(): UseAppDataResult {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());

  useEffect(() => {
    localRepository.load().then((loadedData) => {
      setData(loadedData);
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (nextData: AppData) => {
    setData(nextData);
    await localRepository.save(nextData);
  }, []);

  const addIncome = useCallback(
    async (income: Income) => {
      if (!data) return;
      await persist({ ...data, incomes: [...data.incomes, income] });
    },
    [data, persist]
  );

  const updateIncome = useCallback(
    async (income: Income) => {
      if (!data) return;
      await persist({
        ...data,
        incomes: data.incomes.map((item) => (item.id === income.id ? income : item))
      });
    },
    [data, persist]
  );

  const deleteIncome = useCallback(
    async (incomeId: string) => {
      if (!data) return;
      await persist({ ...data, incomes: data.incomes.filter((income) => income.id !== incomeId) });
    },
    [data, persist]
  );

  const addExpense = useCallback(
    async (expense: Expense) => {
      if (!data) return;
      await persist({ ...data, expenses: [...data.expenses, expense] });
    },
    [data, persist]
  );

  const updateExpense = useCallback(
    async (expense: Expense) => {
      if (!data) return;
      await persist({
        ...data,
        expenses: data.expenses.map((item) => (item.id === expense.id ? expense : item))
      });
    },
    [data, persist]
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      if (!data) return;
      await persist({
        ...data,
        expenses: data.expenses.filter((expense) => expense.id !== expenseId),
        reimbursements: data.reimbursements.filter(
          (reimbursement) => reimbursement.originalExpenseId !== expenseId
        )
      });
    },
    [data, persist]
  );

  const saveMonthlyConfig = useCallback(
    async (config: MonthlyConfig) => {
      if (!data) return;

      const otherConfigs = data.monthlyConfigs.filter((item) => item.month !== config.month);
      await persist({ ...data, monthlyConfigs: [...otherConfigs, config] });
    },
    [data, persist]
  );

  const performMonthlyClose = useCallback(
    async (month: string) => {
      if (!data) return;

      const result = closeMonth(data, month);
      const closesWithoutMonth = data.monthlyCloses.filter((close) => close.month !== month);

      await persist({
        ...data,
        reimbursements: result.reimbursements,
        monthlyCloses: [...closesWithoutMonth, result.close],
        monthStates: [
          ...data.monthStates.filter((state) => state.month !== month),
          { month, status: "closed" as const, closedAt: new Date().toISOString() }
        ]
      });
    },
    [data, persist]
  );

  const reopenMonth = useCallback(
    async (month: string) => {
      if (!data) return;

      await persist({
        ...data,
        monthStates: [
          ...data.monthStates.filter((state) => state.month !== month),
          { month, status: "reopened" as const, reopenedAt: new Date().toISOString() }
        ]
      });
    },
    [data, persist]
  );

  const importData = useCallback(
    async (nextData: AppData) => {
      await persist(nextData);
    },
    [persist]
  );

  const resetDemoData = useCallback(async () => {
    const resetData = await localRepository.reset();
    setData(resetData);
  }, []);

  const getMonthStatus = useCallback(
    (month: string): MonthState["status"] =>
      data?.monthStates.find((state) => state.month === month)?.status ?? "open",
    [data]
  );

  return useMemo(
    () => ({
      data,
      isLoading,
      selectedMonth,
      setSelectedMonth,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      saveMonthlyConfig,
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
      saveMonthlyConfig,
      selectedMonth,
      updateExpense,
      updateIncome
    ]
  );
}
