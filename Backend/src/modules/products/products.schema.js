/**
 * Validación de entrada del módulo products.
 *
 * El stock NO se acepta aquí: solo cambia con un movimiento (Arquitectura §5).
 * Si alguien envía `stock` en una variante, la validación lo rechaza.
 */
const { z } = require('zod');
const { objectId } = require('../users/users.schema');
const { paginationQuery } = require('../../utils/pagination');
const { TAGS } = require('./products.model');

const MAX_VARIANTS = 50;

const sku = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, { error: 'El SKU debe tener al menos 2 caracteres' })
  .max(40)
  .regex(/^[A-Z0-9][A-Z0-9._-]*$/, { error: 'El SKU solo admite letras, números, punto, guion y guion bajo' });

/** Monto en dólares con máximo 2 decimales. */
const money = (label) =>
  z.coerce
    .number({ error: `${label} debe ser un número` })
    .min(0, { error: `${label} no puede ser negativo` })
    .max(100_000)
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, { error: `${label} admite hasta 2 decimales` });

const text = (max) => z.string().trim().max(max);

const variantInput = z
  .object({
    _id: objectId.optional(),
    sku,
    color: text(40).optional(),
    size: text(40).optional(),
    model: text(40).optional(),
  })
  .strict();

const variants = z
  .array(variantInput)
  .max(MAX_VARIANTS, { error: `Máximo ${MAX_VARIANTS} variantes por producto` })
  .refine((list) => new Set(list.map((v) => v.sku)).size === list.length, {
    error: 'Hay SKUs de variante repetidos',
  });

const productFields = {
  sku,
  name: z.string().trim().min(2, { error: 'El nombre debe tener al menos 2 caracteres' }).max(120),
  description: text(2000).optional(),
  categoryId: objectId,
  price: money('El precio'),
  cost: money('El costo').optional(),
  tags: z.array(z.enum(TAGS, { error: 'Etiqueta inválida (nuevo u oferta)' })).max(TAGS.length).optional(),
  stockMin: z.coerce.number().int({ error: 'El stock mínimo debe ser entero' }).min(0).max(100_000).optional(),
  active: z.boolean().optional(),
  variants: variants.optional(),
};

const idParams = z.object({ id: objectId });

const createProductBody = z.object(productFields).strict();

const updateProductBody = z
  .object(Object.fromEntries(Object.entries(productFields).map(([k, v]) => [k, v.optional()])))
  .strict()
  .refine((v) => Object.keys(v).length > 0, { error: 'Envía al menos un campo para actualizar' });

const boolFromQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

const listProductsQuery = z.object({
  ...paginationQuery,
  q: z.string().trim().max(80).optional(),
  categoryId: objectId.optional(),
  active: boolFromQuery.optional(),
});

module.exports = { idParams, createProductBody, updateProductBody, listProductsQuery, MAX_VARIANTS };
