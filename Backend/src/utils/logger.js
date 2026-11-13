/**
 * Logger mínimo. Escribe en stdout/stderr con fecha y nivel; PM2 guarda esa
 * salida en sus archivos de log. En pruebas queda en silencio.
 */
const silent = process.env.NODE_ENV === 'test';

function write(level, args) {
  if (silent) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()}`;
  // eslint-disable-next-line no-console
  (level === 'error' || level === 'warn' ? console.error : console.log)(line, ...args);
}

module.exports = {
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
};
