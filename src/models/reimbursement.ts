import { PersonId } from "./person";

export type ReimbursementStatus = "pending" | "applied";

// Reintegro generado por un gasto comun pagado desde dinero personal.
export interface Reimbursement {
  id: string;
  originalExpenseId: string;
  personId: PersonId;
  amount: number;
  sourceMonth: string;
  targetMonth: string;
  status: ReimbursementStatus;
  appliedMonth?: string;
}
