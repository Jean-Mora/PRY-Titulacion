/**
 * Configuración de PM2 para EC2.
 *
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload jean-fabri-api        (sin cortar el servicio)
 *
 * Modo cluster con 1 instancia: en `reload` PM2 levanta la nueva instancia,
 * espera su señal "ready" (server.js) y recién entonces apaga la anterior.
 * Se mantiene en 1 instancia porque Socket.io con varias necesitaría sesiones
 * "sticky" y un adaptador compartido; para una papelería sobra con una.
 */
module.exports = {
  apps: [
    {
      name: 'jean-fabri-api',
      script: 'src/server.js',
      exec_mode: 'cluster',
      instances: 1,
      wait_ready: true,
      listen_timeout: 15000,
      kill_timeout: 10000,
      max_memory_restart: '400M',
      time: true,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
