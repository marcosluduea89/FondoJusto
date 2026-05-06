export type MonthStatus = "open" | "closed" | "reopened";

// Estado operativo del mes. Evita modificar sin querer un periodo ya cerrado.
export interface MonthState {
  month: string;
  status: MonthStatus;
  closedAt?: string;
  reopenedAt?: string;
}
