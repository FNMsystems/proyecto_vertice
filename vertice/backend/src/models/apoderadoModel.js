import pool from '../config/db.js';

export const getApoderadoPorRutModel = async (rut) => {
  const query = `
    SELECT
      id,
      rut,
      nombre_completo,
      telefono,
      correo,
      direccion,
      comuna,
      nacionalidad,
      escolaridad,
      actividad,
      lugar_trabajo
    FROM apoderados
    WHERE REPLACE(REPLACE(UPPER(rut), '.', ''), '-', '') =
          REPLACE(REPLACE(UPPER($1), '.', ''), '-', '')
    LIMIT 1
  `;

  const result = await pool.query(
    query,
    [rut]
  );

  return result.rows[0] || null;
};

export const getAlumnosPorApoderadoModel = async (
  apoderadoId
) => {
  const query = `
    SELECT
      a.id,
      a.rut,
      a.nombres,
      a.apellido_paterno,
      a.apellido_materno,
      a.fecha_nacimiento,
      a.sexo,
      a.nacionalidad,
      c.id AS curso_id,
      c.nombre AS curso,
      aa.parentesco,
      aa.es_apoderado_principal
    FROM alumno_apoderado aa
    INNER JOIN alumnos a
      ON a.id = aa.alumno_id
    LEFT JOIN matriculas m
      ON m.alumno_id = a.id
      AND m.anio = 2026
    LEFT JOIN cursos c
      ON c.id = m.curso_id
    WHERE aa.apoderado_id = $1
    ORDER BY
      a.apellido_paterno,
      a.apellido_materno,
      a.nombres
  `;

  const result = await pool.query(
    query,
    [apoderadoId]
  );

  return result.rows;
};

export const getDetalleAlumnoModel = async (
  alumnoId
) => {
  const asignaturasQuery = `
    SELECT
      asig.id AS asignatura_id,
      asig.nombre,
      ARRAY_AGG(
        n.nota
        ORDER BY n.fecha NULLS LAST, n.creado_en
      ) FILTER (
        WHERE n.nota IS NOT NULL
      ) AS notas,
      ROUND(AVG(n.nota), 1) AS promedio
    FROM notas n
    INNER JOIN asignaturas asig
      ON asig.id = n.asignatura_id
    WHERE n.alumno_id = $1
    GROUP BY
      asig.id,
      asig.nombre
    ORDER BY
      asig.nombre
  `;

  const anotacionesQuery = `
    SELECT
      an.id,
      an.fecha,
      an.tipo,
      an.titulo,
      an.descripcion,
      d.nombres AS docente_nombres,
      d.apellido_paterno AS docente_apellido_paterno,
      d.apellido_materno AS docente_apellido_materno
    FROM anotaciones an
    LEFT JOIN docentes d
      ON d.id = an.docente_id
    WHERE an.alumno_id = $1
    ORDER BY
      an.fecha DESC,
      an.creado_en DESC
  `;

  const asistenciaQuery = `
    SELECT
      fecha,
      estado,
      observacion
    FROM asistencia
    WHERE alumno_id = $1
    ORDER BY fecha DESC
  `;

  const [
    asignaturas,
    anotaciones,
    asistencia
  ] = await Promise.all([
    pool.query(
      asignaturasQuery,
      [alumnoId]
    ),
    pool.query(
      anotacionesQuery,
      [alumnoId]
    ),
    pool.query(
      asistenciaQuery,
      [alumnoId]
    )
  ]);

  return {
    asignaturas: asignaturas.rows,
    anotaciones: anotaciones.rows,
    asistencia: asistencia.rows,
    comunicaciones: [],
    pie: null
  };
};

export const getPersonasAutorizadasRetiroModel = async (
  alumnoId,
  apoderadoId
) => {
  const query = `
    SELECT
      p.id,
      p.nombre_completo,
      p.rut,
      p.parentesco,
      p.telefono,
      p.numero_autorizacion,
      p.activo,
      CASE
        WHEN REPLACE(
          REPLACE(UPPER(p.rut), '.', ''),
          '-',
          ''
        ) =
        REPLACE(
          REPLACE(UPPER(ap.rut), '.', ''),
          '-',
          ''
        )
        THEN TRUE
        ELSE FALSE
      END AS es_apoderado
    FROM personas_autorizadas_retiro p
    INNER JOIN alumno_apoderado aa
      ON aa.alumno_id = p.alumno_id
    INNER JOIN apoderados ap
      ON ap.id = aa.apoderado_id
    WHERE p.alumno_id = $1
      AND aa.apoderado_id = $2
      AND p.activo = TRUE
    ORDER BY
      es_apoderado DESC,
      p.nombre_completo
  `;

  const result = await pool.query(
    query,
    [alumnoId, apoderadoId]
  );

  return result.rows;
};

export const crearJustificativoModel = async (
  alumnoId,
  fechaInicio,
  fechaFin,
  motivo,
  archivoPdf
) => {
  const query = `
    INSERT INTO justificativos (
      alumno_id,
      fecha_inicio,
      fecha_fin,
      motivo,
      archivo_pdf,
      estado
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      'PENDIENTE'
    )
    RETURNING
      id,
      alumno_id,
      fecha_inicio,
      fecha_fin,
      motivo,
      archivo_pdf,
      estado,
      observacion,
      creado_en
  `;

  const result = await pool.query(
    query,
    [
      alumnoId,
      fechaInicio,
      fechaFin || null,
      motivo,
      archivoPdf || null
    ]
  );

  return result.rows[0];
};