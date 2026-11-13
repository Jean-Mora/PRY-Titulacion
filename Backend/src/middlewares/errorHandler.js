/**
 * Respuesta de error uniforme para toda la API:
 *
 *   { "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [...] } }
 *
 * El frontend (src/api/http.js) lee error.message para mostrarlo.
 * Express 5 envía aquí también los errores de funciones async, sin try/catch.
 */
const mongoose = require('mongoose');
const multer = require('multer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const DUPLICATE_KEY = 11000;

/** Traduce errores conocidos de librerías a AppError. */
function normalize(err) {
  if (err instanceof AppError) return err;

  // JSON mal formado en el body.
  if (err.type === 'entity.parse.failed') {
    return AppError.badRequest('El cuerpo de la petición no es un JSON válido.', undefined, 'INVALID_JSON');
  }
  if (err.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'La petición es demasiado grande.');
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return AppError.badRequest('Revisa los datos enviados.', details, 'VALIDATION_ERROR');
  }
  if (err instanceof mongoose.Error.CastError) {
    return AppError.badRequest(`Valor inválido para ${err.path}.`, undefined, 'INVALID_ID');
  }
  if (err.code === DUPLICATE_KEY) {
    const fields = Object.keys(err.keyValue || err.keyPattern || {});
    return AppError.conflict(
      `Ya existe un registro con ese valor${fields.length ? ` (${fields.join(', ')})` : ''}.`,
      'DUPLICATE',
    );
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera el tamaño permitido.' : 'Archivo inválido.';
    return AppError.badRequest(message, undefined, err.code);
  }

  return null;
}

/** 404 para rutas que no existen. Se monta después de todas las rutas. */
function notFound(req, _res, next) {
  next(AppError.notFound(`No existe la ruta ${req.method} ${req.originalUrl}.`, 'ROUTE_NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars -- Express reconoce el manejador por sus 4 argumentos
function errorHandler(err, req, res, _next) {
  const known = normalize(err);

  if (!known) {
    // Error inesperado: se registra completo, pero al cliente no se le filtran detalles internos.
    logger.error(`${req.method} ${req.originalUrl}`, err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado. Intenta de nuevo.' },
    });
  }

  const body = { code: known.code, message: known.message };
  if (known.details !== undefined) body.details = known.details;
  return res.status(known.status).json({ error: body });
}

module.exports = { errorHandler, notFound };
