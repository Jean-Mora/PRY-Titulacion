/**
 * Variables de entorno validadas.
 *
 * Es el ÚNICO archivo que lee process.env. El resto del código importa `env`
 * y recibe valores ya convertidos (números, listas) y con valores por defecto.
 * Si falta una variable obligatoria, el proceso termina al arrancar con un
 * mensaje claro, en lugar de fallar más tarde en medio de una petición.
 */
const fs = require('node:fs');
const path = require('node:path');
const { z } = require('zod');

// Carga .env si existe (Node >= 20.12 trae el lector integrado; no hace falta dotenv).
const envFile = path.resolve(__dirname, '../../.env');
if (process.env.NODE_ENV !== 'test' && fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const isTest = process.env.NODE_ENV === 'test';

const list = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // En pruebas la conexión la crea mongodb-memory-server, no Atlas.
  MONGODB_URI: isTest ? z.string().optional() : z.string().min(1, 'MONGODB_URI es obligatoria'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  // Orígenes permitidos para CORS (separados por coma). En producción va vacío:
  // CloudFront sirve frontend y API desde el mismo dominio.
  CORS_ORIGIN: list,
  // Saltos de proxy de confianza (CloudFront → EC2 = 1). Necesario para que el
  // límite de intentos de login use la IP real del cliente.
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  LOGIN_RATE_LIMIT: z.coerce.number().int().positive().default(10),

  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET_IMAGES: z.string().optional(),
});

const testDefaults = isTest
  ? { JWT_SECRET: 'secreto-de-pruebas-que-no-se-usa-en-produccion', BCRYPT_ROUNDS: '4' }
  : {};

const parsed = schema.safeParse({ ...testDefaults, ...process.env });

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  // eslint-disable-next-line no-console
  console.error(`Variables de entorno inválidas:\n${lines.join('\n')}\nRevisa el archivo .env (ver .env.example).`);
  process.exit(1);
}

module.exports = Object.freeze({
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
});
