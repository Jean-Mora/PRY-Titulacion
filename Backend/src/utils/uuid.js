/**
 * Identificadores aleatorios (UUID v4) con el módulo crypto de Node.
 * Se usarán para nombrar las imágenes en S3 (incremento 2).
 */
const { randomUUID } = require('node:crypto');

module.exports = { uuid: () => randomUUID() };
