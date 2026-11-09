/**
 * Paginación uniforme para todos los listados.
 * Respuesta: { items, page, limit, total, pages }
 */
const { z } = require('zod');

const MAX_LIMIT = 100;

/** Esquema zod reutilizable para ?page=&limit= en los *.schema.js. */
const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(20),
};

function toSkip({ page, limit }) {
  return (page - 1) * limit;
}

function buildPage(items, total, { page, limit }) {
  return { items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

module.exports = { paginationQuery, toSkip, buildPage, MAX_LIMIT };
