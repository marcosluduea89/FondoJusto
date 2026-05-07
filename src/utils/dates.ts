// Devuelve el mes actual en formato YYYY-MM, que usamos como clave mensual.
export function getCurrentMonthKey(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${date.getFullYear()}-${month}`;
}

// Indica si una clave mensual esta despues del mes calendario actual.
export function isFutureMonth(month: string): boolean {
  return month > getCurrentMonthKey();
}

// Calcula el mes anterior en formato YYYY-MM para comparaciones contables directas.
export function getPreviousMonthKey(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const previousDate = new Date(year, monthNumber - 2, 1);
  const previousMonth = String(previousDate.getMonth() + 1).padStart(2, "0");

  return `${previousDate.getFullYear()}-${previousMonth}`;
}

// Calcula el mes siguiente en formato YYYY-MM para programar reintegros.
export function getNextMonthKey(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const nextDate = new Date(year, monthNumber, 1);

  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");

  return `${nextDate.getFullYear()}-${nextMonth}`;
}

// Fecha ISO simple para guardar altas realizadas desde formularios.
export function getTodayISODate(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

// Etiqueta legible para mostrar meses en pantalla sin perder la clave original.
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);

  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric"
  }).format(date);
}
