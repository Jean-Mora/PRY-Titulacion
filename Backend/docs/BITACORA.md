# Bitácora del backend

Registro de lo que se agrega en cada incremento del plan, con el motivo de cada decisión.
Cada entrada indica la fecha, la rama y los archivos afectados.

| Semanas | Incremento | Estado |
|---|---|---|
| 1–2 | 1. Arquitectura y autenticación | ✅ Código y pruebas completos · ⏳ despliegue de prueba en EC2 pendiente (guía lista) |
| 3–4 | 2. Productos e importación | Pendiente |
| 5–6 | 3. Inventario | Pendiente |
| 7–8 | 4. Catálogo público | Pendiente |
| 9 | 5. Cotizaciones | Pendiente |
| 10 | 6. Reportes y validación | Pendiente |
| 11 | 7. Go-Live | Pendiente |

---

## Incremento 1 — Arquitectura y autenticación (semanas 1–2)

- **Fecha:** 8 de noviembre de 2026
- **Rama:** `inc-1/auth` (la misma del frontend; se fusiona a `main` al cierre del incremento)
- **Entregable del plan:** `config/`, `middlewares/`, módulos `auth` y `users`, los 5 modelos,
  despliegue de prueba en EC2.

### 1. Proyecto base

| Archivo | Qué se agregó |
|---|---|
| `package.json` | Dependencias: `express@5`, `mongoose@9`, `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit`, `cors`, `socket.io`, `zod@4`, `multer@2`, `@aws-sdk/client-s3`. Desarrollo: `jest@30`, `supertest`, `mongodb-memory-server`. Scripts `dev`, `start`, `test`, `seed:admin`. |
| `.env.example` | Todas las variables con explicación (Mongo, JWT, bcrypt, CORS, proxy, límite de login, S3). |
| `.gitignore` | Excluye `node_modules/`, `.env`, `coverage/`. |
| `README.md` | Puesta en marcha, scripts, estructura y contrato de la API. |

**Decisiones**
- **CommonJS** (`require`) en lugar de ES Modules: Jest funciona sin configuración experimental.
- **Express 5**: los errores de funciones `async` llegan solos a `errorHandler`; no hace falta
  envolver cada controlador en `try/catch` ni usar `express-async-handler`.
- **`bcryptjs`** en lugar de `bcrypt`: es la misma función de hash, pero en JavaScript puro; no
  necesita compilar código nativo en EC2 ni en GitHub Actions.
- **`zod`** para validar la entrada (el documento dice "valida body, params y query" sin nombrar
  librería). Se configuró con los mensajes en español (`z.locales.es()`).
- No se usa `dotenv`: Node ≥ 20.12 trae `process.loadEnvFile()`.
- La carpeta se llama `Backend/` (la arquitectura la llama `server/`), igual que `Frontend/` ↔ `client/`.

### 2. Configuración (`src/config/`)

| Archivo | Qué se agregó |
|---|---|
| `env.js` | Único lugar que lee `process.env`. Valida con zod (p. ej. `JWT_SECRET` ≥ 32 caracteres, `MONGODB_URI` obligatoria) y convierte tipos. Si falta algo, el proceso termina al arrancar con la lista de errores. En pruebas usa valores por defecto. |
| `db.js` | `connectDB`, `disconnectDB`, `isDBConnected` (para `/api/health`). Registra desconexiones y reconexiones. |
| `s3.js` | Cliente de S3 creado al primer uso, **sin llaves**: en EC2 toma las credenciales del rol de IAM. La subida en sí llega en el incremento 2. |

### 3. Utilidades (`src/utils/`)

| Archivo | Qué hace |
|---|---|
| `AppError.js` | Error con `status`, `code` y `message` en español; atajos `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`. |
| `logger.js` | Logs con fecha y nivel a stdout/stderr (PM2 los guarda). Silencioso en pruebas. |
| `pagination.js` | Esquema `?page=&limit=` (máx. 100) y respuesta `{ items, page, limit, total, pages }`. |
| `jwt.js` | `signToken` / `verifyToken` con algoritmo fijo HS256. Payload: `{ sub, role }`. |
| `roles.js` | `ROLES` (`admin`, `vendedor`), iguales a `Frontend/src/utils/roles.js`. |
| `slugify.js` | "Útiles Escolares" → `utiles-escolares` (categorías y productos). |
| `uuid.js` | `randomUUID()` de Node, para nombrar imágenes en S3. |

