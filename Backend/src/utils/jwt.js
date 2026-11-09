/**
 * Firma y verificación de JWT. Centraliza el algoritmo (HS256) para que
 * auth.service, el middleware auth y el socket usen exactamente lo mismo.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const ALGORITHM = 'HS256';

/** Payload mínimo: sub = id del usuario, role. Nada sensible. */
function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/** Devuelve el payload o lanza el error de jsonwebtoken (TokenExpiredError, JsonWebTokenError). */
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
}

module.exports = { signToken, verifyToken };
