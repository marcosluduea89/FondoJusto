import { describe, expect, it } from "vitest";
import { AppData, Expense, Income, MonthlyConfig, Reimbursement } from "../models";
import {
  buildNewReimbursementsForMonth,
  calculateGoalAllocations,
  calculateMonthlyCloseSummary,
  calculateMonthlySummary,
  closeMonth,
  getMonthlyConfig,
  getPersonalOverageCarryover
} from "./finance";

const month = "2026-05";

const config: MonthlyConfig = {
  month,
  investmentPercentage: 10,
  goalsPercentage: 15,
  personalPercentageMarcos: 20,
  personalPercentageWife: 10
};

const incomes: Income[] = [
  {
    id: "income_marcos",
    amount: 1000,
    date: "2026-05-01",
    description: "Sueldo Marcos",
    month,
    personId: "marcos"
  },
  {
    id: "income_wife",
    amount: 500,
    date: "2026-05-02",
    description: "Sueldo Esposa",
    month,
    personId: "wife"
  },
  {
    id: "income_other_month",
    amount: 999,
    date: "2026-06-01",
    description: "Otro mes",
    month: "2026-06",
    personId: "marcos"
  }
];

const expenses: Expense[] = [
  {
    id: "common_food",
    amount: 300,
    category: "comida",
    date: "2026-05-03",
    description: "Supermercado",
    isCommonExpense: true,
    month,
    paidBy: "marcos",
    paymentSource: "common_fund"
  },
  {
    id: "investment",
    amount: 80,
    category: "inversion",
    date: "2026-05-04",
    description: "Broker",
    isCommonExpense: false,
    month,
    paidBy: "marcos",
    paymentSource: "common_fund"
  },
  {
    id: "personal_marcos",
    amount: 250,
    category: "otros",
    date: "2026-05-05",
    description: "Personal Marcos",
    isCommonExpense: false,
    month,
    paidBy: "marcos",
    paymentSource: "personal_money"
  },
  {
    id: "personal_wife",
    amount: 90,
    category: "salud",
    date: "2026-05-06",
    description: "Personal Esposa",
    isCommonExpense: false,
    month,
    paidBy: "wife",
    paymentSource: "personal_money"
  },
  {
    id: "common_paid_personal",
    amount: 120,
    category: "servicios",
    date: "2026-05-07",
    description: "Servicio pagado personal",
    isCommonExpense: true,
    month,
    paidBy: "wife",
    paymentSource: "personal_money"
  }
];

const reimbursements: Reimbursement[] = [
  {
    id: "reimbursement_marcos",
    amount: 40,
    originalExpenseId: "old_expense_marcos",
    personId: "marcos",
    sourceMonth: "2026-04",
    status: "pending",
    targetMonth: month
  },
  {
    id: "reimbursement_wife",
    amount: 30,
    originalExpenseId: "old_expense_wife",
    personId: "wife",
    sourceMonth: "2026-04",
    status: "pending",
    targetMonth: month
  },
  {
    id: "future_reimbursement",
    amount: 999,
    originalExpenseId: "future_expense",
    personId: "wife",
    sourceMonth: month,
    status: "pending",
    targetMonth: "2026-06"
  }
];

function createAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    appSettings: {
      basicBasketAmount: 0,
      closeDay: 31,
      discountPersonalOverages: true,
      estimatedMonthlyIncome: 0
    },
    expenses: [],
    goals: [],
    incomes: [],
    monthlyCloses: [],
    monthlyConfigs: [],
    monthStates: [],
    people: [
      { id: "marcos", name: "Marcos" },
      { id: "wife", name: "Esposa" }
    ],
    reimbursements: [],
    ...overrides
  };
}

