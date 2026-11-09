/**
 * Inicio de sesión y datos del usuario actual. No conoce req ni res.
 */
const bcrypt = require('bcryptjs');
const AppError = require('../../utils/AppError');
const { signToken } = require('../../utils/jwt');
const User = require('../users/users.model');

// Hash de relleno: si el correo no existe se compara igual contra algo, para
// que la respuesta tarde lo mismo y no revele qué correos están registrados.
const DUMMY_HASH = bcrypt.hashSync('contraseña-de-relleno', 10);

const invalidCredentials = () =>
  AppError.unauthorized('Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');

async function login(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) throw invalidCredentials();
  if (!user.active) throw AppError.forbidden('Tu usuario está desactivado. Contacta al administrador.', 'USER_INACTIVE');

  return { token: signToken(user), user: user.toJSON() };
}

async function me(userId) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('Usuario no encontrado.', 'USER_NOT_FOUND');
  return user;
}

module.exports = { login, me };
