/**
 * Validación de entrada del módulo categories.
 */
const { z } = require('zod');
const { objectId } = require('../users/users.schema');

const name = z.string().trim().min(2, { error: 'El nombre debe tener al menos 2 caracteres' }).max(60);
const description = z.string().trim().max(300, { error: 'La descripción admite hasta 300 caracteres' });
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: 'El slug solo admite minúsculas, números y guiones' })
  .max(80);

const idParams = z.object({ id: objectId });

const createCategoryBody = z.object({
  name,
  description: description.optional(),
  slug: slug.optional(),
});

const updateCategoryBody = z
  .object({ name: name.optional(), description: description.optional(), slug: slug.optional() })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { error: 'Envía al menos un campo para actualizar' });

module.exports = { idParams, createCategoryBody, updateCategoryBody };
