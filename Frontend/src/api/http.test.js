import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getToken, http, onUnauthorized, setToken } from './http.js';
import { jsonResponse, mockFetch } from '../test/utils.jsx';

afterEach(() => vi.unstubAllGlobals());

describe('api/http', () => {
  it('envía JSON y agrega el JWT en Authorization', async () => {
    setToken('abc');
    const fetchMock = mockFetch({ 'POST /api/x': () => jsonResponse({ ok: true }) });

    const data = await http.post('/api/x', { a: 1 });

    expect(data).toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer abc');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"a":1}');
  });

  it('no envía Authorization sin token', async () => {
    const fetchMock = mockFetch({ 'GET /api/x': () => jsonResponse({}) });
    await http.get('/api/x');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('lanza ApiError con el mensaje del backend', async () => {
    mockFetch({ 'GET /api/x': () => jsonResponse({ error: { message: 'Producto no existe' } }, 404) });
    await expect(http.get('/api/x')).rejects.toMatchObject({ name: 'ApiError', status: 404, message: 'Producto no existe' });
  });

  it('ante 401 con token borra el token y avisa a la sesión', async () => {
    setToken('vencido');
    const handler = vi.fn();
    const off = onUnauthorized(handler);
    mockFetch({ 'GET /api/x': () => jsonResponse({ message: 'Token expirado' }, 401) });

    await expect(http.get('/api/x')).rejects.toBeInstanceOf(ApiError);
    expect(getToken()).toBeNull();
    expect(handler).toHaveBeenCalledOnce();
    off();
  });

  it('ante 401 sin token (login fallido) no cierra sesión', async () => {
    const handler = vi.fn();
    const off = onUnauthorized(handler);
    mockFetch({ 'POST /api/auth/login': () => jsonResponse({ message: 'Credenciales inválidas' }, 401) });

    await expect(http.post('/api/auth/login', {})).rejects.toMatchObject({ status: 401 });
    expect(handler).not.toHaveBeenCalled();
    off();
  });

  it('traduce un fallo de red en ApiError status 0', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(http.get('/api/x')).rejects.toMatchObject({ status: 0 });
  });
});
