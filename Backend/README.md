# Backend — Papelería Jean-Fabri

API REST en **Node.js + Express 5** con **Socket.io**, sobre **MongoDB Atlas** (Mongoose).
Atiende al catálogo público y al panel de administración. Es la única pieza que escribe en la base
de datos y en el bucket de imágenes.

> Arquitectura completa: `Documentacion/Arquitectura_Backend_Jean-Fabri.pdf`.
> Registro de lo que se agrega en cada incremento: [`docs/BITACORA.md`](docs/BITACORA.md).
> Despliegue en EC2: [`docs/DESPLIEGUE_EC2.md`](docs/DESPLIEGUE_EC2.md).

## Requisitos

- Node.js 22 o superior
- Una base en MongoDB Atlas (o un MongoDB local) para desarrollo
- Las pruebas **no** necesitan Atlas: usan `mongodb-memory-server` (la primera ejecución descarga
  el binario de MongoDB, ~100 MB, y tarda unos minutos).

## Puesta en marcha

```bash
npm install
cp .env.example .env      # completa MONGODB_URI y JWT_SECRET
ADMIN_PASSWORD='<tu-contraseña>' npm run seed:admin -- --name "Jean Pierre Mora" --email admin@jeanfabri.com
npm run dev               # http://localhost:3000  (se reinicia al guardar)
```

El frontend (`Frontend/`, `npm run dev`) reenvía `/api` y `/socket.io` a `http://localhost:3000`,
así que no hace falta configurar CORS en desarrollo.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca con `node --watch` (recarga al guardar). |
| `npm start` | Arranca en modo normal (lo usa PM2). |
| `npm test` | Pruebas Jest + Supertest sobre MongoDB en memoria. |
| `npm run seed:admin` | Crea el primer administrador (ver arriba). |

## Estructura

```
Backend/
├── src/
│   ├── app.js                 Express: middlewares globales y montaje de rutas (createApp)
│   ├── server.js              Servidor HTTP + Socket.io, arranque y apagado ordenado
│   ├── models.js              Registra los 5 modelos
│   ├── config/                env.js (variables validadas), db.js (Mongoose), s3.js
│   ├── middlewares/           auth, requireRole, validate, upload, errorHandler
│   ├── modules/<módulo>/      *.routes · *.controller · *.service · *.model · *.schema
│   ├── sockets/stock.js       stock:updated y stock:low (sala staff)
│   └── utils/                 AppError, logger, pagination, jwt, roles, slugify, uuid
├── tests/                     Jest + Supertest, una carpeta por módulo
├── scripts/create-admin.js    Alta del primer administrador
├── ecosystem.config.js        PM2
└── .env.example
```

Flujo de una petición: **ruta → auth → requireRole → validate → controlador → servicio → modelo → MongoDB**.
Cualquier error termina en `errorHandler`.

## Contrato de la API

Respuesta de error (siempre la misma forma):

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Revisa los datos enviados.", "details": [{ "field": "body.email", "message": "Correo electrónico inválido" }] } }
```

Listados paginados: `{ items, page, limit, total, pages }` (`?page=1&limit=20`, máx. 100).

### Endpoints disponibles (incrementos 1 y 2)

| Método y ruta | Acceso | Respuesta |
|---|---|---|
| `GET /api/health` | Público | `{ status, db, uptime }` (503 si la base no está conectada) |
| `POST /api/auth/login` | Público, máx. 10 intentos fallidos / 15 min por IP | `{ token, user }` |
| `GET /api/auth/me` | Autenticado | `{ user }` |
| `GET /api/users` | Admin | Listado paginado (`q`, `role`, `active`) |
| `GET /api/users/:id` | Admin | `{ user }` |
| `POST /api/users` | Admin | `201 { user }` — `{ name, email, password, role }` |
| `PATCH /api/users/:id` | Admin | `{ user }` — `{ name?, email?, password?, role?, active? }` |
| `GET /api/categories` | Público | `{ items }` con `productCount` |
| `POST /api/categories` | Admin | `201 { category }` — `{ name, description?, slug? }` |
| `PATCH /api/categories/:id` | Admin | `{ category }` |
| `DELETE /api/categories/:id` | Admin | `204` (409 si tiene productos) |
| `GET /api/products` | Admin, vendedor | Listado paginado con stock y costo (`q`, `categoryId`, `active`) |
| `GET /api/products/:id` | Admin, vendedor | `{ product }` |
| `POST /api/products` | Admin | `201 { product }` — variantes sin stock (empiezan en 0) |
| `PATCH /api/products/:id` | Admin | `{ product }` — variantes con `_id` conservan su stock |
| `DELETE /api/products/:id` | Admin | `204` (409 si tiene stock o movimientos) |

Autenticación: cabecera `Authorization: Bearer <token>`. El token dura 8 horas.
