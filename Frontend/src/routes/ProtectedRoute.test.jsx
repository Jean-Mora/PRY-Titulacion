import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import ProtectedRoute from './ProtectedRoute.jsx';
import { setToken } from '../api/http.js';
import { jsonResponse, mockFetch, renderWithProviders } from '../test/utils.jsx';

afterEach(() => vi.unstubAllGlobals());

function renderAt(route, roles) {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/login" element={<p>Pantalla de login</p>} />
      <Route element={<ProtectedRoute roles={roles} />}>
        <Route path="/admin/secreto" element={<p>Contenido protegido</p>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('ProtectedRoute', () => {
  it('sin sesión redirige a /admin/login', async () => {
    renderAt('/admin/secreto', ['admin']);
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
  });

  it('con sesión y rol permitido muestra el contenido', async () => {
    setToken('t');
    mockFetch({ 'GET /api/auth/me': () => jsonResponse({ user: { name: 'Ana', role: 'admin' } }) });
    renderAt('/admin/secreto', ['admin']);
    expect(await screen.findByText('Contenido protegido')).toBeInTheDocument();
  });

  it('con sesión pero sin rol muestra acceso restringido', async () => {
    setToken('t');
    mockFetch({ 'GET /api/auth/me': () => jsonResponse({ user: { name: 'Luis', role: 'vendedor' } }) });
    renderAt('/admin/secreto', ['admin']);
    expect(await screen.findByText('Acceso restringido')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('con token inválido limpia la sesión y redirige al login', async () => {
    setToken('malo');
    mockFetch({ 'GET /api/auth/me': () => jsonResponse({ message: 'Token inválido' }, 401) });
    renderAt('/admin/secreto', ['admin']);
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
    expect(localStorage.getItem('jf_token')).toBeNull();
  });
});
