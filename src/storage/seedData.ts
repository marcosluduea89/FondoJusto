import { AppData } from "../models";
import { getCurrentMonthKey, getNextMonthKey } from "../utils/dates";

const currentMonth = getCurrentMonthKey();
const nextMonth = getNextMonthKey(currentMonth);

// Datos de ejemplo para abrir la app y ver todos los calculos funcionando.
export const seedData: AppData = {
  incomes: [
    {
      id: "income_demo_marcos",
      month: currentMonth,
      personId: "marcos",
      description: "Sueldo Marcos",
      amount: 1200000,
      date: `${currentMonth}-05`
    },
    {
      id: "income_demo_wife",
      month: currentMonth,
      personId: "wife",
      description: "Sueldo esposa",
      amount: 900000,
      date: `${currentMonth}-05`
    },
    {
      id: "income_demo_extra",
      month: currentMonth,
      personId: "marcos",
      description: "Ingreso extra familiar",
      amount: 120000,
      date: `${currentMonth}-12`
    }
  ],
  expenses: [
    {
      id: "expense_demo_rent",
      month: currentMonth,
      category: "alquiler",
      description: "Alquiler",
      amount: 520000,
      paidBy: "marcos",
      paymentSource: "common_fund",
      isCommonExpense: true,
      date: `${currentMonth}-07`
    },
    {
      id: "expense_demo_food",
      month: currentMonth,
      category: "comida",
      description: "Carniceria pagada por Marcos",
      amount: 50000,
      paidBy: "marcos",
      paymentSource: "personal_money",
      isCommonExpense: true,
      date: `${currentMonth}-14`
    },
    {
      id: "expense_demo_services",
      month: currentMonth,
      category: "servicios",
      description: "Luz, gas e internet",
      amount: 130000,
      paidBy: "wife",
      paymentSource: "common_fund",
      isCommonExpense: true,
      date: `${currentMonth}-18`
    }
  ],
  reimbursements: [
    {
      id: "reimbursement_demo_previous",
      originalExpenseId: "expense_demo_previous",
      personId: "wife",
      amount: 30000,
      sourceMonth: "2026-04",
      targetMonth: currentMonth,
      status: "pending"
    },
    {
      id: "reimbursement_demo_future",
      originalExpenseId: "expense_demo_food",
      personId: "marcos",
      amount: 50000,
      sourceMonth: currentMonth,
      targetMonth: nextMonth,
      status: "pending"
    }
  ],
  monthlyConfigs: [
    {
      month: currentMonth,
      investmentPercentage: 10,
      personalPercentageMarcos: 5,
      personalPercentageWife: 5
    }
  ],
  monthlyCloses: [],
  monthStates: [
    {
      month: currentMonth,
      status: "open"
    }
  ]
};