### 4. Middlewares (`src/middlewares/`)

| Archivo | Qué hace |
|---|---|
| `auth.js` | Lee `Authorization: Bearer <token>`, verifica el JWT y **consulta al usuario en la base**: si fue desactivado, el token deja de servir al instante. Códigos: `TOKEN_MISSING`, `TOKEN_INVALID`, `TOKEN_EXPIRED`, `USER_INACTIVE` (todos 401). Carga `req.user = { id, name, email, role }`. |
| `requireRole.js` | `requireRole('admin')` o varios roles → 403 si no corresponde. |
| `validate.js` | `validate({ body, params, query })` con zod. Junta todos los errores en `details: [{ field, message }]` (p. ej. `body.email`). Deja los datos limpios en `req.validated` (en Express 5 `req.query` es de solo lectura). |
| `upload.js` | `uploadImage` (JPG/PNG/WebP, 5 MB, campo `image`) y `uploadCsv` (2 MB, campo `file`), en memoria. Se usan en el incremento 2. |
| `errorHandler.js` | Respuesta uniforme `{ error: { code, message, details? } }`. Traduce JSON mal formado, errores de validación y de id de Mongoose, clave duplicada (409) y errores de multer. Un error inesperado responde 500 genérico y se registra completo en el log, sin filtrar detalles al cliente. Incluye `notFound` para rutas inexistentes. |

**Decisión:** el formato `error.message` es el que ya lee el frontend (`Frontend/src/api/http.js`).

### 5. Los 5 modelos (Arquitectura §5 y §6)

| Archivo | Campos e índices | Reglas que ya aplica el esquema |
|---|---|---|
| `modules/users/users.model.js` | name, email, passwordHash, role, active · **email único** | `passwordHash` con `select: false` y eliminado de `toJSON`; email en minúsculas. |
| `modules/categories/categories.model.js` | name, slug, description · **slug único** | Slug automático desde el nombre. |
| `modules/products/products.model.js` | sku, name, slug, description, categoryId, price, cost, imageUrl, tags, stockMin, active, variants[{ sku, color, size, model, stock }] · **categoryId; texto en name (español); variants.sku**; sku y slug únicos | Al menos una variante: si no se envía ninguna, se crea la "Única" con el SKU del producto. Stock de variante entero ≥ 0. `stock` del producto es **virtual** (suma de variantes, no se guarda). `label` de la variante ("Azul · A4" o "Única"). |
| `modules/movements/movements.model.js` | type, reason, productId, variantId, quantity, stockAfter, reference, userId, createdAt · **productId + variantId + createdAt** | Solo inserción (sin `updatedAt`). Motivo coherente con el tipo (entrada→compra; salida→venta/cotización; ajuste→conteo). Entrada/salida con cantidad > 0; ajuste con signo y ≠ 0. `stockAfter` ≥ 0. |
| `modules/quotations/quotations.model.js` | code, customer{name, phone}, items[{ productId, variantId, name, price, quantity }], total, status, history[], createdBy · **status + createdAt**; code único | Al menos un ítem. `total` calculado en centavos (sin errores de redondeo). Primer estado registrado en `history`. `canTransition(de, a)` con la máquina de estados recibida → confirmada → vendida / cancelada. |
| `src/models.js` | Registra los 5 modelos para que sus índices se creen al arrancar. | |

**Decisiones**
- Se agregó **`slug` a products** aunque la tabla §6 no lo lista, porque el endpoint
  `GET /api/catalog/:slug` lo necesita (incremento 4). Se genera con nombre + SKU para que sea único.
- Los estados de la cotización se guardan en minúsculas (`recibida`, `confirmada`, `vendida`,
  `cancelada`), igual que roles y tipos de movimiento; el frontend los muestra con mayúscula.
