import { http } from './http.js';

/**
 * Endpoints del módulo auth del backend.
 *
 * Contrato esperado (alinear con el backend):
 *   POST /api/auth/login  { email, password }  →  { token, user }
 *   GET  /api/auth/me                          →  { user }  (o el usuario directo)
 * user = { _id, name, email, role: 'admin' | 'vendedor' }
 */

export async function login(email, password) {
  const data = await http.post('/api/auth/login', { email, password });
  if (!data?.token) throw new Error('Respuesta de inicio de sesión inválida.');
  return { token: data.token, user: data.user ?? null };
}

export async function me(opts) {
  const data = await http.get('/api/auth/me', opts);
  return data?.user ?? data;
}
