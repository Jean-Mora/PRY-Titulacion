const request = require('supertest');
const { createApp } = require('../../src/app');
const { User } = require('../../src/models');
const { useTestDB } = require('../helpers/db');
const { PASSWORD, createUser, loginAs } = require('../helpers/factories');

useTestDB();

const app = createApp({ loginRateLimit: 1000 });

describe('acceso a /api/users', () => {
  test('sin sesión → 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('un vendedor no puede gestionar usuarios → 403', async () => {
    const { authHeader } = await loginAs('vendedor');
    const res = await request(app).get('/api/users').set('Authorization', authHeader);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('GET /api/users', () => {
  test('lista paginada, ordenada por nombre y sin passwordHash', async () => {
    const { authHeader } = await loginAs('admin', { name: 'Zoe Admin' });
    await createUser({ name: 'Bruno' });
    await createUser({ name: 'Ana' });

    const res = await request(app).get('/api/users?limit=2').set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 2, total: 3, pages: 2 });
    expect(res.body.items.map((u) => u.name)).toEqual(['Ana', 'Bruno']);
    expect(res.body.items[0].passwordHash).toBeUndefined();
  });

  test('filtra por rol, estado y texto', async () => {
    const { authHeader } = await loginAs('admin');
    await createUser({ name: 'Carla Vende', role: 'vendedor' });
    await createUser({ name: 'Pedro Baja', role: 'vendedor', active: false });

    const byRole = await request(app).get('/api/users?role=vendedor&active=true').set('Authorization', authHeader);
    expect(byRole.body.items.map((u) => u.name)).toEqual(['Carla Vende']);

    const byText = await request(app).get('/api/users?q=pedro').set('Authorization', authHeader);
    expect(byText.body.items.map((u) => u.name)).toEqual(['Pedro Baja']);
  });

  test('parámetros inválidos → 400', async () => {
    const { authHeader } = await loginAs('admin');
    const res = await request(app).get('/api/users?limit=500&role=jefe').set('Authorization', authHeader);
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toEqual(expect.arrayContaining(['query.limit', 'query.role']));
  });
});

describe('GET /api/users/:id', () => {
  test('devuelve el usuario', async () => {
    const { authHeader } = await loginAs('admin');
    const other = await createUser({ name: 'Marta' });
    const res = await request(app).get(`/api/users/${other._id}`).set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Marta');
  });

  test('id inexistente → 404 e id mal formado → 400', async () => {
    const { authHeader } = await loginAs('admin');
    const missing = await request(app).get('/api/users/64b000000000000000000000').set('Authorization', authHeader);
    const bad = await request(app).get('/api/users/123').set('Authorization', authHeader);
    expect(missing.status).toBe(404);
    expect(bad.status).toBe(400);
  });
});

describe('POST /api/users', () => {
  test('crea un vendedor que luego puede iniciar sesión', async () => {
    const { authHeader } = await loginAs('admin');

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader)
      .send({ name: '  Diana Vendedora ', email: 'Diana@JeanFabri.test', password: 'diana-12345', role: 'vendedor' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Diana Vendedora', email: 'diana@jeanfabri.test', role: 'vendedor', active: true });
    expect(res.body.user.passwordHash).toBeUndefined();

    const stored = await User.findById(res.body.user._id).select('+passwordHash');
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/); // hash de bcrypt, nunca la clave en texto plano

    const login = await request(app).post('/api/auth/login').send({ email: 'diana@jeanfabri.test', password: 'diana-12345' });
    expect(login.status).toBe(200);
  });

  test('correo repetido → 409', async () => {
    const { authHeader } = await loginAs('admin');
    await createUser({ email: 'repetido@jeanfabri.test' });
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader)
      .send({ name: 'Otro', email: 'repetido@jeanfabri.test', password: PASSWORD, role: 'vendedor' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  test('contraseña corta, rol inválido o campos faltantes → 400', async () => {
    const { authHeader } = await loginAs('admin');
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader)
      .send({ email: 'x@jeanfabri.test', password: '123', role: 'jefe' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toEqual(
      expect.arrayContaining(['body.name', 'body.password', 'body.role']),
    );
  });
});

describe('PATCH /api/users/:id', () => {
  test('cambia rol y nombre', async () => {
    const { authHeader } = await loginAs('admin');
    const seller = await createUser({ role: 'vendedor' });
    const res = await request(app)
      .patch(`/api/users/${seller._id}`)
      .set('Authorization', authHeader)
      .send({ role: 'admin', name: 'Nuevo Nombre' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ role: 'admin', name: 'Nuevo Nombre' });
  });

  test('cambiar la contraseña invalida la anterior', async () => {
    const { authHeader } = await loginAs('admin');
    const seller = await createUser({ email: 'clave@jeanfabri.test' });
    await request(app).patch(`/api/users/${seller._id}`).set('Authorization', authHeader).send({ password: 'nueva-clave-99' });

    const oldLogin = await request(app).post('/api/auth/login').send({ email: 'clave@jeanfabri.test', password: PASSWORD });
    const newLogin = await request(app).post('/api/auth/login').send({ email: 'clave@jeanfabri.test', password: 'nueva-clave-99' });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  test('desactivar a un usuario le impide iniciar sesión', async () => {
    const { authHeader } = await loginAs('admin');
    const seller = await createUser({ email: 'baja@jeanfabri.test' });
    const res = await request(app).patch(`/api/users/${seller._id}`).set('Authorization', authHeader).send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.user.active).toBe(false);

    const login = await request(app).post('/api/auth/login').send({ email: 'baja@jeanfabri.test', password: PASSWORD });
    expect(login.status).toBe(403);
  });

  test('un admin no puede desactivarse ni quitarse el rol a sí mismo', async () => {
    const { user, authHeader } = await loginAs('admin');
    const deactivate = await request(app).patch(`/api/users/${user._id}`).set('Authorization', authHeader).send({ active: false });
    const demote = await request(app).patch(`/api/users/${user._id}`).set('Authorization', authHeader).send({ role: 'vendedor' });
    expect(deactivate.status).toBe(400);
    expect(deactivate.body.error.code).toBe('SELF_DEACTIVATE');
    expect(demote.status).toBe(400);
    expect(demote.body.error.code).toBe('SELF_ROLE_CHANGE');
  });

  test('cambiar el correo a uno ya usado → 409', async () => {
    const { authHeader } = await loginAs('admin');
    await createUser({ email: 'ocupado@jeanfabri.test' });
    const other = await createUser();
    const res = await request(app)
      .patch(`/api/users/${other._id}`)
      .set('Authorization', authHeader)
      .send({ email: 'ocupado@jeanfabri.test' });
    expect(res.status).toBe(409);
  });

  test('cuerpo vacío o campos desconocidos → 400', async () => {
    const { authHeader } = await loginAs('admin');
    const other = await createUser();
    const empty = await request(app).patch(`/api/users/${other._id}`).set('Authorization', authHeader).send({});
    const unknown = await request(app)
      .patch(`/api/users/${other._id}`)
      .set('Authorization', authHeader)
      .send({ passwordHash: 'x' });
    expect(empty.status).toBe(400);
    expect(unknown.status).toBe(400);
  });
});
