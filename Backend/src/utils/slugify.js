/**
 * Convierte un texto en slug para URLs: "Cuadernos Líneas" → "cuadernos-lineas".
 * Lo usan categorías y productos (el catálogo público usa /api/catalog/:slug).
 */
function slugify(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = { slugify };
