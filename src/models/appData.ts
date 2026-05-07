import { Expense } from "./expense";
import { Income } from "./income";
import { MonthlyClose } from "./monthlyClose";
import { MonthlyConfig } from "./monthlyConfig";
import { MonthState } from "./monthState";
import { Person } from "./person";
import { Reimbursement } from "./reimbursement";

// Estado completo persistido localmente. Mantenerlo tipado facilita cambiar de backend luego.
export interface AppData {
  people: Person[];
  incomes: Income[];
  expenses: Expense[];
  reimbursements: Reimbursement[];
  monthlyConfigs: MonthlyConfig[];
  monthlyCloses: MonthlyClose[];
  monthStates: MonthState[];
}
