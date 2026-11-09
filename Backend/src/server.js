/**
 * Arranque: conecta a MongoDB Atlas, crea el servidor HTTP con Socket.io y
 * escucha en PORT. Maneja el apagado ordenado para `pm2 reload`.
 */
const http = require('node:http');
const { Server } = require('socket.io');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { createApp } = require('./app');
const { initStockSocket } = require('./sockets/stock');
const logger = require('./utils/logger');
require('./models'); // registra los 5 modelos y sus índices

async function start() {
  await connectDB(env.MONGODB_URI);

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    // Mismo dominio que el frontend (CloudFront); CORS solo para desarrollo sin proxy.
    cors: env.CORS_ORIGIN.length > 0 ? { origin: env.CORS_ORIGIN } : undefined,
  });
  initStockSocket(io);

  server.listen(env.PORT, () => {
    logger.info(`API escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
    // PM2 (wait_ready) espera esta señal antes de dar por iniciada la nueva instancia.
    process.send?.('ready');
  });

  let closing = false;
  async function shutdown(signal) {
    if (closing) return;
    closing = true;
    logger.info(`${signal} recibido, cerrando…`);
    io.close();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Si alguna conexión no se cierra a tiempo, se fuerza la salida.
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  logger.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});
