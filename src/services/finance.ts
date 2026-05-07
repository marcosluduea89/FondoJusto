import {
  AppData,
  Expense,
  Income,
  MonthlyClose,
  MonthlyConfig,
  Reimbursement
} from "../models";
import { createId } from "../utils/ids";
import { getNextMonthKey } from "../utils/dates";

export interface MonthlySummary {
  totalIncome: number;
  totalCommonExpenses: number;
  investmentAmount: number;
  personalAmountMarcos: number;
  personalAmountWife: number;
  pendingReimbursementsMarcos: number;
  pendingReimbursementsWife: number;
  finalPersonalAmountMarcos: number;
  finalPersonalAmountWife: number;
  remainingCommonFund: number;
}

export interface MonthlyCloseResult {
  close: MonthlyClose;
  reimbursements: Reimbursement[];
}

// Configuracion por defecto para que el MVP funcione aunque el usuario no haya cargado porcentajes.
export const DEFAULT_MONTHLY_CONFIG: Omit<MonthlyConfig, "month"> = {
  investmentPercentage: 10,
  personalPercentageMarcos: 5,
  personalPercentageWife: 5
};

// Suma importes con proteccion ante datos vacios o no validos.
export function sumAmounts(items: Array<{ amount: number }>): number {
  return items.reduce((total, item) => total + Math.max(0, item.amount || 0), 0);
}

// Busca la configuracion mensual o genera una configuracion segura para ese mes.
export function getMonthlyConfig(configs: MonthlyConfig[], month: string): MonthlyConfig {
  return (
    configs.find((config) => config.month === month) ?? {
      month,
      ...DEFAULT_MONTHLY_CONFIG
    }
  );
}

// Filtra ingresos del mes seleccionado.
export function getMonthIncomes(incomes: Income[], month: string): Income[] {
  return incomes.filter((income) => income.month === month);
}

// Filtra gastos del mes seleccionado.
export function getMonthExpenses(expenses: Expense[], month: string): Expense[] {
  return expenses.filter((expense) => expense.month === month);
}

// Detecta reintegros pendientes del mes exacto. Se usa al navegar pantallas para no arrastrar
// el mismo reintegro por meses futuros vacios.
export function getPendingReimbursementsForExactMonth(
  reimbursements: Reimbursement[],
  month: string
): Reimbursement[] {
  return reimbursements.filter(
    (reimbursement) => reimbursement.status === "pending" && reimbursement.targetMonth === month
  );
}

// Detecta reintegros pendientes que deben aplicarse en el cierre actual o quedaron atrasados.
export function getPendingReimbursementsForClose(
  reimbursements: Reimbursement[],
  month: string
): Reimbursement[] {
  return reimbursements.filter(
    (reimbursement) => reimbursement.status === "pending" && reimbursement.targetMonth <= month
  );
}

// Reintegros que deben sumar al cierre del mes: pendientes a aplicar ahora o ya aplicados en ese mismo mes.
export function getReimbursementsForMonthlyClose(
  reimbursements: Reimbursement[],
  month: string
): Reimbursement[] {
  return reimbursements.filter(
    (reimbursement) =>
      (reimbursement.status === "pending" && reimbursement.targetMonth <= month) ||
      (reimbursement.status === "applied" && reimbursement.appliedMonth === month)
  );
}

// Calcula el resumen mensual sin modificar datos; por eso es facil de testear.
export function calculateMonthlySummary(
  incomes: Income[],
  expenses: Expense[],
  reimbursements: Reimbursement[],
  config: MonthlyConfig,
  month: string
): MonthlySummary {
  const pendingReimbursements = getPendingReimbursementsForExactMonth(reimbursements, month);

  return calculateMonthlySummaryWithReimbursements(
    incomes,
    expenses,
    pendingReimbursements,
    config,
    month
  );
}

