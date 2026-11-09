import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import LoginPage from './LoginPage.jsx';
import { jsonResponse, mockFetch, renderWithProviders } from '../../test/utils.jsx';

afterEach(() => vi.unstubAllGlobals());

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<p>Panel cargado</p>} />
    </Routes>,
    { route: '/admin/login' },
  );
}

describe('LoginPage', () => {
  it('valida los campos antes de llamar a la API', async () => {
    const fetchMock = mockFetch({});
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('inicia sesión, guarda el token y entra al panel', async () => {
    mockFetch({
      'POST /api/auth/login': () => jsonResponse({ token: 'jwt-123', user: { name: 'Ana', role: 'admin' } }),
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@jeanfabri.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreta');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Panel cargado')).toBeInTheDocument();
    expect(localStorage.getItem('jf_token')).toBe('jwt-123');
  });

  it('muestra un error con credenciales incorrectas', async () => {
    mockFetch({ 'POST /api/auth/login': () => jsonResponse({ message: 'Credenciales inválidas' }, 401) });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@jeanfabri.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
    expect(localStorage.getItem('jf_token')).toBeNull();
  });
});
