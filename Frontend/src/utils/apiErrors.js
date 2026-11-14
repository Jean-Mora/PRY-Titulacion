/**
 * Convierte los errores de validación del backend
 * ({ error: { details: [{ field: 'body.name', message }] } }) en un objeto
 * { name: message } para mostrarlos junto a cada campo del formulario.
 */
export function fieldErrors(err) {
  const details = err?.data?.error?.details;
  if (!Array.isArray(details)) return {};
  const out = {};
  for (const { field, message } of details) {
    const key = String(field ?? '').replace(/^(body|query|params)\./, '');
    if (key && !out[key]) out[key] = message;
  }
  return out;
}
