import { Request, Response } from 'express';
import pool from '../db';

export async function enviarContactoController(req: Request, res: Response) {
  try {
    const { nombre, email, asunto, mensaje } = req.body;

    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Guardar el mensaje de contacto original
    const contactoResult = await pool.query(
      `INSERT INTO "ContactoMensaje" (nombre, email, asunto, mensaje)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nombre, email, asunto, mensaje]
    );

    // Crear un mensaje interno para que lo vea el gerente regional
    const internoResult = await pool.query(
      `INSERT INTO "Mensaje" (titulo, contenido, "remitenteId", "paraTodosGerentes")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        `Mensaje de contacto: ${asunto}`,
        `Nombre: ${nombre}\nEmail: ${email}\n\n${mensaje}`,
        null,
        true,
      ]
    );

    const mensajeId = internoResult.rows[0].id;

    await pool.query(
      `UPDATE "ContactoMensaje" SET "mensajeId" = $1 WHERE id = $2`,
      [mensajeId, contactoResult.rows[0].id]
    );

    res.status(201).json({ mensaje: 'Mensaje de contacto enviado correctamente' });
  } catch (error: any) {
    console.error('Error al enviar contacto:', error);
    res.status(500).json({ error: error.message });
  }
}
