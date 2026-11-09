import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import PublicLayout from './layouts/PublicLayout.jsx';
import CatalogPage from './pages/catalog/CatalogPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import { ADMIN_SECTIONS } from './routes/adminRoutes.js';
import { ROLES } from './utils/roles.js';
import Spinner from './components/Spinner.jsx';
import EmptyState from './components/EmptyState.jsx';

// División de código por zona: el visitante del catálogo no descarga el panel.
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage.jsx'));
const UpcomingPage = lazy(() => import('./pages/admin/UpcomingPage.jsx'));

// Pantallas ya construidas; las demás secciones muestran UpcomingPage.
const ADMIN_PAGES = {
  '': DashboardPage,
};

export default function App() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <Routes>
        {/* Zona pública */}
        <Route element={<PublicLayout />}>
          <Route index element={<CatalogPage />} />
          <Route path="categoria/:slug" element={<CatalogPage />} />
          <Route
            path="producto/:slug"
            element={<EmptyState icon="🖊️" title="Detalle de producto" description="Disponible en el incremento 4." />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Zona de administración */}
        <Route path="admin/login" element={<LoginPage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.VENDEDOR]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {ADMIN_SECTIONS.map((section) => {
            const Page = ADMIN_PAGES[section.path];
            const element = Page ? <Page /> : <UpcomingPage section={section} />;
            return (
              <Route key={section.path || 'index'} element={<ProtectedRoute roles={section.roles} />}>
                {section.path === '' ? <Route index element={element} /> : <Route path={section.path} element={element} />}
              </Route>
            );
          })}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
