import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

/** Simula la preferencia de color del sistema operativo. */
function mockSystemDark(matches) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
}

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );

beforeEach(() => document.documentElement.classList.remove('dark'));
afterEach(() => vi.unstubAllGlobals());

describe('ThemeToggle', () => {
  it('por defecto sigue al sistema (oscuro → clase dark en <html>)', () => {
    mockSystemDark(true);
    renderToggle();
    expect(screen.getByRole('button', { name: /Tema del sistema/ })).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('cicla sistema → claro → oscuro → sistema y guarda la preferencia', async () => {
    mockSystemDark(false);
    const user = userEvent.setup();
    renderToggle();
    const button = screen.getByRole('button');

    await user.click(button);
    expect(button).toHaveAccessibleName(/Tema claro/);
    expect(localStorage.getItem('jf_theme')).toBe('light');
    expect(document.documentElement).not.toHaveClass('dark');

    await user.click(button);
    expect(button).toHaveAccessibleName(/Tema oscuro/);
    expect(localStorage.getItem('jf_theme')).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');

    await user.click(button);
    expect(button).toHaveAccessibleName(/Tema del sistema/);
    expect(localStorage.getItem('jf_theme')).toBeNull();
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('respeta la preferencia guardada aunque el sistema esté en claro', () => {
    mockSystemDark(false);
    localStorage.setItem('jf_theme', 'dark');
    renderToggle();
    expect(document.documentElement).toHaveClass('dark');
  });
});
