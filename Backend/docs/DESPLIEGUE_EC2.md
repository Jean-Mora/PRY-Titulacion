# Despliegue de prueba en EC2 (incremento 1)

Guía para el entregable "despliegue de prueba en EC2" de las semanas 1–2. El objetivo es comprobar
que la API arranca en la instancia, se conecta a Atlas y responde `GET /api/health` y el login.
El pipeline automático (`deploy-server.yml`), el dominio y SSL quedan para el incremento 7 (Go-Live).

## 1. Recursos en AWS

| Recurso | Configuración |
|---|---|
| EC2 | Amazon Linux 2023 o Ubuntu 24.04, `t3.micro` (capa gratuita), región `us-east-1` (la misma que Atlas). |
| Grupo de seguridad | Entrada: 22 (SSH) solo desde tu IP; 3000 (API) desde tu IP mientras se prueba. En producción la API solo la verá CloudFront. |
| Rol de IAM | Rol de instancia con permiso `s3:PutObject` / `s3:DeleteObject` sobre el bucket de imágenes (se usa en el incremento 2). Sin llaves en `.env`. |
| MongoDB Atlas | Cluster M0 en `us-east-1`. En *Network Access* agrega la IP elástica de la instancia. |

## 2. Preparar la instancia

```bash
# Node.js 22 LTS (o superior) con nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
npm install -g pm2

git clone <URL-del-repositorio> jean-fabri
cd jean-fabri/Backend
npm ci --omit=dev
```

## 3. Variables de entorno

```bash
cp .env.example .env
nano .env
```

Completa como mínimo `NODE_ENV=production`, `MONGODB_URI` y `JWT_SECRET` (genera uno nuevo, no
reutilices el de desarrollo):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Protege el archivo: `chmod 600 .env`.

## 4. Primer administrador y arranque

```bash
ADMIN_PASSWORD='<tu-contraseña>' npm run seed:admin -- --name "Jean Pierre Mora" --email admin@jeanfabri.com
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup          # sigue la instrucción que imprime para que PM2 arranque con la instancia
```

## 5. Verificación

Desde tu computadora (con el puerto 3000 abierto a tu IP):

```bash
curl http://<IP-publica>:3000/api/health
# {"status":"ok","db":true,"uptime":12}

curl -X POST http://<IP-publica>:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@jeanfabri.com","password":"<tu-contraseña>"}'
# {"token":"eyJ...","user":{...}}
```

En la instancia: `pm2 logs jean-fabri-api` y `pm2 status`.

## 6. Actualizar (manual hasta el incremento 7)

```bash
cd ~/jean-fabri && git pull
cd Backend && npm ci --omit=dev
pm2 reload jean-fabri-api
```

`pm2 reload` levanta la nueva instancia, espera su señal `ready` y luego apaga la anterior, así que
no corta el servicio.

## Checklist del entregable

- [ ] Instancia EC2 creada con rol de IAM y grupo de seguridad
- [ ] IP de la instancia autorizada en Atlas
- [ ] `.env` de producción creado (`chmod 600`)
- [ ] Administrador inicial creado
- [ ] `pm2 start` + `pm2 save` + `pm2 startup`
- [ ] `GET /api/health` → `{"status":"ok","db":true}`
- [ ] Login correcto desde fuera de la instancia
- [ ] Puerto 3000 cerrado otra vez al terminar la prueba
