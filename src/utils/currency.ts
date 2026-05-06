// Formatea montos como moneda argentina para toda la UI.
export function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(amount);
}

// Convierte texto de formulario a numero, aceptando coma decimal local.
export function parseAmountInput(value: string): number {
  const normalizedValue = value.replace(/\./g, "").replace(",", ".");
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
