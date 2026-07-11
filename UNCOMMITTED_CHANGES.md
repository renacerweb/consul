# Cambios no añadidos / pendientes de commitear

Fecha: 2026-07-09

## Resumen general

Estos cambios aún no se han agregado a git. Incluyen archivos modificados ya versionados y nuevos archivos/directorios sin seguimiento.

## Archivos modificados (tracked)

### Backend
- `backend/src/controllers/usuarioController.ts`
- `backend/src/controllers/vendedoraController.ts`
- `backend/src/controllers/zonaController.ts`
- `backend/src/index.ts`
- `backend/src/routes/authRoutes.ts`
- `backend/src/routes/vendedoraRoutes.ts`
- `backend/src/routes/zonaRoutes.ts`

### Frontend
- `frontend/package-lock.json`
- `frontend/package.json`
- `frontend/src/App.tsx`
- `frontend/src/components/Layout.tsx`
- `frontend/src/components/ReporteMalasReputaciones.tsx`
- `frontend/src/components/UsuariosAdmin.tsx`
- `frontend/src/components/UsuariosGerenteRegional.tsx`
- `frontend/src/components/admin/VendedorasList.tsx`
- `frontend/src/constants/layout.ts`
- `frontend/src/contexts/ToastContext.tsx`
- `frontend/src/pages/admin/Mensajes.tsx`
- `frontend/src/pages/gerente-regional/Mensajes.tsx`
- `frontend/src/services/api.ts`

## Archivos nuevos sin seguimiento (untracked)

### Backend
- `backend/backups/` (directorio nuevo)
- `backend/scripts/auth-get.js`
- `backend/scripts/backup-db-with-schema.js`
- `backend/scripts/backup-db.js`
- `backend/scripts/check-db.js`
- `backend/scripts/ensure_campania_tables.js`
- `backend/scripts/list-users.js`
- `backend/scripts/reset-password.js`
- `backend/scripts/restore-db.js`
- `backend/scripts/show-failed-logins.js`
- `backend/scripts/show-user.js`
- `backend/scripts/test-login.js`
- `backend/src/controllers/campaniaController.ts`
- `backend/src/routes/campaniaRoutes.ts`
- `backend/users.txt`

### Frontend
- `frontend/src/components/SidebarExportModal.tsx`
- `frontend/src/pages/admin/VendedorasBuenas.tsx`
- `frontend/src/pages/admin/VendedorasMalas.tsx`
- `frontend/src/pages/gerente-regional/Campanas.tsx`
- `frontend/src/pages/gerente-regional/CampanasHistorial.tsx`
- `frontend/src/pages/gerente-regional/GerentesMalas.tsx`
- `frontend/src/pages/gerente-regional/VendedorasBuenas.tsx`
- `frontend/src/pages/gerente-regional/VendedorasMalas.tsx`
- `frontend/src/pages/gerente-regional/Zonas.tsx`
- `frontend/src/pages/gerente/Campanas.tsx`
- `frontend/src/pages/gerente/VendedorasBuenas.tsx`
- `frontend/src/pages/gerente/VendedorasMalas.tsx`

## Observaciones

- Hay cambios significativos en la parte frontend, especialmente en nuevas páginas para los roles de admin, gerente regional y gerente.
- Las modificaciones en backend parecen centrarse en controladores y rutas de `usuario`, `vendedora` y `zona`.
- También hay un conjunto de scripts de administración de base de datos en `backend/scripts/` que aún no están versionados.
- `frontend/package-lock.json` y `frontend/package.json` indican cambios en dependencias o paquetes instalados.

## Propuesta

- Revisar los cambios con `git diff` y `git add` los archivos que se desea commitear.
- Confirmar si los scripts en `backend/scripts/` deben versionarse y agregar los nuevos archivos deseados.
- Si conviene, crear un commit que documente esta tanda de cambios como "Funcionalidades de gestión de vendedoras y nuevas páginas de administración".
