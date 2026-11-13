/**
 * Error de negocio con código HTTP. Los servicios lanzan AppError y
 * errorHandler lo convierte en la respuesta uniforme:
 *   { error: { code, message, details? } }
 */
class AppError extends Error {
  /**
   * @param {number} status  Código HTTP (400, 401, 403, 404, 409…)
   * @param {string} code    Código estable para el frontend (p. ej. "INVALID_CREDENTIALS")
   * @param {string} message Mensaje en español, apto para mostrar al usuario
   * @param {unknown} [details] Información extra (p. ej. errores por campo)
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
  }

  static badRequest(message, details, code = 'BAD_REQUEST') {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message = 'Debes iniciar sesión.', code = 'UNAUTHORIZED') {
    return new AppError(401, code, message);
  }

  static forbidden(message = 'No tienes permiso para realizar esta acción.', code = 'FORBIDDEN') {
    return new AppError(403, code, message);
  }

  static notFound(message = 'Recurso no encontrado.', code = 'NOT_FOUND') {
    return new AppError(404, code, message);
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(409, code, message);
  }
}

module.exports = AppError;
