# Documentación de visibilidad del módulo de campañas por rol

## Objetivo
Habilitar o deshabilitar el módulo de campañas para los usuarios con rol de gerente de zona y gerente regional desde el panel de administración.

## Qué se implementó

### 1. Bandera de configuración en frontend
Se creó un mecanismo simple basado en localStorage para controlar si el módulo de campañas está disponible para los roles de gerente de zona y gerente regional.

Archivo creado:
- frontend/src/utils/featureFlags.ts

Funciones:
- isGerenteZonaCampanasEnabled(): devuelve si la funcionalidad está habilitada.
- setGerenteZonaCampanasEnabled(enabled): guarda la preferencia en localStorage.

### 2. Ocultado del módulo en la navegación
Se ajustó la configuración del menú para que, cuando la bandera esté desactivada, el módulo de campañas no aparezca en el menú lateral del rol correspondiente.

Archivos modificados:
- frontend/src/constants/layout.ts

### 3. Bloqueo de acceso por ruta
Se ajustó el enrutador para que la ruta de campañas solo sea accesible si la bandera está habilitada.

Archivos modificados:
- frontend/src/App.tsx

### 4. Control desde el panel de administración
Se agregó una opción en la vista de seguridad del administrador para activar o desactivar el módulo de campañas para ambos roles.

Archivos modificados:
- frontend/src/components/SeguridadAdmin.tsx

## Comportamiento actual
- Si la bandera está desactivada:
  - el módulo de campañas no aparece en el menú
  - no se puede entrar a la ruta correspondiente
- Si la bandera está activada:
  - el módulo vuelve a estar visible y accesible

## Roles afectados
- GERENTE_ZONA
- GERENTE_REGIONAL

## Verificación realizada
Se ejecutó la compilación del frontend con éxito:

- Comando: npm run build
- Resultado: build generada correctamente
