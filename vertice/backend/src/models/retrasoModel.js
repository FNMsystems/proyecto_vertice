import { query } from '../config/db.js';

export const obtenerCursosInspectorModel = async () => {
  const { rows } = await query(`
    SELECT
      c.id,
      c.codigo_nivel,
      c.nombre,
      c.jornada,
      c.anio
    FROM cursos c
    WHERE c.activo = TRUE
      AND c.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    ORDER BY
      c.codigo_nivel,
      c.nombre;
  `);

  return rows;
};

export const obtenerAlumnosCursoModel = async (
  cursoId
) => {
  const { rows } = await query(
    `
      SELECT
        a.id,
        a.rut,
        a.nombres,
        a.apellido_paterno,
        a.apellido_materno,
        CONCAT_WS(
          ' ',
          a.nombres,
          a.apellido_paterno,
          a.apellido_materno
        ) AS nombre_completo
      FROM alumnos a
      INNER JOIN matriculas m
        ON m.alumno_id = a.id
      INNER JOIN cursos c
        ON c.id = m.curso_id
      WHERE m.curso_id = $1
        AND m.anio = c.anio
        AND c.activo = TRUE
        AND c.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        AND m.estado = 'ACTIVA'
      ORDER BY
        a.apellido_paterno,
        a.apellido_materno,
        a.nombres;
    `,
    [cursoId]
  );

  return rows;
};

export const registrarRetrasoModel = async ({
  alumnoId,
  cursoId,
  fecha,
  horaLlegada,
  motivo,
  observacion,
  registradoPor
}) => {
  const alumnoResult = await query(
    `
      SELECT
        a.id,
        a.rut,
        CONCAT_WS(
          ' ',
          a.nombres,
          a.apellido_paterno,
          a.apellido_materno
        ) AS nombre_completo,
        c.id AS curso_id,
        c.nombre AS curso
      FROM alumnos a
      INNER JOIN matriculas m
        ON m.alumno_id = a.id
      INNER JOIN cursos c
        ON c.id = m.curso_id
      WHERE a.id = $1
        AND c.id = $2
        AND m.anio = c.anio
        AND c.activo = TRUE
        AND m.estado = 'ACTIVA'
      LIMIT 1;
    `,
    [alumnoId, cursoId]
  );

  if (alumnoResult.rows.length === 0) {
    throw new Error(
      'El alumno no está matriculado en el curso seleccionado.'
    );
  }

  const { rows } = await query(
    `
      INSERT INTO retrasos (
        alumno_id,
        curso_id,
        fecha,
        hora_llegada,
        motivo,
        observacion,
        registrado_por
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7
      )
      RETURNING
        id,
        alumno_id,
        curso_id,
        fecha,
        hora_llegada,
        motivo,
        observacion,
        registrado_por,
        creado_en;
    `,
    [
      alumnoId,
      cursoId,
      fecha,
      horaLlegada,
      motivo || null,
      observacion || null,
      registradoPor
    ]
  );

  return {
    retraso: rows[0],
    alumno: alumnoResult.rows[0]
  };
};