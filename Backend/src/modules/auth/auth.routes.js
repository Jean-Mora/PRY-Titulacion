/**
 * /api/auth
 *   POST /api/auth/login   Público (con límite de intentos por IP)
 *   GET  /api/auth/me      Autenticado
 *
 * Se exporta como fábrica para que cada instancia de la app (p. ej. en las
 * pruebas) tenga su propio contador de intentos.
 */
const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const AppError = require('../../utils/AppError');
const controller = require('./auth.controller');
const { loginBody } = require('./auth.schema');

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function authRoutes({ loginRateLimit }) {
  const router = Router();

  const loginLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: loginRateLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Los inicios de sesión correctos no cuentan: solo se frenan los intentos fallidos.
    skipSuccessfulRequests: true,
    handler: (_req, _res, next) =>
      next(new AppError(429, 'TOO_MANY_ATTEMPTS', 'Demasiados intentos de inicio de sesión. Espera 15 minutos.')),
  });

  router.post('/login', loginLimiter, validate({ body: loginBody }), controller.login);
  router.get('/me', auth, controller.me);

  return router;
}

module.exports = authRoutes;
