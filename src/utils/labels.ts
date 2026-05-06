import { ExpenseCategory, PaymentSource, PersonId } from "../models";

// Diccionarios de texto para mantener la UI consistente.
export const personLabels: Record<PersonId, string> = {
  marcos: "Marcos",
  wife: "Esposa"
};

export const categoryLabels: Record<ExpenseCategory, string> = {
  alquiler: "Alquiler",
  comida: "Comida",
  servicios: "Servicios",
  tarjeta_comun: "Tarjeta comun",
  salud: "Salud",
  bebe: "Bebe",
  transporte: "Transporte",
  otros: "Otros"
};

export const paymentSourceLabels: Record<PaymentSource, string> = {
  common_fund: "Fondo comun",
  personal_money: "Dinero personal"
};
