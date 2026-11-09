/**
 * Pruebas unitarias de middlewares (sin base de datos).
 */
const express = require('express');
const request = require('supertest');
const { z } = require('zod');
const mongoose = require('mongoose');
const requireRole = require('../../src/middlewares/requireRole');
const validate = require('../../src/middlewares/validate');
const { uploadImage } = require('../../src/middlewares/upload');
const { errorHandler, notFound } = require('../../src/middlewares/errorHandler');
const { extractToken } = require('../../src/middlewares/auth');
const AppError = require('../../src/utils/AppError');

/** Monta una mini app con las rutas dadas y el manejador de errores real. */
function appWith(register) {
  const app = express();
  app.use(express.json());
  register(app);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

describe('requireRole', () => {
  const withUser = (role) => (req, _res, next) => {
    req.user = role ? { id: '1', role } : undefined;
    next();
  };

  test.each([
    ['admin', 200],
    ['vendedor', 403],
    [undefined, 401],
  ])('rol %s → %i', async (role, status) => {
    const app = appWith((a) => a.get('/x', withUser(role), requireRole('admin'), (_req, res) => res.json({ ok: true })));
    expect((await request(app).get('/x')).status).toBe(status);
  });

  test('acepta varios roles', async () => {
    const app = appWith((a) =>
      a.get('/x', withUser('vendedor'), requireRole('admin', 'vendedor'), (_req, res) => res.json({ ok: true })),
    );
    expect((await request(app).get('/x')).status).toBe(200);
  });
});

describe('validate', () => {
  const app = appWith((a) =>
    a.post(
      '/items/:id',
      validate({
        params: z.object({ id: z.string().length(3) }),
        query: z.object({ page: z.coerce.number().int().default(1) }),
        body: z.object({ name: z.string().trim().min(1) }),
      }),
      (req, res) => res.json(req.validated),
    ),
  );

  test('entrega los valores limpios y convertidos en req.validated', async () => {
    const res = await request(app).post('/items/abc?page=3').send({ name: '  Lápiz  ' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ params: { id: 'abc' }, query: { page: 3 }, body: { name: 'Lápiz' } });
  });

  test('reúne los errores de todas las fuentes', async () => {
    const res = await request(app).post('/items/abcd?page=x').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['body.name', 'params.id', 'query.page']);
  });

  test('los mensajes por defecto de zod salen en español', async () => {
    const res = await request(app).post('/items/abc').send({ name: 5 });
    expect(res.body.error.details[0].message).toMatch(/esperado|inválid/i);
  });
});

describe('errorHandler', () => {
  test('AppError conserva status, code, message y details', async () => {
    const app = appWith((a) =>
      a.get('/x', () => {
        throw AppError.badRequest('Mal', [{ field: 'a', message: 'b' }], 'MI_CODIGO');
      }),
    );
    const res = await request(app).get('/x');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'MI_CODIGO', message: 'Mal', details: [{ field: 'a', message: 'b' }] } });
  });

  test('errores async de Express 5 llegan al manejador', async () => {
    const app = appWith((a) =>
      a.get('/x', async () => {
        throw AppError.notFound('No está');
      }),
    );
    const res = await request(app).get('/x');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('No está');
  });

  test('errores inesperados → 500 sin filtrar detalles internos', async () => {
    const app = appWith((a) =>
      a.get('/x', () => {
        throw new Error('conexión a 10.0.0.5 rechazada');
      }),
    );
    const res = await request(app).get('/x');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('10.0.0.5');
  });

  test('traduce ValidationError, CastError y clave duplicada de Mongoose', async () => {
    const validation = new mongoose.Error.ValidationError();
    validation.addError('price', new mongoose.Error.ValidatorError({ path: 'price', message: 'El precio es obligatorio' }));
    const cast = new mongoose.Error.CastError('ObjectId', 'abc', '_id');
    const dup = Object.assign(new Error('E11000'), { code: 11000, keyValue: { sku: 'A1' } });

    const app = appWith((a) => {
      a.get('/validation', () => { throw validation; });
      a.get('/cast', () => { throw cast; });
      a.get('/dup', () => { throw dup; });
    });

    const v = await request(app).get('/validation');
    expect(v.status).toBe(400);
    expect(v.body.error.details).toEqual([{ field: 'price', message: 'El precio es obligatorio' }]);
    expect((await request(app).get('/cast')).status).toBe(400);
    const d = await request(app).get('/dup');
    expect(d.status).toBe(409);
    expect(d.body.error.message).toContain('sku');
  });
});

describe('upload', () => {
  const app = appWith((a) =>
    a.post('/img', uploadImage, (req, res) => res.json({ size: req.file.size, type: req.file.mimetype })),
  );

  test('acepta una imagen PNG en memoria', async () => {
    const res = await request(app).post('/img').attach('image', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
      filename: 'foto.png',
      contentType: 'image/png',
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ size: 4, type: 'image/png' });
  });

  test('rechaza tipos no permitidos → 400', async () => {
    const res = await request(app).post('/img').attach('image', Buffer.from('hola'), {
      filename: 'virus.exe',
      contentType: 'application/octet-stream',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });
});

describe('extractToken', () => {
  const fakeReq = (value) => ({ get: () => value });
  test.each([
    ['Bearer abc.def', 'abc.def'],
    ['bearer abc', 'abc'],
    ['Basic abc', null],
    ['Bearer', null],
    [undefined, null],
  ])('%s → %s', (header, expected) => {
    expect(extractToken(fakeReq(header))).toBe(expected);
  });
});
