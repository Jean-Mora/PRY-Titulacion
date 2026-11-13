/**
 * Validación de entrada del módulo auth.
 * En el login no se exige la longitud mínima de contraseña: cualquier clave
 * incorrecta debe dar el mismo "credenciales incorrectas".
 */
const { z } = require('zod');
const { email } = require('../users/users.schema');

const loginBody = z.object({
  email,
  password: z.string().min(1, { error: 'La contraseña es obligatoria' }).max(200),
});

module.exports = { loginBody };
