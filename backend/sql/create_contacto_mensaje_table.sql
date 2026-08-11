-- Create a dedicated table for Home contact messages.
-- These records are also mirrored into the existing "Mensaje" table
-- so they appear in the gerente inbox without changing current message queries.

CREATE TABLE IF NOT EXISTS "ContactoMensaje" (
  "id" serial PRIMARY KEY,
  "nombre" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "asunto" varchar(255) NOT NULL,
  "mensaje" text NOT NULL,
  "mensajeId" integer REFERENCES "Mensaje"(id) ON DELETE CASCADE,
  "createdAt" timestamp without time zone DEFAULT now()
);
