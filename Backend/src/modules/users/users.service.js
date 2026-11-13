/**
 * Lógica de negocio de usuarios. No conoce req ni res.
 */
const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');
const { toSkip, buildPage } = require('../../utils/pagination');
const User = require('./users.model');

const DUPLICATE_KEY = 11000;

function hashPassword(plain) {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Convierte el error de índice único de email en un 409 con mensaje claro. */
function rethrowDuplicate(err) {
  if (err.code === DUPLICATE_KEY && (err.keyPattern?.email || err.keyValue?.email)) {
    throw AppError.conflict('Ya existe un usuario con ese correo.', 'EMAIL_TAKEN');
  }
  throw err;
}

async function list({ page, limit, q, role, active }) {
  const filter = {};
  if (role) filter.role = role;
  if (active !== undefined) filter.active = active;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ name: 1 }).skip(toSkip({ page, limit })).limit(limit),
    User.countDocuments(filter),
  ]);
  return buildPage(items, total, { page, limit });
}

async function getById(id) {
  const user = await User.findById(id);
  if (!user) throw AppError.notFound('Usuario no encontrado.', 'USER_NOT_FOUND');
  return user;
}

async function create({ name, email, password, role }) {
  const passwordHash = await hashPassword(password);
  try {
    return await User.create({ name, email, passwordHash, role });
  } catch (err) {
    return rethrowDuplicate(err);
  }
}

/**
 * Actualiza un usuario. `actorId` es quien hace el cambio: un administrador
 * no puede desactivarse ni quitarse el rol a sí mismo, para que el sistema
 * nunca se quede sin nadie que pueda administrarlo.
 */
async function update(id, changes, actorId) {
  const user = await getById(id);
  const isSelf = String(user._id) === String(actorId);

  if (isSelf && changes.active === false) {
    throw AppError.badRequest('No puedes desactivar tu propio usuario.', undefined, 'SELF_DEACTIVATE');
  }
  if (isSelf && changes.role && changes.role !== user.role) {
    throw AppError.badRequest('No puedes cambiar tu propio rol.', undefined, 'SELF_ROLE_CHANGE');
  }

  const { password, ...rest } = changes;
  Object.assign(user, rest);
  if (password) user.passwordHash = await hashPassword(password);

  try {
    return await user.save();
  } catch (err) {
    return rethrowDuplicate(err);
  }
}

module.exports = { list, getById, create, update, hashPassword };
