import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Spinner from '../../components/Spinner.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Ingresa tu correo.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'El correo no tiene un formato válido.';
  if (!password) errors.password = 'Ingresa tu contraseña.';
  return errors;
}

/** Inicio de sesión del panel (/admin/login) para administradores y vendedores. */
export default function LoginPage() {
  const { login, status, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'loading') return <Spinner fullScreen label="Verificando sesión…" />;
  if (isAuthenticated && !submitting) return <Navigate to={from} replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        err.status === 401 || err.status === 400
          ? 'Correo o contraseña incorrectos.'
          : err.status === 429
            ? 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
            : err.message || 'No se pudo iniciar sesión.',
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-amber-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-2xl font-bold text-white shadow-lg">
            JF
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Panel Jean-Fabri</h1>
          <p className="mt-1 text-sm text-slate-600">Inicia sesión para gestionar el inventario.</p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {serverError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {serverError}
            </div>
          )}
          <Input
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="usuario@jeanfabri.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoFocus
          />
          <Input
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <Button type="submit" fullWidth size="lg" loading={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="font-medium text-brand-700 hover:underline">
            ← Volver al catálogo
          </Link>
        </p>
      </div>
    </div>
  );
}
