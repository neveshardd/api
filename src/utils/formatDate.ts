/**
 * Fuso fixo: o mesmo componente renderiza no servidor (UTC) e no navegador; sem fuso explícito
 * a data poderia divergir entre os dois e causar erro de hidratação.
 */
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}