- Solo se crearon los modelos de categories, products, movements y quotations; sus rutas, servicios
  y validaciones llegan en sus incrementos.

### 6. Módulo `users` (`/api/users`, solo admin)

| Archivo | Qué hace |
|---|---|
| `users.schema.js` | Reglas: nombre 2–80, correo válido (se normaliza a minúsculas), contraseña ≥ 8 y ≤ 72 bytes (límite real de bcrypt), rol `admin`/`vendedor`. El PATCH rechaza campos desconocidos y cuerpo vacío. Filtros de listado `q`, `role`, `active`. |
| `users.service.js` | `list`, `getById`, `create`, `update`. Hash con bcrypt (costo `BCRYPT_ROUNDS`). Correo repetido → 409 `EMAIL_TAKEN`. Un admin **no puede desactivarse ni cambiarse el rol a sí mismo** (así el sistema nunca queda sin administrador). |
| `users.controller.js` | Respuestas `{ user }` y listado paginado; alta con 201. |
| `users.routes.js` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, todas con `auth` + `requireRole(admin)`. |

**Decisión:** no hay `DELETE`. Un usuario se desactiva (`active: false`) para conservar la trazabilidad
de los movimientos y cotizaciones que registró.

### 7. Módulo `auth` (`/api/auth`)

| Archivo | Qué hace |
|---|---|
| `auth.schema.js` | Login `{ email, password }`. |
| `auth.service.js` | `login`: compara con bcrypt; correo inexistente y contraseña incorrecta dan **el mismo** 401 `INVALID_CREDENTIALS`, y se compara contra un hash de relleno para que el tiempo de respuesta no revele qué correos existen. Usuario desactivado → 403 `USER_INACTIVE`. `me`: usuario actual. |
| `auth.controller.js` | `POST /login → { token, user }`, `GET /me → { user }` (contrato de `Frontend/src/api/auth.js`). |
| `auth.routes.js` | `express-rate-limit` en el login: 10 intentos **fallidos** por IP cada 15 minutos (los correctos no cuentan) → 429 `TOO_MANY_ATTEMPTS`. |

### 8. Aplicación, servidor y tiempo real

| Archivo | Qué hace |
|---|---|
| `src/app.js` | `createApp()`: `trust proxy` (CloudFront), `helmet`, CORS solo si `CORS_ORIGIN` tiene valores, JSON hasta 1 MB, `GET /api/health`, rutas, 404 y `errorHandler`. Es una fábrica para que cada archivo de pruebas tenga su propia app. |
| `src/server.js` | Conecta a Atlas, crea HTTP + Socket.io, escucha en `PORT`, avisa `ready` a PM2 y apaga en orden con SIGINT/SIGTERM (cierra sockets, HTTP y Mongo; fuerza la salida a los 10 s). |
| `src/sockets/stock.js` | Conexión de Socket.io lista: quien envía un JWT válido (`io({ auth: { token } })`) entra a la sala `staff`; los visitantes del catálogo se conectan sin token. Funciones `emitStockUpdated` y `emitStockLow` preparadas para movements (incremento 3). No escucha eventos del cliente. |
| `ecosystem.config.js` | PM2 en modo cluster con **1 instancia** + `wait_ready`: `pm2 reload` levanta la nueva antes de apagar la vieja. Una sola instancia porque Socket.io con varias necesita sesiones sticky. |
| `scripts/create-admin.js` | `npm run seed:admin` crea el primer administrador (no hay registro público). La contraseña va por variable `ADMIN_PASSWORD`; si el correo existe no hace nada. |

### 9. Pruebas (`tests/`) — 74 pruebas, 4 archivos

