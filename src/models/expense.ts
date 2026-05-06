import { PersonId } from "./person";

// Categorias comunes del hogar que se muestran en el formulario de gastos.
export type ExpenseCategory =
  | "alquiler"
  | "comida"
  | "servicios"
  | "tarjeta_comun"
  | "salud"
  | "bebe"
  | "transporte"
  | "otros";

export type PaymentSource = "common_fund" | "personal_money";

// Gasto mensual. Si es comun y se pago con dinero personal, genera reintegro.
export interface Expense {
  id: string;
  month: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidBy: PersonId;
  paymentSource: PaymentSource;
  isCommonExpense: boolean;
  date: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "alquiler",
  "comida",
  "servicios",
  "tarjeta_comun",
  "salud",
  "bebe",
  "transporte",
  "otros"
];
