import { AppData, Expense, Goal, Income, MonthlyClose, MonthlyConfig, MonthState, Person, Reimbursement } from "../models";
import { DEFAULT_GOALS } from "../models/goal";
import { PEOPLE } from "../models/person";
import { supabase } from "../services/supabase";

const DEFAULT_BASIC_BASKET_AMOUNT = 1370000;

interface CloudLoadResult {
  data: AppData;
  isEmpty: boolean;
}

function normalizeGoals(goals?: Goal[]): Goal[] {
  return DEFAULT_GOALS.map((defaultGoal) => ({
    ...defaultGoal,
    ...goals?.find((goal) => goal.id === defaultGoal.id),
    allocationPercentage:
      goals?.find((goal) => goal.id === defaultGoal.id)?.allocationPercentage ??
      defaultGoal.allocationPercentage
  }));
}

function normalizeData(data: AppData): AppData {
  return {
    ...data,
    people: data.people.length ? data.people : PEOPLE,
    goals: normalizeGoals(data.goals),
    monthlyConfigs: data.monthlyConfigs.map((config) => ({
      ...config,
      goalsPercentage: config.goalsPercentage ?? 0
    })),
    monthStates: data.monthStates ?? [],
    appSettings: {
      closeDay: data.appSettings?.closeDay ?? 31,
      discountPersonalOverages: data.appSettings?.discountPersonalOverages ?? true,
      estimatedMonthlyIncome: data.appSettings?.estimatedMonthlyIncome ?? 0,
      basicBasketAmount: data.appSettings?.basicBasketAmount ?? DEFAULT_BASIC_BASKET_AMOUNT
    }
  };
}

function toNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function requireNoError(error: unknown): void {
  if (error) throw error;
}

async function deleteHouseholdRows(table: string, householdId: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("household_id", householdId);
  requireNoError(error);
}

