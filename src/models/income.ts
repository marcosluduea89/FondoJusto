import { PersonId } from "./person";

// Ingreso mensual cargado por persona o como ingreso adicional familiar.
export interface Income {
  id: string;
  month: string;
  personId: PersonId;
  description: string;
  amount: number;
  date: string;
}
