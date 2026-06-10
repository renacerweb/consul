-- Agrega la columna descripcion a la tabla Vendedora en Supabase/PostgreSQL
ALTER TABLE "Vendedora"
ADD COLUMN IF NOT EXISTS descripcion TEXT;
