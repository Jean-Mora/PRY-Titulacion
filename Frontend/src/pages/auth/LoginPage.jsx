import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Spinner from '../../components/Spinner.jsx';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { BrandMark } from '../../layouts/PublicLayout.jsx';

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="relative flex min-h-screen flex-col items-center bg-slate-50 px-4 pb-10 pt-14 sm:pt-20 dark:bg-slate-950">
      {/* Fondo decorativo: una franja azul arriba, como la cabecera de un cuaderno. El título va dentro de la franja y la tarjeta la cruza. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-72 bg-brand-700 sm:h-80 dark:bg-brand-950" />
      <ThemeToggle className="absolute right-4 top-4 text-white hover:bg-white/10 hover:text-white dark:text-slate-300" />

      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="mb-6 text-center text-white">
          <BrandMark className="mx-auto h-14 w-14 text-2xl shadow-lg ring-4 ring-white/20" />
          <h1 className="mt-4 text-2xl font-bold">Panel Jean-Fabri</h1>
          <p className="mt-1 text-sm text-brand-100">Inicia sesión para gestionar el inventario.</p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {serverError && <Alert>{serverError}</Alert>}
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
          <div className="relative">
            <Input
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              className="[&_input]:pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              className="absolute right-1 top-[1.85rem] inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-5 w-5" />
            </button>
          </div>
          <Button type="submit" fullWidth size="lg" loading={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-brand-700 hover:underline dark:text-brand-400">
            <Icon name="arrowLeft" className="h-4 w-4" />
            Volver al catálogo
          </Link>
        </p>
      </div>
    </div>
  );
}
