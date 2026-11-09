import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext.jsx';

/** Respuesta falsa de fetch con cuerpo JSON. */
export function jsonResponse(body, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

/** Reemplaza fetch por una función que responde según "MÉTODO ruta". */
export function mockFetch(routes) {
  const fn = vi.fn((url, init = {}) => {
    const key = `${init.method ?? 'GET'} ${new URL(url, 'http://localhost').pathname}`;
    const handler = routes[key];
    if (!handler) return jsonResponse({ message: `Sin mock para ${key}` }, 404);
    return handler(url, init);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** Renderiza con router en memoria y sesión real (AuthProvider). */
export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}
