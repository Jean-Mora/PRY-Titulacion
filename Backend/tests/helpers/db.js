/**
 * Base de datos de pruebas en memoria (mongodb-memory-server).
 * Uso en cada archivo:  useTestDB();
 * Levanta un MongoDB aislado, crea los índices de los 5 modelos y vacía las
 * colecciones entre pruebas.
 */
const os = require('node:os');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const models = require('../../src/models');

// El driver de MongoDB 7 carga `os` con import() dinámico, que Jest (modo
// CommonJS) no soporta: el handshake sale sin metadatos y el servidor rechaza
// la conexión ("Missing required sub-document 'driver'"). Se le entrega el
// módulo directamente. Fuera de Jest (npm start) no hace falta.
const runtimeAdapters = { os };

function useTestDB() {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), { runtimeAdapters });
    await Promise.all(Object.values(models).map((m) => m.init()));
  });

  afterEach(async () => {
    await Promise.all(Object.values(models).map((m) => m.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod?.stop();
  });
}

module.exports = { useTestDB };