| Archivo | Qué cubre |
|---|---|
| `helpers/db.js` | MongoDB en memoria por archivo, índices creados, colecciones vacías entre pruebas. |
| `helpers/factories.js` | `createUser`, `loginAs(rol)` (usuario + cabecera `Authorization`). |
| `auth/auth.test.js` | Login correcto (JWT de 8 h, sin passwordHash), correo sin distinguir mayúsculas, mismo error para clave mala y correo inexistente, usuario desactivado, validación, JSON mal formado, límite de intentos (429). `/me` con token válido, sin token, alterado, firmado con otro secreto, vencido y de usuario desactivado. Health, 404 y cabeceras de helmet. |
| `users/users.test.js` | 401 sin sesión, 403 para vendedor; listado paginado, filtros y validación de query; detalle, 404 y 400; alta (hash bcrypt guardado, luego puede iniciar sesión), correo repetido, validaciones; PATCH de rol/nombre, cambio de contraseña, desactivación, protección contra auto-desactivarse/auto-degradarse, correo repetido, cuerpo vacío o campos desconocidos. |
| `middlewares/middlewares.test.js` | `requireRole`, `validate` (limpieza, errores de todas las fuentes, mensajes en español), `errorHandler` (AppError, async, 500 sin filtrar datos, errores de Mongoose), `upload` (acepta PNG, rechaza otros tipos), `extractToken`. |
| `models/models.test.js` | Reglas e índices de los 5 modelos (variante "Única", stock virtual, stock negativo/decimal, motivo vs. tipo, ajuste ≠ 0, total de la cotización, transiciones de estado, índices de §6). |

**Problema encontrado y solución:** con Jest, el driver de MongoDB 7 no lograba conectarse
("Missing required sub-document 'driver'"). La causa: el driver carga el módulo `os` con
`import()` dinámico, que Jest en modo CommonJS no soporta, y el saludo inicial al servidor salía
vacío. Se resolvió entregándole el módulo con la opción pública `runtimeAdapters: { os }` solo en
`tests/helpers/db.js`; en ejecución normal (`npm start`) no hace falta.

> La primera ejecución de `npm test` descarga el binario de MongoDB (~100 MB, unos minutos). Luego
> la suite completa tarda ~10 s.

### 10. Verificación realizada

- `npm test` → **4 archivos, 74 pruebas, todas pasan**.
- Arranque real con `node src/server.js` contra un MongoDB local:
  - `npm run seed:admin` crea el admin; repetirlo no duplica; datos inválidos muestran los errores.
  - `GET /api/health` → `{"status":"ok","db":true}`.
  - `POST /api/auth/login` → token + usuario; con clave incorrecta → `INVALID_CREDENTIALS`.
  - `GET /api/auth/me` con el token → usuario. `POST /api/users` → vendedor creado.
  - Handshake de Socket.io en `/socket.io/` responde.
  - SIGINT → cierre ordenado (sockets, HTTP, Mongo).

### 11. Corrección: alerta de secretos de GitHub

- **Qué pasó:** después del primer push del backend, GitHub *secret scanning* marcó
  `Backend/.env.example` línea 7 como "URI de MongoDB Atlas con credenciales".
- **Qué era:** un valor de **ejemplo** (usuario "USUARIO", clave "CLAVE" y un cluster ficticio), no una
  credencial real. El `.env` real nunca se ha subido (está en `.gitignore`). No hace falta rotar nada.
- **Corrección:** `MONGODB_URI` queda vacía en `.env.example`, con instrucciones de dónde copiarla
  (solo al `.env`). Los ejemplos de contraseña de `README.md` y `DESPLIEGUE_EC2.md` se cambiaron por
  `<tu-contraseña>`.
- **Historial:** se reescribió la rama `inc-1/auth` (los commits del backend se unieron en uno solo
  y se subió con `--force-with-lease`) para que ese valor no quede en ningún commit.
- **Regla desde ahora:** los archivos del repositorio no llevan valores con forma de credencial,
  ni siquiera de ejemplo: las variables secretas van vacías en `.env.example`.

### 12. Pendiente del incremento 1

- **Despliegue de prueba en EC2**: requiere la cuenta de AWS y Atlas; los pasos están en
  [`DESPLIEGUE_EC2.md`](DESPLIEGUE_EC2.md) con una lista de verificación.
- Probar el login del frontend contra este backend (`Frontend` → `npm run dev`, backend en el puerto 3000).
