# Frontend — Papelería Jean-Fabri

Aplicación de página única (SPA) en React con dos zonas:

- **Catálogo público** (`/`, `/categoria/:slug`, `/producto/:slug`), abierto a cualquier visitante.
- **Panel de administración** (`/admin/*`), protegido por JWT y rol (`admin`, `vendedor`).

Basado en el documento *Arquitectura del Frontend* (Documentacion/Arquitectura_Frontend_Jean-Fabri.pdf).
El avance por incremento y cada archivo agregado se registran en [docs/BITACORA.md](docs/BITACORA.md).

> Nota: la arquitectura nombra esta carpeta `client/`; en este repositorio se llama `Frontend/`.

## Tecnologías

| Elemento | Tecnología | Versión |
|---|---|---|
| Biblioteca de UI | React (hooks) | 19.3 |
| Construcción | Vite | 8.3 |
| Estilos | Tailwind CSS (plugin `@tailwindcss/vite`) | 4.3 |
| Enrutamiento | React Router (`react-router`) | 8.5 |
| Pruebas | Vitest + Testing Library + jsdom | 5.1 |
| Tiempo real | socket.io-client | se agrega en el incremento 3 |

## Puesta en marcha

Requisitos: Node.js 20 o superior.

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run dev
```

La aplicación queda en http://localhost:5173. En desarrollo, Vite reenvía `/api` y `/socket.io`
al backend (`VITE_DEV_API_TARGET`, por defecto `http://localhost:3000`), así el frontend usa rutas
relativas igual que en producción detrás de CloudFront.

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Genera `dist/` para subir a S3 |
| `npm run preview` | Sirve `dist/` localmente |
| `npm test` | Ejecuta las pruebas una vez |
| `npm run test:watch` | Pruebas en modo observación |

## Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL base de la API. Vacía = rutas relativas (recomendado). |
| `VITE_DEV_API_TARGET` | Solo desarrollo: destino del proxy de Vite. |
| `VITE_WHATSAPP_NUMBER` | Número de la papelería para el botón de WhatsApp del pie (ej. `593991234567`). |

Todas son públicas: el frontend no guarda secretos.

## Estructura

```
Frontend/
├── index.html
├── vite.config.js           Plugins, proxy de /api y /socket.io, configuración de Vitest
├── .env.example
├── docs/BITACORA.md         Registro de cambios por incremento
└── src/
    ├── main.jsx             Punto de entrada (ThemeProvider + Router + AuthProvider)
    ├── App.jsx              Rutas; el panel se carga con React.lazy
    ├── index.css            Tailwind + paleta de la marca + variante dark (modo oscuro)
    ├── api/http.js          Único cliente HTTP: URL base, JWT, manejo de 401
    ├── api/                 auth.js, categories.js, products.js
    ├── context/             AuthContext (sesión), ThemeContext (claro/oscuro/sistema)
    ├── hooks/               useAuth, useTheme, useFetch, useDebounce
    ├── components/          Button, Input, Select, Textarea, Modal, Badge, Alert,
    │                        Pagination, Spinner, EmptyState, ThemeToggle
    ├── layouts/             PublicLayout, AdminLayout
    ├── routes/              ProtectedRoute, adminRoutes (secciones, roles, menú)
    ├── pages/               catalog/, auth/, admin/ (categories/, products/)
    ├── utils/               roles.js, format.js (USD es-EC), apiErrors.js
    └── test/                Configuración y utilidades de pruebas
```

### Convenciones

- Un componente usado en varias páginas va en `components/`; uno usado solo por una página va en la
  carpeta `components/` de esa página.
- Las páginas no llaman a `fetch`; usan las funciones de `api/`.
- `api/http.js` es el único lugar que conoce la URL base y el token.
- Las pruebas viven junto al archivo que prueban (`Archivo.test.jsx`).

## Modo oscuro

Botón de tema (ícono de monitor / sol / luna) en el catálogo, el login y el panel. Cada clic pasa a
la siguiente opción: **sistema → claro → oscuro**. La preferencia se guarda en el navegador
(`localStorage.jf_theme`); "sistema" sigue al modo del sistema operativo.
Para estilos nuevos, agrega la variante `dark:` junto a cada color claro (ver `docs/BITACORA.md`).

## Contrato con el backend

Productos y categorías: ver la tabla de endpoints en `Backend/README.md`.

### Autenticación (incremento 1)

| Endpoint | Envía | Recibe |
|---|---|---|
| `POST /api/auth/login` | `{ email, password }` | `{ token, user }` |
| `GET /api/auth/me` | `Authorization: Bearer <token>` | `{ user }` (o el usuario directamente) |

`user = { _id, name, email, role: 'admin' | 'vendedor' }`.
Los errores se leen de `message`, `error` o `error.message` del cuerpo JSON.
Si el backend no devuelve `user` en el login, el frontend lo consulta con `/api/auth/me`.
