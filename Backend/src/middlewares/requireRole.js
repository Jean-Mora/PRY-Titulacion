/**
 * Restringe una ruta a ciertos roles. Va siempre después de `auth`.
 *
 *   router.get('/', auth, requireRole(ROLES.ADMIN), controller.list)
 */
const AppError = require('../utils/AppError');

function requireRole(...roles) {
  const allowed = roles.flat();
  return function roleGuard(req, _res, next) {
    if (!req.user) throw AppError.unauthorized();
    if (!allowed.includes(req.user.role)) throw AppError.forbidden();
    next();
  };
}

module.exports = requireRole;
