/**
 * Datos de prueba reutilizables.
 */
const usersService = require('../../src/modules/users/users.service');
const { signToken } = require('../../src/utils/jwt');

const PASSWORD = 'clave-segura-123';

let seq = 0;

async function createUser(overrides = {}) {
  seq += 1;
  const { active, ...data } = {
    name: `Usuario ${seq}`,
    email: `usuario${seq}@jeanfabri.test`,
    password: PASSWORD,
    role: 'vendedor',
    ...overrides,
  };
  const user = await usersService.create(data);
  if (active === false) {
    user.active = false;
    await user.save();
  }
  return user;
}

/** Crea un usuario y devuelve también su cabecera Authorization. */
async function loginAs(role = 'admin', overrides = {}) {
  const user = await createUser({ role, ...overrides });
  return { user, authHeader: `Bearer ${signToken(user)}` };
}

module.exports = { PASSWORD, createUser, loginAs };
