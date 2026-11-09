import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import { hasRole } from '../utils/roles.js';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';

/**
 * Exige sesión y, opcionalmente, uno de los roles indicados.
 *  - Mientras se valida la sesión guardada muestra un spinner.
 *  - Sin sesión redirige a /admin/login recordando la ruta pedida.
 *  - Con sesión pero sin rol muestra "Acceso restringido".
 * El backend vuelve a validar el rol en cada endpoint: esto es solo UX.
 *
 * Uso: como ruta envolvente (<Route element={<ProtectedRoute roles={[...]}/>}>)
 * o envolviendo un elemento (<ProtectedRoute><Pagina/></ProtectedRoute>).
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Spinner fullScreen label="Verificando sesión…" />;

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!hasRole(user, roles)) {
    return (
      <EmptyState
        icon="🔒"
        title="Acceso restringido"
        description="Tu rol no tiene permiso para ver esta sección. Si crees que es un error, habla con el administrador."
      />
    );
  }

  return children ?? <Outlet />;
}
