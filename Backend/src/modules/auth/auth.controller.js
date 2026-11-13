/**
 * Controlador de autenticación.
 * Contrato acordado con el frontend (Frontend/src/api/auth.js):
 *   POST /api/auth/login → { token, user }
 *   GET  /api/auth/me    → { user }
 * user = { _id, name, email, role, active, createdAt, updatedAt }
 */
const authService = require('./auth.service');

async function login(req, res) {
  const { email, password } = req.validated.body;
  res.json(await authService.login(email, password));
}

async function me(req, res) {
  res.json({ user: await authService.me(req.user.id) });
}

module.exports = { login, me };
