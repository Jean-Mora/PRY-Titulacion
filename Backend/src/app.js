/**
 * Aplicación Express: middlewares globales y montaje de rutas.
 *
 * createApp() no abre puertos ni conecta a la base; eso lo hace server.js.
 * Así las pruebas con Supertest crean una app nueva por archivo.
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const { isDBConnected } = require('./config/db');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const productsRoutes = require('./modules/products/products.routes');

function createApp(options = {}) {
  const { loginRateLimit = env.LOGIN_RATE_LIMIT } = options;
  const app = express();

  // Detrás de CloudFront: la IP real del cliente viene en X-Forwarded-For.
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet());
  // En producción frontend y API comparten dominio (CloudFront), así que CORS
  // solo se activa si CORS_ORIGIN tiene valores (p. ej. pruebas locales sin proxy).
  if (env.CORS_ORIGIN.length > 0) app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));

  // Salud del servicio: la usa el despliegue (y el balanceo, si se agrega) para saber si está arriba.
  app.get('/api/health', (_req, res) => {
    const db = isDBConnected();
    res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db, uptime: Math.round(process.uptime()) });
  });

  app.use('/api/auth', authRoutes({ loginRateLimit }));
  app.use('/api/users', usersRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/products', productsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
