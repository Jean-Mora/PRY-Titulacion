const request = require('supertest');
const jwt = require('jsonwebtoken');
const env = require('../../src/config/env');
const { createApp } = require('../../src/app');
const { useTestDB } = require('../helpers/db');
const { PASSWORD, createUser } = require('../helpers/factories');

useTestDB();

const app = createApp({ loginRateLimit: 1000 });

describe('POST /api/auth/login', () => {
  test('con credenciales correctas devuelve token y usuario sin passwordHash', async () => {
    const user = await createUser({ email: 'ana@jeanfabri.test', role: 'admin' });

    const res = await request(app).post('/api/auth/login').send({ email: 'ana@jeanfabri.test', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ _id: String(user._id), email: 'ana@jeanfabri.test', role: 'admin' });
    expect(res.body.user.passwordHash).toBeUndefined();

    const payload = jwt.verify(res.body.token, env.JWT_SECRET);
    expect(payload.sub).toBe(String(user._id));
    expect(payload.exp - payload.iat).toBe(8 * 60 * 60); // 8 horas
  });

  test('el correo no distingue mayúsculas ni espacios', async () => {
    await createUser({ email: 'luis@jeanfabri.test' });
    const res = await request(app).post('/api/auth/login').send({ email: '  LUIS@JeanFabri.test ', password: PASSWORD });
    expect(res.status).toBe(200);
  });

  test('contraseña incorrecta → 401 con el mismo mensaje que un correo inexistente', async () => {
    await createUser({ email: 'ana@jeanfabri.test' });

    const wrongPass = await request(app).post('/api/auth/login').send({ email: 'ana@jeanfabri.test', password: 'otra-clave' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nadie@jeanfabri.test', password: PASSWORD });

    expect(wrongPass.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPass.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.body.error).toEqual(wrongPass.body.error);
  });

  test('usuario desactivado → 403', async () => {
    await createUser({ email: 'baja@jeanfabri.test', active: false });
    const res = await request(app).post('/api/auth/login').send({ email: 'baja@jeanfabri.test', password: PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('USER_INACTIVE');
  });

  test('datos inválidos → 400 con detalle por campo', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'no-es-correo' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['body.email', 'body.password']));
  });

  test('JSON mal formado → 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  test('limita los intentos fallidos por IP → 429', async () => {
    const limited = createApp({ loginRateLimit: 3 });
    const attempt = () => request(limited).post('/api/auth/login').send({ email: 'x@jeanfabri.test', password: 'mala' });

    for (let i = 0; i < 3; i += 1) expect((await attempt()).status).toBe(401);
    const res = await attempt();
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_ATTEMPTS');
  });
});

describe('GET /api/auth/me', () => {
  async function tokenFor(user) {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    return res.body.token;
  }

  test('con token válido devuelve el usuario actual', async () => {
    const user = await createUser({ role: 'vendedor' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${await tokenFor(user)}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ _id: String(user._id), role: 'vendedor' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('sin token → 401 TOKEN_MISSING', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  test('token alterado → 401 TOKEN_INVALID', async () => {
    const user = await createUser();
    const token = await tokenFor(user);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}x`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  test('token firmado con otro secreto → 401', async () => {
    const user = await createUser();
    const forged = jwt.sign({ sub: String(user._id), role: 'admin' }, 'otro-secreto-cualquiera-de-32-caracteres!');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('token vencido → 401 TOKEN_EXPIRED', async () => {
    const user = await createUser();
    const expired = jwt.sign({ sub: String(user._id), role: user.role, exp: Math.floor(Date.now() / 1000) - 10 }, env.JWT_SECRET);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  test('si el usuario se desactiva, su token deja de servir', async () => {
    const user = await createUser();
    const token = await tokenFor(user);
    user.active = false;
    await user.save();

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('USER_INACTIVE');
  });
});

describe('rutas generales', () => {
  test('GET /api/health responde ok con la base conectada', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', db: true });
  });

  test('ruta inexistente → 404 con formato uniforme', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: 'ROUTE_NOT_FOUND' });
  });

  test('aplica cabeceras de seguridad (helmet)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
