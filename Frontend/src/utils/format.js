/** Formato de moneda y fechas para Ecuador (dólares). */
const usd = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });

export function formatUSD(value) {
  return usd.format(Number(value) || 0);
}

const dateTime = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDateTime(value) {
  return value ? dateTime.format(new Date(value)) : '';
}
