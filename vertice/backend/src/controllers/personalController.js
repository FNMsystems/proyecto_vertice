import { query } from '../config/db.js';

/**
 * Obtener todo el personal activo.
 */
export const getPersonal = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        id,
        rut,
        nombres,
        apellido_paterno,
        apellido_materno,
        correo,
        telefono,
        especialidad,
        activo,
        creado_en,
        actualizado_en
      FROM docentes
      WHERE activo = TRUE
      ORDER BY apellido_paterno, apellido_materno, nombres;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener personal:', error);

    res.status(500).json({
      error: 'Error al obtener el personal.'
    });
  }
};

/**
 * Desvincular un docente.
 */
export const desvincularPersonal = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: 'Debe indicar el ID del docente.'
    });
  }

  try {
    const result = await query(
      `
        UPDATE docentes
        SET
          activo = FALSE,
          actualizado_en = NOW()
        WHERE id = $1
        RETURNING
          id,
          rut,
          nombres,
          apellido_paterno,
          apellido_materno,
          correo,
          activo,
          actualizado_en;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No se encontró el docente.'
      });
    }

    res.json({
      mensaje: 'Docente desvinculado correctamente.',
      docente: result.rows[0]
    });
  } catch (error) {
    console.error('Error al desvincular docente:', error);

    res.status(500).json({
      error: 'Error al desvincular el docente.'
    });
  }
};