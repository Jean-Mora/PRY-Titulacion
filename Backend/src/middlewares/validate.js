/**
 * Valida body, params y query con esquemas de zod antes del controlador.
 *
 *   router.post('/', validate({ body: createUserSchema }), controller.create)
 *
 * Los valores ya validados y convertidos (trim, números, valores por defecto)
 * quedan en req.validated = { body, params, query }. req.body también se
 * reemplaza por la versión limpia. (En Express 5 req.query es de solo lectura,
 * por eso se usa req.validated.)
 *
 * Si algo no cumple, responde 400 con details = [{ field, message }].
 */
const { z } = require('zod');
const AppError = require('../utils/AppError');

// Mensajes de zod en español para las reglas que no tengan mensaje propio.
z.config(z.locales.es());

const SOURCES = ['params', 'query', 'body'];

function validate(schemas) {
  return function validator(req, _res, next) {
    const validated = {};
    const details = [];

    for (const source of SOURCES) {
      const schema = schemas[source];
      if (!schema) continue;
      const result = schema.safeParse(req[source] ?? {});
      if (result.success) {
        validated[source] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({ field: [source, ...issue.path].join('.'), message: issue.message });
        }
      }
    }

    if (details.length > 0) {
      throw AppError.badRequest('Revisa los datos enviados.', details, 'VALIDATION_ERROR');
    }

    req.validated = validated;
    if (validated.body) req.body = validated.body;
    next();
  };
}

module.exports = validate;
