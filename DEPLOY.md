# 🚀 Sistema Renacer - Guía de Deploy

## 📋 Descripción
Deploy de la aplicación actual con:
- **Frontend:** React + TypeScript + Vite
- **Backend:** Express + TypeScript
- **Base de datos:** PostgreSQL en Supabase
- **Deploy:** Vercel (frontend) + Render (backend)

## 🏗️ Arquitectura de despliegue
- `frontend/` → sitio estático en Vercel
- `backend/` → servicio Node en Render
- `backend/.env` no debe subirse al repositorio
- `vercel.json` ya configurado para SPA
- `render.yaml` ya preparado para Render

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

## 🧩 Backend en Render

### Configuración de Render
Puedes usar `render.yaml` o crear el servicio manualmente.

### Opción A: Deploy usando `render.yaml`
1. Conecta el repo a Render.
2. Agrega `render.yaml` al pipeline.
3. Render detectará el servicio `renacer-backend`.

### Opción B: Configuración manual
- **Name:** `renacer-backend`
- **Runtime:** Node
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

#### Variables de entorno en Render
- `DATABASE_URL` = `postgresql://postgres.liwwyfvvxolbwhpypxuq:248216Blan*@aws-1-us-east-2.pooler.supabase.com:6543/postgres`
- `JWT_SECRET` = `<tu_jwt_secret>`
- `FRONTEND_URL` = `https://<tu-sitio-vercel>`
- `NODE_ENV` = `production`
- `PORT` = `10000`

> El backend ya está preparado para leer estas variables y usar el pool de PostgreSQL con SSL.

### Nota de CORS
El backend permite CORS solo desde:
- `http://localhost:5173`
- `http://localhost:3001`
- `FRONTEND_URL` en producción

Asegúrate de que `FRONTEND_URL` en Render sea la URL de Vercel.

## 🧠 Frontend en Vercel

### Configuración de Vercel
- **Build Command:** `npm install && npm run build`
- **Output Directory:** `frontend/dist`
- **Framework Preset:** `Other`

### `vercel.json`
Ya configurado para servir el frontend estático con SPA fallback.

### Variable de entorno en Vercel
- `VITE_API_URL` = `https://<tu-backend-en-render>/api`

> El frontend usa `VITE_API_URL || '/api'`, así que en producción apunta al backend Render.

## 🔌 Conexión entre Frontend y Backend
En producción el flujo debe ser:
- Frontend Vercel → Backend Render
- Backend Render → Base de datos Supabase

Ejemplo:
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
Visita la URL de Vercel y verifica que:
- la app carga correctamente
- el login funciona
- las peticiones a `/api` responden bien

### Base de datos
Verifica en Supabase que las tablas existen y que la conexión está activa.

## 🛠️ Troubleshooting rápido

### Problema: backend no arranca
- Revisa logs en Render
- Asegura `DATABASE_URL` y `JWT_SECRET`
- Asegura `PORT=10000` o usa el puerto asignado por Render

### Problema: frontend no se conecta al API
- Revisa `VITE_API_URL` en Vercel
- Revisa CORS y `FRONTEND_URL` en Render

### Problema: rutas client-side fallan
- `vercel.json` ya incluye SPA fallback a `frontend/dist/index.html`

## 🧾 Notas finales
- La app **no** usa Prisma.
- El backend usa `pg` y `dotenv`.
- El frontend ya está listo para deploy estático en Vercel.

## 📌 Comandos útiles
```bash
# Build local
cd frontend && npm install && npm run build
cd ../backend && npm install && npm run build

# Iniciar localmente
cd backend && npm run dev
cd frontend && npm run dev
```
