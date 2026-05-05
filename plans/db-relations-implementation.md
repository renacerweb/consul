# Plan de Implementación de Relaciones de Base de Datos

## Objetivo
Implementar las relaciones de base de datos descritas en el sistema Renacer usando PostgreSQL y el driver `pg`.

## Pasos

1. **Migraciones de Base de Datos**
   - Crear scripts SQL para:
     - Tablas nuevas: `Region`, `HistorialVendedora`, `AuditoriaConsulta`, `IPBloqueada`, `IntentoFallido`
     - Campos relacionales en tablas existentes
     - Restricciones FOREIGN KEY

2. **Actualización de Tipos TypeScript**
   - Definir interfaces para nuevas entidades en `backend/src/types`
   - Extender interfaces existentes con campos relacionales

3. **Modificación de Servicios**
   - Actualizar servicios en `backend/src/services` para:
     - Manejar operaciones CRUD con relaciones
     - Implementar joins en consultas
     - Validar restricciones relacionales

4. **Actualización de Controladores**
   - Modificar controladores en `backend/src/controllers` para:
     - Incluir datos relacionados en respuestas API
     - Manejar operaciones transaccionales

5. **Refactorización Frontend**
   - Actualizar componentes en `frontend/src/components` para:
     - Mostrar datos relacionados (ej: región de vendedora)
     - Manejar selección de relaciones en formularios

6. **Implementación de Auditoría**
   - Crear servicio de auditoría en `backend/src/services/auditService.ts`
   - Registrar consultas a datos sensibles
   - Implementar bloqueo de IPs después de intentos fallidos

## Diagrama de Relaciones

```mermaid
erDiagram
    Usuario ||--o{ Region : pertenece
    Usuario ||--o{ Usuario : creadoPor
    Vendedora ||--o{ Region : opera_en
    Vendedora ||--o{ Usuario : registrada_por
    Vendedora ||--o{ Usuario : gerente_zona
    HistorialVendedora ||--o{ Vendedora : historial
    Mensaje ||--o{ Usuario : remitente
    Mensaje ||--o{ Usuario : destinatario