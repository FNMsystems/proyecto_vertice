import { query } from '../config/db.js';


export const buscarDocentePorEmail = async (email) => {
  const text = `
    SELECT
      d.id,
      d.rut,
      d.nombres,
      d.apellido_paterno,
      d.apellido_materno,
      d.correo,
      d.telefono,
      d.especialidad,
      d.activo
    FROM docentes d
    WHERE LOWER(d.correo) = LOWER($1)
      AND d.activo = TRUE
    LIMIT 1;
  `;

  const { rows } = await query(text, [email]);

  return rows[0] || null;
};


export const obtenerDashboardDocente = async (docenteId, anio = 2026) => {

  const text = `
    SELECT
      d.id AS docente_id,
      d.rut AS docente_rut,
      d.nombres AS docente_nombres,
      d.apellido_paterno AS docente_apellido_paterno,
      d.apellido_materno AS docente_apellido_materno,
      d.correo AS docente_correo,
      d.especialidad,

      c.id AS curso_id,
      c.nombre AS curso_nombre,
      c.codigo_nivel,
      c.jornada,
      c.anio AS curso_anio,

      a.id AS asignatura_id,
      a.nombre AS asignatura_nombre,
      a.codigo AS asignatura_codigo,

      dc.es_profesor_jefe

    FROM docentes d

    INNER JOIN docente_curso dc
      ON dc.docente_id = d.id

    INNER JOIN cursos c
      ON c.id = dc.curso_id

    INNER JOIN asignaturas a
      ON a.id = dc.asignatura_id

    WHERE d.id = $1
      AND d.activo = TRUE
      AND c.activo = TRUE
      AND a.activo = TRUE
      AND dc.anio = $2
      AND c.anio = $2

    ORDER BY
      c.nombre ASC,
      a.nombre ASC;
  `;

  const { rows } = await query(text, [docenteId, anio]);

  return rows;
};