function calculateMonthlySummaryWithReimbursements(
  incomes: Income[],
  expenses: Expense[],
  reimbursementsToApply: Reimbursement[],
  config: MonthlyConfig,
  month: string
): MonthlySummary {
  const monthIncomes = getMonthIncomes(incomes, month);
  const monthExpenses = getMonthExpenses(expenses, month);
  const commonExpenses = monthExpenses.filter((expense) => expense.isCommonExpense);

  const totalIncome = sumAmounts(monthIncomes);
  const totalCommonExpenses = sumAmounts(commonExpenses);
  const investmentAmount = totalIncome * (config.investmentPercentage / 100);
  const personalAmountMarcos = totalIncome * (config.personalPercentageMarcos / 100);
  const personalAmountWife = totalIncome * (config.personalPercentageWife / 100);
  const pendingReimbursementsMarcos = sumAmounts(
    reimbursementsToApply.filter((reimbursement) => reimbursement.personId === "marcos")
  );
  const pendingReimbursementsWife = sumAmounts(
    reimbursementsToApply.filter((reimbursement) => reimbursement.personId === "wife")
  );
  const finalPersonalAmountMarcos = personalAmountMarcos + pendingReimbursementsMarcos;
  const finalPersonalAmountWife = personalAmountWife + pendingReimbursementsWife;
  const remainingCommonFund =
    totalIncome -
    totalCommonExpenses -
    investmentAmount -
    finalPersonalAmountMarcos -
    finalPersonalAmountWife;

  return {
    totalIncome,
    totalCommonExpenses,
    investmentAmount,
    personalAmountMarcos,
    personalAmountWife,
    pendingReimbursementsMarcos,
    pendingReimbursementsWife,
    finalPersonalAmountMarcos,
    finalPersonalAmountWife,
    remainingCommonFund
  };
}

// Calcula el resumen usado para guardar un cierre, manteniendo estable un cierre repetido del mismo mes.
export function calculateMonthlyCloseSummary(
  incomes: Income[],
  expenses: Expense[],
  reimbursements: Reimbursement[],
  config: MonthlyConfig,
  month: string
): MonthlySummary {
  const closeReimbursements = getReimbursementsForMonthlyClose(reimbursements, month);

  return calculateMonthlySummaryWithReimbursements(incomes, expenses, closeReimbursements, config, month);
}

// Crea reintegros para gastos comunes pagados desde dinero personal.
export function buildNewReimbursementsForMonth(
  expenses: Expense[],
  existingReimbursements: Reimbursement[],
  month: string
): Reimbursement[] {
  const reimbursedExpenseIds = new Set(
    existingReimbursements.map((reimbursement) => reimbursement.originalExpenseId)
  );

  return getMonthExpenses(expenses, month)
    .filter(
      (expense) =>
        expense.isCommonExpense &&
        expense.paymentSource === "personal_money" &&
        !reimbursedExpenseIds.has(expense.id)
    )
    .map((expense) => ({
      id: createId("reimbursement"),
      originalExpenseId: expense.id,
      personId: expense.paidBy,
      amount: expense.amount,
      sourceMonth: month,
      targetMonth: getNextMonthKey(month),
      status: "pending" as const
    }));
}

// Genera un cierre mensual y devuelve la nueva lista de reintegros con los aplicados marcados.
export function closeMonth(data: AppData, month: string): MonthlyCloseResult {
  const config = getMonthlyConfig(data.monthlyConfigs, month);
  const summary = calculateMonthlyCloseSummary(
    data.incomes,
    data.expenses,
    data.reimbursements,
    config,
    month
  );
  const pendingForMonth = getPendingReimbursementsForClose(data.reimbursements, month);
  const pendingIds = new Set(pendingForMonth.map((reimbursement) => reimbursement.id));
  const updatedReimbursements = data.reimbursements.map((reimbursement) =>
    pendingIds.has(reimbursement.id)
      ? { ...reimbursement, status: "applied" as const, appliedMonth: month }
      : reimbursement
  );
  const newReimbursements = buildNewReimbursementsForMonth(
    data.expenses,
    updatedReimbursements,
    month
  );

  const close: MonthlyClose = {
    id: createId("close"),
    month,
    totalIncome: summary.totalIncome,
    totalCommonExpenses: summary.totalCommonExpenses,
    investmentPercentage: config.investmentPercentage,
    investmentAmount: summary.investmentAmount,
    personalPercentageMarcos: config.personalPercentageMarcos,
    personalAmountMarcos: summary.personalAmountMarcos,
    personalPercentageWife: config.personalPercentageWife,
    personalAmountWife: summary.personalAmountWife,
    reimbursementsAppliedMarcos: summary.pendingReimbursementsMarcos,
    reimbursementsAppliedWife: summary.pendingReimbursementsWife,
    finalPersonalAmountMarcos: summary.finalPersonalAmountMarcos,
    finalPersonalAmountWife: summary.finalPersonalAmountWife,
    remainingCommonFund: summary.remainingCommonFund
  };

  return {
    close,
    reimbursements: [...updatedReimbursements, ...newReimbursements]
  };
}