describe("finance", () => {
  it("calcula resumen mensual con ingresos, fondo comun, inversion, objetivos y dinero personal", () => {
    const summary = calculateMonthlySummary(incomes, expenses, reimbursements, config, month);

    expect(summary.totalIncome).toBe(1500);
    expect(summary.totalCommonExpenses).toBe(420);
    expect(summary.investmentAmount).toBe(150);
    expect(summary.investmentUsed).toBe(80);
    expect(summary.availableInvestmentAmount).toBe(70);
    expect(summary.goalsAmount).toBe(225);
    expect(summary.personalAmountMarcos).toBe(300);
    expect(summary.personalAmountWife).toBe(150);
    expect(summary.pendingReimbursementsMarcos).toBe(40);
    expect(summary.pendingReimbursementsWife).toBe(30);
    expect(summary.availablePersonalAmountMarcos).toBe(90);
    expect(summary.availablePersonalAmountWife).toBe(90);
    expect(summary.remainingCommonFund).toBe(185);
  });

  it("distribuye objetivos activos segun porcentaje de asignacion", () => {
    const allocations = calculateGoalAllocations(
      [
        { id: "goal_1", allocationPercentage: 60, currentAmount: 100, name: "Emergencia", targetAmount: 1000 },
        { id: "goal_2", allocationPercentage: 40, currentAmount: 50, name: "Viaje", targetAmount: 500 },
        { id: "goal_3", allocationPercentage: 100, currentAmount: 0, name: "", targetAmount: 1000 },
        { id: "goal_4", allocationPercentage: 100, currentAmount: 0, name: "Sin meta", targetAmount: 0 }
      ],
      225
    );

    expect(allocations).toHaveLength(2);
    expect(allocations[0].assignedAmount).toBe(135);
    expect(allocations[1].assignedAmount).toBe(90);
  });

  it("genera reintegros para gastos comunes pagados desde dinero personal sin duplicar existentes", () => {
    const newReimbursements = buildNewReimbursementsForMonth(
      expenses,
      [{ ...reimbursements[0], originalExpenseId: "common_food" }],
      month
    );

    expect(newReimbursements).toHaveLength(1);
    expect(newReimbursements[0]).toMatchObject({
      amount: 120,
      originalExpenseId: "common_paid_personal",
      personId: "wife",
      sourceMonth: month,
      status: "pending",
      targetMonth: "2026-06"
    });
  });

  it("cierra el mes marcando reintegros pendientes como aplicados y creando los del mes siguiente", () => {
    const result = closeMonth(createAppData({ expenses, incomes, monthlyConfigs: [config], reimbursements }), month);

    expect(result.close).toMatchObject({
      month,
      totalIncome: 1500,
      totalCommonExpenses: 420,
      investmentAmount: 150,
      goalsAmount: 225,
      reimbursementsAppliedMarcos: 40,
      reimbursementsAppliedWife: 30,
      remainingCommonFund: 185
    });
    expect(result.reimbursements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "reimbursement_marcos", status: "applied", appliedMonth: month }),
        expect.objectContaining({ id: "reimbursement_wife", status: "applied", appliedMonth: month }),
        expect.objectContaining({
          amount: 120,
          originalExpenseId: "common_paid_personal",
          status: "pending",
          targetMonth: "2026-06"
        })
      ])
    );
  });

  it("usa reintegros ya aplicados del mismo mes al recalcular un cierre", () => {
    const summary = calculateMonthlyCloseSummary(
      incomes,
      expenses,
      [
        { ...reimbursements[0], status: "applied", appliedMonth: month },
        { ...reimbursements[1], status: "applied", appliedMonth: "2026-04" }
      ],
      config,
      month
    );

    expect(summary.pendingReimbursementsMarcos).toBe(40);
    expect(summary.pendingReimbursementsWife).toBe(0);
  });

  it("arrastra excesos personales al mes siguiente cuando esta habilitado", () => {
    const carryover = getPersonalOverageCarryover(
      createAppData({
        appSettings: {
          basicBasketAmount: 0,
          closeDay: 31,
          discountPersonalOverages: true,
          estimatedMonthlyIncome: 0
        },
        expenses: [
          {
            id: "personal_overage",
            amount: 250,
            category: "otros",
            date: "2026-04-10",
            description: "Exceso personal",
            isCommonExpense: false,
            month: "2026-04",
            paidBy: "marcos",
            paymentSource: "personal_money"
          }
        ],
        incomes: [
          {
            id: "income_april",
            amount: 1000,
            date: "2026-04-01",
            description: "Ingreso abril",
            month: "2026-04",
            personId: "marcos"
          }
        ],
        monthlyConfigs: [
          {
            goalsPercentage: 0,
            investmentPercentage: 0,
            month: "2026-04",
            personalPercentageMarcos: 10,
            personalPercentageWife: 0
          }
        ]
      }),
      month
    );

    expect(carryover).toEqual({ marcos: 150, wife: 0 });
  });

  it("usa configuracion mensual por defecto cuando no hay una guardada", () => {
    expect(getMonthlyConfig([], month)).toEqual({
      goalsPercentage: 0,
      investmentPercentage: 10,
      month,
      personalPercentageMarcos: 5,
      personalPercentageWife: 5
    });
  });
});
