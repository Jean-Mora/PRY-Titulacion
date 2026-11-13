/**
 * Verifica el JWT de la cabecera `Authorization: Bearer <token>` y carga
 * req.user = { id, name, email, role }.
 *
 * Además del token, consulta el usuario en la base: si fue desactivado o
 * eliminado después de iniciar sesión, el token deja de servir de inmediato
 * (no hay que esperar las 8 horas de expiración).
 */
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');
const User = require('../modules/users/users.model');

function extractToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

async function auth(req, _res, next) {
  const token = extractToken(req);
  if (!token) throw AppError.unauthorized('Debes iniciar sesión.', 'TOKEN_MISSING');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Tu sesión expiró. Vuelve a iniciar sesión.', 'TOKEN_EXPIRED');
    }
    throw AppError.unauthorized('Sesión inválida. Vuelve a iniciar sesión.', 'TOKEN_INVALID');
  }

  const user = await User.findById(payload.sub).lean();
  if (!user || !user.active) {
    throw AppError.unauthorized('Tu usuario no está activo. Vuelve a iniciar sesión.', 'USER_INACTIVE');
  }

  req.user = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  next();
}

module.exports = auth;
module.exports.extractToken = extractToken;
