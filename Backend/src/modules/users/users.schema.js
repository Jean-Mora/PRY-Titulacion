/**
 * Reglas de validación de entrada del módulo users.
 */
const { z } = require('zod');
const { ROLE_VALUES } = require('../../utils/roles');
const { paginationQuery } = require('../../utils/pagination');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, { error: 'Identificador inválido' });

const name = z.string().trim().min(2, { error: 'El nombre debe tener al menos 2 caracteres' }).max(80);
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Correo electrónico inválido' }))
  .pipe(z.string().max(120));
// bcrypt solo usa los primeros 72 bytes: se limita para que nadie crea que su clave es más larga de lo que vale.
const password = z
  .string()
  .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' })
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, { error: 'La contraseña es demasiado larga (máx. 72 bytes)' });
const role = z.enum(ROLE_VALUES, { error: 'El rol debe ser admin o vendedor' });

const idParams = z.object({ id: objectId });

const createUserBody = z.object({
  name,
  email,
  password,
  role,
});

const updateUserBody = z
  .object({
    name: name.optional(),
    email: email.optional(),
    password: password.optional(),
    role: role.optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { error: 'Envía al menos un campo para actualizar' });

const boolFromQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

const listUsersQuery = z.object({
  ...paginationQuery,
  q: z.string().trim().max(80).optional(),
  role: role.optional(),
  active: boolFromQuery.optional(),
});

module.exports = {
  objectId,
  email,
  password,
  idParams,
  createUserBody,
  updateUserBody,
  listUsersQuery,
};