export function createSupabaseRepository(householdId: string) {
  return {
    async load(fallbackData: AppData): Promise<CloudLoadResult> {
      const [
        peopleResult,
        incomesResult,
        expensesResult,
        reimbursementsResult,
        goalsResult,
        configsResult,
        closesResult,
        statesResult,
        settingsResult
      ] = await Promise.all([
        supabase.from("household_people").select("*").eq("household_id", householdId),
        supabase.from("incomes").select("*").eq("household_id", householdId),
        supabase.from("expenses").select("*").eq("household_id", householdId),
        supabase.from("reimbursements").select("*").eq("household_id", householdId),
        supabase.from("goals").select("*").eq("household_id", householdId),
        supabase.from("monthly_configs").select("*").eq("household_id", householdId),
        supabase.from("monthly_closes").select("*").eq("household_id", householdId),
        supabase.from("month_states").select("*").eq("household_id", householdId),
        supabase.from("app_settings").select("*").eq("household_id", householdId).maybeSingle()
      ]);

      [
        peopleResult.error,
        incomesResult.error,
        expensesResult.error,
        reimbursementsResult.error,
        goalsResult.error,
        configsResult.error,
        closesResult.error,
        statesResult.error,
        settingsResult.error
      ].forEach(requireNoError);

      const isEmpty =
        !peopleResult.data?.length &&
        !incomesResult.data?.length &&
        !expensesResult.data?.length &&
        !reimbursementsResult.data?.length &&
        !goalsResult.data?.length &&
        !configsResult.data?.length &&
        !closesResult.data?.length &&
        !statesResult.data?.length;

      if (isEmpty) {
        await this.save(fallbackData);
        return { data: normalizeData(fallbackData), isEmpty: true };
      }

      const people: Person[] = (peopleResult.data ?? []).map((person) => ({
        id: person.person_id,
        name: person.name
      }));

      const incomes: Income[] = (incomesResult.data ?? []).map((income) => ({
        id: income.local_id,
        month: income.month,
        personId: income.person_id,
        description: income.description,
        amount: toNumber(income.amount),
        date: income.date
      }));

      const expenses: Expense[] = (expensesResult.data ?? []).map((expense) => ({
        id: expense.local_id,
        month: expense.month,
        category: expense.category,
        description: expense.description,
        amount: toNumber(expense.amount),
        paidBy: expense.paid_by,
        paymentSource: expense.payment_source,
        isCommonExpense: Boolean(expense.is_common_expense),
        date: expense.date
      }));

      const reimbursements: Reimbursement[] = (reimbursementsResult.data ?? []).map((reimbursement) => ({
        id: reimbursement.local_id,
        originalExpenseId: reimbursement.original_expense_id ?? reimbursement.expense_id,
        personId: reimbursement.person_id ?? reimbursement.from_person_id,
        amount: toNumber(reimbursement.amount),
        sourceMonth: reimbursement.source_month ?? reimbursement.month,
        targetMonth: reimbursement.target_month ?? reimbursement.month,
        status: reimbursement.status,
        appliedMonth: reimbursement.applied_month ?? undefined
      }));

      const goals: Goal[] = (goalsResult.data ?? []).map((goal) => ({
        id: goal.local_id,
        name: goal.name,
        currentAmount: toNumber(goal.current_amount),
        targetAmount: toNumber(goal.target_amount),
        allocationPercentage: toNumber(goal.allocation_percentage)
      }));

      const monthlyConfigs: MonthlyConfig[] = (configsResult.data ?? []).map((config) => ({
        month: config.month,
        investmentPercentage: toNumber(config.investment_percentage),
        goalsPercentage: toNumber(config.goals_percentage),
        personalPercentageMarcos: toNumber(config.personal_percentage_marcos),
        personalPercentageWife: toNumber(config.personal_percentage_wife)
      }));

      const monthlyCloses: MonthlyClose[] = (closesResult.data ?? []).map((close) => close.snapshot as MonthlyClose);

      const monthStates: MonthState[] = (statesResult.data ?? []).map((state) => ({
        month: state.month,
        status: state.status,
        closedAt: state.closed_at ?? undefined,
        reopenedAt: state.reopened_at ?? undefined
      }));

      const settings = settingsResult.data;
      const data = normalizeData({
        people,
        incomes,
        expenses,
        reimbursements,
        goals,
        monthlyConfigs,
        monthlyCloses,
        monthStates,
        appSettings: {
          closeDay: settings?.close_day ?? fallbackData.appSettings.closeDay,
          discountPersonalOverages:
            settings?.discount_personal_overages ?? fallbackData.appSettings.discountPersonalOverages,
          estimatedMonthlyIncome: toNumber(settings?.estimated_monthly_income ?? fallbackData.appSettings.estimatedMonthlyIncome),
          basicBasketAmount: toNumber(settings?.basic_basket_amount ?? fallbackData.appSettings.basicBasketAmount)
        }
      });

      return { data, isEmpty: false };
    },

    async save(data: AppData): Promise<void> {
      const normalizedData = normalizeData(data);

      await Promise.all([
        deleteHouseholdRows("household_people", householdId),
        deleteHouseholdRows("incomes", householdId),
        deleteHouseholdRows("expenses", householdId),
        deleteHouseholdRows("reimbursements", householdId),
        deleteHouseholdRows("goals", householdId),
        deleteHouseholdRows("monthly_configs", householdId),
        deleteHouseholdRows("monthly_closes", householdId),
        deleteHouseholdRows("month_states", householdId)
      ]);

      const settingsResult = await supabase.from("app_settings").upsert(
        {
          household_id: householdId,
          close_day: normalizedData.appSettings.closeDay,
          discount_personal_overages: normalizedData.appSettings.discountPersonalOverages,
          estimated_monthly_income: normalizedData.appSettings.estimatedMonthlyIncome,
          basic_basket_amount: normalizedData.appSettings.basicBasketAmount
        },
        { onConflict: "household_id" }
      );
      requireNoError(settingsResult.error);

      const inserts = [
        normalizedData.people.length
          ? supabase.from("household_people").insert(
              normalizedData.people.map((person) => ({
                household_id: householdId,
                person_id: person.id,
                name: person.name
              }))
            )
          : Promise.resolve({ error: null }),
        normalizedData.incomes.length
          ? supabase.from("incomes").insert(
              normalizedData.incomes.map((income) => ({
                household_id: householdId,
                local_id: income.id,
                month: income.month,
                person_id: income.personId,
                description: income.description,
                amount: income.amount,
                date: income.date
              }))
            )
          : Promise.resolve({ error: null }),
        normalizedData.expenses.length
          ? supabase.from("expenses").insert(
              normalizedData.expenses.map((expense) => ({
                household_id: householdId,
                local_id: expense.id,
                month: expense.month,
                category: expense.category,
                description: expense.description,
                amount: expense.amount,
                paid_by: expense.paidBy,
                payment_source: expense.paymentSource,
                is_common_expense: expense.isCommonExpense,
                date: expense.date
              }))
            )
          : Promise.resolve({ error: null }),
        normalizedData.reimbursements.length
          ? supabase.from("reimbursements").insert(
              normalizedData.reimbursements.map((reimbursement) => ({
                household_id: householdId,
                local_id: reimbursement.id,
                expense_id: reimbursement.originalExpenseId,
                original_expense_id: reimbursement.originalExpenseId,
                from_person_id: reimbursement.personId,
                to_person_id: reimbursement.personId,
                person_id: reimbursement.personId,
                amount: reimbursement.amount,
                month: reimbursement.targetMonth,
                source_month: reimbursement.sourceMonth,
                target_month: reimbursement.targetMonth,
                status: reimbursement.status,
                applied_month: reimbursement.appliedMonth ?? null
              }))
            )
          : Promise.resolve({ error: null }),
        normalizedData.goals.length
          ? supabase.from("goals").insert(
              normalizedData.goals.map((goal) => ({
                household_id: householdId,
                local_id: goal.id,
                name: goal.name,
                current_amount: goal.currentAmount,
                target_amount: goal.targetAmount,
                allocation_percentage: goal.allocationPercentage
              }))
            )
          : Promise.resolve({ error: null }),
        normalizedData.monthlyConfigs.length
          ? supabase.from("monthly_configs").insert(
              normalizedData.monthlyConfigs.map((config) => ({
                household_id: householdId,
                month: config.month,
                investment_percentage: config.investmentPercentage,
                goals_percentage: config.goalsPercentage,
                personal_percentage_marcos: config.personalPercentageMarcos,
                personal_percentage_wife: config.personalPercentageWife
              }))
            )
          : Promise.resolve({ error: null }),
        normalizedData.monthlyCloses.length
          ? supabase.from("monthly_closes").insert(
              normalizedData.monthlyCloses.map((close) => ({
                household_id: householdId,
                month: close.month,
                snapshot: close
              }))
            )
          : Promise.resolve({ error: null }),
        normalizedData.monthStates.length
          ? supabase.from("month_states").insert(
              normalizedData.monthStates.map((state) => ({
                household_id: householdId,
                month: state.month,
                status: state.status,
                closed_at: state.closedAt ?? null,
                reopened_at: state.reopenedAt ?? null
              }))
            )
          : Promise.resolve({ error: null })
      ];

      const results = await Promise.all(inserts);
      results.map((result) => result.error).forEach(requireNoError);
    }
  };
}
