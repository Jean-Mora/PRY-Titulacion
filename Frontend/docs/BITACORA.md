# Bitácora del frontend

Registro de lo que se agrega en cada incremento del plan, con el motivo de cada decisión.
Cada entrada indica la fecha, la rama y los archivos afectados.

| Semanas | Incremento | Estado |
|---|---|---|
| 1–2 | 1. Arquitectura y autenticación | ✅ Completado (pendiente integración con el backend real) |
| 3–4 | 2. Productos e importación | Pendiente |
| 5–6 | 3. Inventario | Pendiente |
| 7–8 | 4. Catálogo público | Pendiente |
| 9 | 5. Cotizaciones | Pendiente |
| 10 | 6. Reportes y validación | Pendiente |
| 11 | 7. Go-Live | Pendiente |

---

## Incremento 1 — Arquitectura y autenticación (semanas 1–2)

- **Fecha:** 8 de noviembre de 2026
- **Rama:** `inc-1/auth` (se fusiona a `main` al cierre del incremento, según el plan)
- **Entregable del plan:** Proyecto Vite + Tailwind, AuthContext, LoginPage, ProtectedRoute, layouts.

### 1. Proyecto base (Vite + React + Tailwind)

| Archivo | Qué se agregó |
|---|---|
| `package.json` | Dependencias: `react`, `react-dom`, `react-router`. Desarrollo: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `jsdom`, `@testing-library/*`. Scripts `dev`, `build`, `preview`, `test`. |
| `vite.config.js` | Plugins de React y Tailwind. Proxy de `/api` y `/socket.io` (con WebSocket) hacia el backend en desarrollo. Configuración de Vitest (jsdom). |
| `index.html` | Documento base en español, meta de descripción y color de tema. |
| `src/index.css` | Importa Tailwind v4 y define la paleta de la marca (`brand-*` azul, `accent-*` amarillo). |
| `src/main.jsx` | Monta la app dentro de `BrowserRouter` y `AuthProvider`. |
| `.env.example` | `VITE_API_URL`, `VITE_DEV_API_TARGET`, `VITE_WHATSAPP_NUMBER`. |
| `.gitignore` | Excluye `node_modules/`, `dist/`, `.env`. |

**Decisiones**
- Tailwind v4 se integra con el plugin de Vite; ya no necesita `tailwind.config.js` ni PostCSS.
  Los colores propios se declaran en `@theme` dentro de `index.css`.
- Se usa el paquete `react-router` (en v7+ reemplaza a `react-router-dom`).
- El proxy de desarrollo replica lo que hará CloudFront en producción: el frontend llama siempre a
  rutas relativas (`/api/...`) y no hay problemas de CORS.

### 2. Comunicación con el backend (`src/api/`)

| Archivo | Qué se agregó |
|---|---|
| `api/http.js` | Cliente HTTP único. Agrega `Authorization: Bearer <token>`, serializa JSON, convierte errores en `ApiError` (con `status` y mensaje del backend), traduce fallos de red a un mensaje claro y, ante un **401 con token**, borra el token y avisa a la sesión. Guarda el token en `localStorage` (`jf_token`). |
| `api/auth.js` | `login(email, password)` → `POST /api/auth/login`; `me()` → `GET /api/auth/me`. |

**Decisiones**
- Un 401 **sin** token (credenciales incorrectas en el login) no cierra sesión; solo se muestra el error.
- `http.js` no depende de React: avisa del 401 mediante `onUnauthorized(handler)`, que registra el `AuthContext`.

### 3. Sesión (`AuthContext` + `useAuth`)

| Archivo | Qué se agregó |
|---|---|
| `context/AuthContext.jsx` | Guarda `user` y `status` (`loading` / `authenticated` / `anonymous`). Al recargar, si hay token, consulta `/api/auth/me`. Expone `login()` y `logout()`. Se suscribe a los 401 de la API para cerrar sesión. |
| `hooks/useAuth.js` | Acceso a la sesión; lanza error si se usa fuera del `AuthProvider`. |
| `utils/roles.js` | Constantes `ROLES` (`admin`, `vendedor`), etiquetas en español y `hasRole(user, roles)`. |

### 4. Protección de rutas

| Archivo | Qué se agregó |
|---|---|
| `routes/ProtectedRoute.jsx` | Mientras valida la sesión muestra un spinner; sin sesión redirige a `/admin/login` recordando la ruta pedida; con sesión pero sin rol muestra "Acceso restringido". Funciona como ruta envolvente (`<Outlet/>`) o envolviendo un elemento. |
| `routes/adminRoutes.js` | Tabla única de secciones del panel (ruta, etiqueta, ícono, roles, incremento). La usan `App.jsx` (rutas y permisos), `AdminLayout` (menú) y `DashboardPage` (accesos rápidos). |

