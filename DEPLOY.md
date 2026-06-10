# 🚀 Sistema Renacer - Guía de Deploy

## 📋 Descripción
Deploy de la aplicación con:
- **Frontend:** React + TypeScript + Vite
- **Backend:** Express + TypeScript
- **Base de datos:** PostgreSQL en Supabase
- **Deploy:** Vercel (frontend) + Render (backend)

## 🏗️ Arquitectura de despliegue
- `frontend/` → sitio estático en Vercel
- `backend/` → servicio Node en Render
- `backend/.env` no debe subirse al repositorio
- `vercel.json` ya configurado para SPA
- `backend/render.yaml` ya preparado para Render

## 🗄️ Esquema de Supabase
La base de datos usa PostgreSQL en Supabase. Antes de desplegar el backend, asegúrate de que la tabla `Vendedora` tenga la columna `descripcion`.

Puedes aplicar esta columna de dos formas:

- Ejecutar el script localmente en `backend`:
  ```bash
  cd backend
  npm run add-vendedora-descripcion
  ```
- O ejecutar directamente el SQL en Supabase:
  ```sql
  ALTER TABLE "Vendedora"
  ADD COLUMN IF NOT EXISTS descripcion TEXT;
  ```

El script también está documentado en `backend/sql/add_vendedora_descripcion.sql`.

## ✅ Validación local
Desde la raíz del repo:
```bash
cd frontend
npm install
npm run build

cd ../backend
npm install
npm run build
```

Si ambos comandos terminan sin errores, la app está lista para deploy.

## 📦 Estado actual
- **Frontend:** listo para deploy en Vercel.
- **Backend:** listo para deploy en Render.
- **Backend aún no desplegado en producción.**

## 🧩 Backend en Render

### Configuración recomendada
Puedes usar `backend/render.yaml` o crear el servicio manualmente.

### Opción A: Deploy con `render.yaml`
1. Conecta el repo a Render.
2. Importa la rama donde está el proyecto.
3. Render detectará el servicio `renacer-backend` usando `backend/render.yaml`.

### Opción B: Configuración manual en Render
- **Name:** `renacer-backend`
- **Runtime:** Node
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

#### Variables de entorno necesarias
- `DATABASE_URL` = `postgresql://postgres.liwwyfvvxolbwhpypxuq:248216Blan*@aws-1-us-east-2.pooler.supabase.com:6543/postgres`
- `JWT_SECRET` = `<tu_jwt_secret>`
- `FRONTEND_URL` = `https://<tu-frontend-vercel>`
- `NODE_ENV` = `production`
- `PORT` = `10000`

> El backend ya está preparado para leer estas variables y usar la base de datos.

### Opción C: Deploy manual desde Dashboard de Render
1. Abre [https://dashboard.render.com](https://dashboard.render.com).
2. Crea un nuevo servicio de tipo **Web Service**.
3. Selecciona el repo y la rama correcta.
4. En **Root Directory**, pon `backend`.
5. En **Build Command**, pon `npm install && npm run build`.
6. En **Start Command**, pon `npm start`.
7. Agrega las variables de entorno listadas arriba.
8. Despliega el servicio.

### Nota de CORS
El backend permite CORS desde:
- `http://localhost:5173`
- `http://localhost:3001`
- el valor de `FRONTEND_URL` en producción

Asegúrate de que `FRONTEND_URL` sea la URL de tu frontend en Vercel.

## 🧠 Frontend en Vercel

### Configuración recomendada
- **Build Command:** `npm install && npm run build`
- **Output Directory:** `frontend/dist`
- **Framework Preset:** `Other`

### `vercel.json`
Ya configurado para servir el frontend estático con SPA fallback.

### `frontend/vercel.json`
También existe un `vercel.json` dentro de `frontend/` para que, si despliegas desde esa carpeta, Vercel siga el mismo comportamiento SPA de fallback.

### Deploy usando Vercel CLI
1. Instala/actualiza Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Desde la raíz del repo elimina cualquier configuración local vieja de Vercel:
   ```bash
   rm -rf .vercel
   ```
3. Inicia sesión:
   ```bash
   vercel logout
   vercel login
   ```
4. Despliega el frontend:
   ```bash
   cd frontend
   vercel --prod --yes
   ```
5. Si quieres enlazar el proyecto manualmente, usa:
   ```bash
   vercel link
   ```

### Variable de entorno en Vercel
- `VITE_API_URL` = `https://<tu-backend-en-render>.onrender.com/api`

> En producción, el frontend usa `VITE_API_URL || '/api'`. Si pones solo `https://<tu-backend-en-render>.onrender.com`, el cliente puede enviar requests a `/auth/login` en lugar de `/api/auth/login`. Ahora el código normaliza el sufijo `/api`, pero la mejor práctica es definirla con `/api`.

### Nota de despliegue
- Si Vercel pregunta por directorios, elige `./frontend`.
- Si hay errores de configuración vieja, elimina `.vercel` y vuelve a desplegar.

## 🔌 Conexión entre Frontend y Backend
En producción el flujo es:
- Frontend Vercel → Backend Render
- Backend Render → Supabase

Ejemplo de variable:
- `VITE_API_URL=https://renacer-backend.onrender.com/api`

## 🔎 Pruebas post-deploy

### Backend
Visita:
```bash
https://<tu-backend-en-render>/api/health
```
Debe devolver:
```json
{ "status": "ok", "message": "Servidor funcionando" }
```

### Frontend
Visita la URL de Vercel y verifica:
- la app carga
- el login funciona
- las peticiones a la API responden

## 🛠️ Troubleshooting rápido

### Backend no arranca
- Revisa logs en Render
- Asegura `DATABASE_URL`, `JWT_SECRET` y `PORT`
- Asegura `FRONTEND_URL` sea la URL de Vercel

### Frontend no conecta al API
- Revisa `VITE_API_URL` en Vercel
- Revisa CORS y `FRONTEND_URL` en Render

### Rutas client-side fallan
- `vercel.json` ya usa SPA fallback a `frontend/dist/index.html`

## 🧾 Notas finales
- La app **no** usa Prisma.
- El backend usa `pg`, `dotenv` y `express`.
- El frontend está listo para Vercel.

## 📌 Comandos útiles
```bash
# Build local
cd frontend && npm install && npm run build
cd ../backend && npm install && npm run build

# Iniciar localmente
cd backend && npm run dev
cd frontend && npm run dev
```
