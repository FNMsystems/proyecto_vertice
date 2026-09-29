import pool from "../config/db.js";

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

  const result = await pool.query(query, [rut]);

  return result.rows[0] || null;
};

export const getAlumnosPorApoderadoModel = async (apoderadoId) => {
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

  const result = await pool.query(query, [apoderadoId]);

  return result.rows;
};

export const getDetalleAlumnoModel = async (alumnoId) => {
  const asignaturasQuery = `
    WITH matricula_actual AS (
      SELECT
        m.alumno_id,
        m.curso_id,
        m.anio
      FROM matriculas m
      WHERE m.alumno_id = $1
        AND m.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    ),
    docentes_asignatura AS (
      SELECT
        dc.curso_id,
        dc.asignatura_id,
        dc.anio,
        JSONB_AGG(
          JSONB_BUILD_OBJECT(
            'id', d.id,
            'nombre',
              CONCAT_WS(
                ' ',
                NULLIF(TRIM(d.nombres), ''),
                NULLIF(TRIM(d.apellido_paterno), ''),
                NULLIF(TRIM(d.apellido_materno), '')
              ),
            'correo', NULLIF(TRIM(d.correo), ''),
            'rut', d.rut
          )
        ) FILTER (
          WHERE d.id IS NOT NULL
            AND COALESCE(d.rut, '') NOT LIKE 'PEND-%'
        ) AS docentes
      FROM docente_curso dc
      INNER JOIN docentes d
        ON d.id = dc.docente_id
      GROUP BY
        dc.curso_id,
        dc.asignatura_id,
        dc.anio
    ),
    calificaciones AS (
      SELECT
        n.alumno_id,
        n.curso_id,
        n.asignatura_id,
        n.anio,
        ARRAY_AGG(
          n.nota
          ORDER BY n.fecha NULLS LAST, n.creado_en
        ) FILTER (
          WHERE n.nota IS NOT NULL
        ) AS notas,
        ROUND(AVG(n.nota), 1) AS promedio
      FROM notas n
      GROUP BY
        n.alumno_id,
        n.curso_id,
        n.asignatura_id,
        n.anio
    )
    SELECT
      asig.id AS asignatura_id,
      asig.nombre,
      asig.codigo,
      COALESCE(
        da.docentes,
        '[]'::jsonb
      ) AS docentes,
      COALESCE(
        cal.notas,
        ARRAY[]::numeric[]
      ) AS notas,
      cal.promedio
    FROM matricula_actual m
    INNER JOIN docentes_asignatura da
      ON da.curso_id = m.curso_id
     AND da.anio = m.anio
    INNER JOIN asignaturas asig
      ON asig.id = da.asignatura_id
     AND asig.activo = TRUE
    LEFT JOIN calificaciones cal
      ON cal.alumno_id = m.alumno_id
     AND cal.curso_id = m.curso_id
     AND cal.asignatura_id = asig.id
     AND cal.anio = m.anio
    ORDER BY asig.nombre
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

  const [asignaturas, anotaciones, asistencia] = await Promise.all([
    pool.query(asignaturasQuery, [alumnoId]),
    pool.query(anotacionesQuery, [alumnoId]),
    pool.query(asistenciaQuery, [alumnoId]),
  ]);

  return {
    asignaturas: asignaturas.rows.map((asignatura) => {
      const docentes = Array.isArray(asignatura.docentes)
        ? asignatura.docentes
        : [];

      const primerDocente = docentes[0] || null;

      return {
        asignatura_id: asignatura.asignatura_id,
        nombre: asignatura.nombre,
        codigo: asignatura.codigo,

        docente_id: primerDocente?.id || null,
        docente_nombre: primerDocente?.nombre || null,
        docente_correo: primerDocente?.correo || null,

        docentes,

        notas: asignatura.notas || [],
        promedio: asignatura.promedio,
      };
    }),

    anotaciones: anotaciones.rows,

    asistencia: asistencia.rows,

    comunicaciones: [],

    pie: null,
  };
};

export const getPersonasAutorizadasRetiroModel = async (
  alumnoId,
  apoderadoId,
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

  const result = await pool.query(query, [alumnoId, apoderadoId]);

  return result.rows;
};

export const crearJustificativoModel = async (
  alumnoId,
  fechaInicio,
  fechaFin,
  motivo,
  archivoPdf,
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

  const result = await pool.query(query, [
    alumnoId,
    fechaInicio,
    fechaFin || null,
    motivo,
    archivoPdf || null,
  ]);

  return result.rows[0];
};