**Permisos por sección** (de la tabla de rutas de la arquitectura)

| Ruta | Roles |
|---|---|
| `/admin`, `/admin/venta`, `/admin/cotizaciones`, `/admin/productos`, `/admin/kardex/:id` | admin, vendedor |
| `/admin/productos/importar`, `/admin/categorias`, `/admin/inventario`, `/admin/reportes`, `/admin/usuarios` | admin |

La validación en el cliente es solo experiencia de usuario; el backend vuelve a validar el rol en cada endpoint.

### 5. Componentes reutilizables (`src/components/`)

| Componente | Uso |
|---|---|
| `Button.jsx` | Variantes `primary`, `secondary`, `danger`, `ghost`; tamaños; estado `loading`. |
| `Input.jsx` | Etiqueta, ayuda y error asociados con `aria-describedby` / `aria-invalid`. |
| `Spinner.jsx` | Indicador de carga; modo pantalla completa. |
| `EmptyState.jsx` | Mensajes de "sin datos", "sin permiso" y secciones por construir. |

Los demás componentes de la arquitectura (`Select`, `Modal`, `Table`, `Pagination`, `Badge`, `Toast`)
se agregan en el incremento en que una pantalla los necesite.

### 6. Layouts

| Archivo | Qué se agregó |
|---|---|
| `layouts/PublicLayout.jsx` | Encabezado fijo con logo, buscador (maquetado; la lógica llega en el incremento 4) y enlace "Ingresar"; pie con botón de WhatsApp si `VITE_WHATSAPP_NUMBER` está definido. Mobile-first. |
| `layouts/AdminLayout.jsx` | Menú lateral filtrado por rol (cajón deslizable en móvil), barra superior con nombre, rol y "Cerrar sesión". |

### 7. Páginas y rutas

| Archivo | Qué se agregó |
|---|---|
| `App.jsx` | Rutas públicas y del panel. `LoginPage`, `AdminLayout` y las páginas del panel se cargan con `React.lazy` (división de código por zona). |
| `pages/auth/LoginPage.jsx` | Formulario con validación en el cliente, mensajes para 401/400 (credenciales), 429 (límite de intentos) y servidor caído. Tras ingresar vuelve a la ruta que se había pedido. Si ya hay sesión, redirige al panel. |
| `pages/admin/DashboardPage.jsx` | Saludo, rol, espacio para alertas de stock (incremento 3) y accesos rápidos según el rol. |
| `pages/admin/UpcomingPage.jsx` | Marcador para secciones de incrementos posteriores; indica en qué incremento se construyen. |
| `pages/catalog/CatalogPage.jsx` | Página del catálogo dentro de `PublicLayout` (contenido real en el incremento 4). |
| `pages/NotFoundPage.jsx` | Página 404. |

**Resultado de la división de código** (`npm run build`): el catálogo descarga `index-*.js` (≈86 kB gzip);
el login y el panel van en archivos aparte (`LoginPage`, `AdminLayout`, `DashboardPage`), que solo se
descargan al entrar a `/admin`.

### 8. Pruebas (Vitest)

| Archivo | Qué verifica |
|---|---|
| `api/http.test.js` | JWT en cabecera, JSON, mensajes de error del backend, 401 con y sin token, fallo de red. |
| `routes/ProtectedRoute.test.jsx` | Redirección sin sesión, acceso con rol, "Acceso restringido" sin rol, token inválido. |
| `pages/auth/LoginPage.test.jsx` | Validación de campos, login exitoso (guarda token y entra al panel), credenciales incorrectas. |
| `layouts/AdminLayout.test.jsx` | Menú completo para admin y restringido para vendedor. |
| `test/setup.js`, `test/utils.jsx` | Matchers de jest-dom, limpieza entre pruebas, `mockFetch` y `renderWithProviders`. |

Resultado: **4 archivos, 15 pruebas, todas pasan.**

### 9. Verificación manual

- `/admin/productos` sin sesión → redirige a `/admin/login`.
- Login sin backend → "El servidor no está disponible…".
- Login (respuesta simulada como vendedor) → vuelve a `/admin/productos`; el menú muestra solo
  Panel, Venta rápida, Cotizaciones y Productos.
- Vista móvil (390 px): el menú del panel se abre como cajón.

### Pendiente para cerrar el incremento

- Probar el login contra el backend real (`POST /api/auth/login`, `GET /api/auth/me`) y ajustar
  `api/auth.js` si el formato de respuesta difiere del contrato del README.
- Revisión con el propietario de la papelería.
