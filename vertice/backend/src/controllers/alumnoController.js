import { query } from '../config/db.js';

/**
 * Obtener todos los alumnos activos.
 */
export const getAlumnos = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        id,
        nombres,
        apellido_paterno,
        apellido_materno,
        rut,
        fecha_nacimiento,
        sexo,
        direccion,
        comuna,
        nacionalidad,
        activo,
        creado_en,
        actualizado_en
      FROM alumnos
      WHERE activo = TRUE
      ORDER BY apellido_paterno, apellido_materno, nombres;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);

    res.status(500).json({
      error: 'Error al obtener los alumnos.'
    });
  }
};

/**
 * Obtener un alumno por ID.
 */
export const getAlumnoPorId = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: 'Debe indicar el ID del alumno.'
    });
  }

  try {
    const result = await query(
      `
        SELECT
          id,
          nombres,
          apellido_paterno,
          apellido_materno,
          rut,
          fecha_nacimiento,
          sexo,
          direccion,
          comuna,
          nacionalidad,
          activo,
          creado_en,
          actualizado_en
        FROM alumnos
        WHERE id = $1
        LIMIT 1;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No se encontró el alumno.'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener alumno:', error);

    res.status(500).json({
      error: 'Error al obtener el alumno.'
    });
  }
};

/**
 * Expulsar/desvincular un alumno.
 */
export const expulsarAlumno = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: 'Debe indicar el ID del alumno.'
    });
  }

  try {
    const result = await query(
      `
        UPDATE alumnos
        SET
          activo = FALSE,
          actualizado_en = NOW()
        WHERE id = $1
        RETURNING
          id,
          nombres,
          apellido_paterno,
          apellido_materno,
          rut,
          activo,
          actualizado_en;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No se encontró el alumno.'
      });
    }

    res.json({
      mensaje: 'Alumno desvinculado correctamente.',
      alumno: result.rows[0]
    });
  } catch (error) {
    console.error('Error al expulsar alumno:', error);

    res.status(500).json({
      error: 'Error al desvincular el alumno.'
    });
  }
};