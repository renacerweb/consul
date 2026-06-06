-- SQL para crear índices que aceleran búsquedas por cédula y email
CREATE INDEX IF NOT EXISTS idx_vendedora_cedula ON "Vendedora"(cedula);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON "Usuario"(email);
