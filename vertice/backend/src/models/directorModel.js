import { query } from '../config/db.js';

export const obtenerResumenDirectorModel = async (anio = 2026) => {
  const [
    alumnos,
    docentes,
    cursos,
    matriculas,
    asistencia,
    notas,
    justificativos,
    atrasos,
    retiros
  ] = await Promise.all([
    query(`
      SELECT COUNT(*)::INTEGER AS total
      FROM alumnos
    `),

    query(`
      SELECT COUNT(*)::INTEGER AS total
      FROM docentes
      WHERE activo = TRUE
    `),

    query(`
      SELECT COUNT(*)::INTEGER AS total
      FROM cursos
      WHERE activo = TRUE
        AND anio = $1
    `, [anio]),

    query(`
      SELECT COUNT(*)::INTEGER AS total
      FROM matriculas
      WHERE anio = $1
        AND estado = 'ACTIVA'
    `, [anio]),

    query(`
      SELECT
        COUNT(*)::INTEGER AS total_registros,
        COUNT(*) FILTER (
          WHERE UPPER(TRIM(estado)) IN ('PRESENTE', 'ASISTIO', 'P')
        )::INTEGER AS presentes,
        COUNT(*) FILTER (
          WHERE UPPER(TRIM(estado)) IN ('AUSENTE', 'INASISTENTE', 'A')
        )::INTEGER AS ausentes,
        COUNT(*) FILTER (
          WHERE UPPER(TRIM(estado)) IN ('JUSTIFICADO', 'JUSTIFICADA')
        )::INTEGER AS justificados
      FROM asistencia a
      INNER JOIN cursos c ON c.id = a.curso_id
      WHERE c.anio = $1
    `, [anio]),

    query(`
      SELECT
        COUNT(*)::INTEGER AS total,
        ROUND(AVG(nota), 2) AS promedio
      FROM notas
      WHERE anio = $1
        AND nota IS NOT NULL
    `, [anio]),

    query(`
      SELECT COUNT(*)::INTEGER AS total
      FROM justificativos j
      INNER JOIN matriculas m ON m.alumno_id = j.alumno_id
      WHERE m.anio = $1
        AND UPPER(COALESCE(j.estado, '')) = 'PENDIENTE'
    `, [anio]),

    query(`
      SELECT COUNT(*)::INTEGER AS total
      FROM retrasos r
      INNER JOIN cursos c ON c.id = r.curso_id
      WHERE c.anio = $1
    `, [anio]),

    query(`
      SELECT COUNT(*)::INTEGER AS total
      FROM retiros_estudiante r
      INNER JOIN cursos c ON c.id = r.curso_id
      WHERE c.anio = $1
    `, [anio])
  ]);

  const asistenciaData = asistencia.rows[0];
  const totalAsistencia = Number(asistenciaData.total_registros || 0);
  const presentes = Number(asistenciaData.presentes || 0);

  return {
    anio,
    alumnos: Number(alumnos.rows[0].total || 0),
    docentes: Number(docentes.rows[0].total || 0),
    cursos: Number(cursos.rows[0].total || 0),
    matriculas: Number(matriculas.rows[0].total || 0),
    asistencia: {
      total_registros: totalAsistencia,
      presentes,
      ausentes: Number(asistenciaData.ausentes || 0),
      justificados: Number(asistenciaData.justificados || 0),
      porcentaje: totalAsistencia > 0
        ? Number(((presentes / totalAsistencia) * 100).toFixed(2))
        : 0
    },
    notas: {
      total: Number(notas.rows[0].total || 0),
      promedio: notas.rows[0].promedio
        ? Number(notas.rows[0].promedio)
        : 0
    },
    justificativos_pendientes: Number(justificativos.rows[0].total || 0),
    atrasos: Number(atrasos.rows[0].total || 0),
    retiros: Number(retiros.rows[0].total || 0)
  };
};

export const obtenerAlumnosDirectorModel = async (anio = 2026) => {
  const result = await query(`
    SELECT
      a.id,
      a.rut,
      a.nombres,
      a.apellido_paterno,
      a.apellido_materno,
      a.fecha_nacimiento,
      a.sexo,
      a.nacionalidad,
      a.direccion,
      a.comuna,
      m.id AS matricula_id,
      m.anio AS matricula_anio,
      m.estado AS matricula_estado,
      m.fecha_matricula,
      m.ha_repetido,
      c.id AS curso_id,
      c.nombre AS curso,
      c.jornada,
      c.codigo_nivel
    FROM alumnos a
    LEFT JOIN matriculas m
      ON m.alumno_id = a.id
      AND m.anio = $1
    LEFT JOIN cursos c
      ON c.id = m.curso_id
    ORDER BY
      a.apellido_paterno,
      a.apellido_materno,
      a.nombres
  `, [anio]);

  return result.rows;
};

export const obtenerDetalleAlumnoDirectorModel = async (alumnoId, anio = 2026) => {
  const alumno = await query(`
    SELECT
      a.*,
      m.id AS matricula_id,
      m.anio,
      m.estado AS matricula_estado,
      m.fecha_matricula,
      m.ha_repetido,
      m.opta_religion,
      m.credo_religioso,
      m.pertenece_programa_social,
      m.procedencia_escolar,
      m.observaciones_relevantes,
      m.se_atiende_centro_salud,
      m.nombre_centro_salud,
      m.pertenece_pueblo_indigena,
      m.porcentaje_registro_social,
      m.vivienda,
      m.numero_personas_hogar,
      m.personas_trabajando_hogar,
      m.ingreso_mensual_hogar,
      m.numero_habitaciones,
      m.con_quien_vive,
      m.sistema_salud,
      m.tiene_agua,
      m.tiene_electricidad,
      m.tiene_alcantarillado,
      m.autorizado_salir_solo,
      m.observaciones AS matricula_observaciones,
      c.id AS curso_id,
      c.nombre AS curso,
      c.jornada
    FROM alumnos a
    LEFT JOIN matriculas m
      ON m.alumno_id = a.id
      AND m.anio = $2
    LEFT JOIN cursos c
      ON c.id = m.curso_id
    WHERE a.id = $1
    LIMIT 1
  `, [alumnoId, anio]);

  if (!alumno.rows[0]) {
    return null;
  }

  const [
    apoderados,
    asistencia,
    notas,
    justificativos,
    anotaciones,
    retrasos,
    retiros,
    autorizados
  ] = await Promise.all([
    query(`
      SELECT
        ap.id,
        ap.rut,
        ap.nombre_completo,
        ap.telefono,
        ap.correo,
        ap.direccion,
        ap.comuna,
        ap.nacionalidad,
        ap.escolaridad,
        ap.actividad,
        ap.lugar_trabajo,
        aa.parentesco,
        aa.es_apoderado_principal
      FROM alumno_apoderado aa
      INNER JOIN apoderados ap
        ON ap.id = aa.apoderado_id
      WHERE aa.alumno_id = $1
      ORDER BY aa.es_apoderado_principal DESC, ap.nombre_completo
    `, [alumnoId]),

    query(`
      SELECT
        asis.id,
        asis.fecha,
        asis.estado,
        asis.observacion,
        d.id AS docente_id,
        CONCAT_WS(
          ' ',
          d.nombres,
          d.apellido_paterno,
          d.apellido_materno
        ) AS docente
      FROM asistencia asis
      LEFT JOIN docentes d
        ON d.id = asis.docente_id
      WHERE asis.alumno_id = $1
      ORDER BY asis.fecha DESC
    `, [alumnoId]),

    query(`
      SELECT
        n.id,
        n.periodo,
        n.tipo_evaluacion,
        n.nota,
        n.porcentaje,
        n.fecha,
        n.observacion,
        n.asignatura_id,
        a.nombre AS asignatura,
        CONCAT_WS(
          ' ',
          d.nombres,
          d.apellido_paterno,
          d.apellido_materno
        ) AS docente
      FROM notas n
      INNER JOIN asignaturas a
        ON a.id = n.asignatura_id
      LEFT JOIN docentes d
        ON d.id = n.docente_id
      WHERE n.alumno_id = $1
        AND n.anio = $2
      ORDER BY
        a.nombre,
        n.fecha DESC NULLS LAST,
        n.creado_en DESC
    `, [alumnoId, anio]),

    query(`
      SELECT *
      FROM justificativos
      WHERE alumno_id = $1
      ORDER BY fecha_inicio DESC, creado_en DESC
    `, [alumnoId]),

    query(`
      SELECT
        an.id,
        an.fecha,
        an.tipo,
        an.titulo,
        an.descripcion,
        an.curso_id,
        CONCAT_WS(
          ' ',
          d.nombres,
          d.apellido_paterno,
          d.apellido_materno
        ) AS docente
      FROM anotaciones an
      LEFT JOIN docentes d
        ON d.id = an.docente_id
      WHERE an.alumno_id = $1
      ORDER BY an.fecha DESC, an.creado_en DESC
    `, [alumnoId]),

    query(`
      SELECT
        r.id,
        r.fecha,
        r.hora_llegada,
        r.motivo,
        r.observacion,
        c.nombre AS curso,
        CONCAT_WS(
          ' ',
          d.nombres,
          d.apellido_paterno,
          d.apellido_materno
        ) AS registrado_por
      FROM retrasos r
      INNER JOIN cursos c
        ON c.id = r.curso_id
      LEFT JOIN docentes d
        ON d.id = r.registrado_por
      WHERE r.alumno_id = $1
      ORDER BY r.fecha DESC, r.hora_llegada DESC
    `, [alumnoId]),

    query(`
      SELECT
        r.id,
        r.fecha_retiro,
        r.motivo,
        r.observacion,
        c.nombre AS curso
      FROM retiros_estudiante r
      LEFT JOIN cursos c
        ON c.id = r.curso_id
      WHERE r.alumno_id = $1
      ORDER BY r.fecha_retiro DESC
    `, [alumnoId]),

    query(`
      SELECT
        id,
        nombre_completo,
        rut,
        parentesco,
        telefono,
        numero_autorizacion,
        activo
      FROM personas_autorizadas_retiro
      WHERE alumno_id = $1
      ORDER BY numero_autorizacion NULLS LAST, nombre_completo
    `, [alumnoId])
  ]);

  return {
    alumno: alumno.rows[0],
    apoderados: apoderados.rows,
    asistencia: asistencia.rows,
    notas: notas.rows,
    justificativos: justificativos.rows,
    anotaciones: anotaciones.rows,
    retrasos: retrasos.rows,
    retiros: retiros.rows,
    personas_autorizadas: autorizados.rows
  };
};

export const obtenerDocentesDirectorModel = async (anio = 2026) => {
  const result = await query(`
    SELECT
      d.id,
      d.rut,
      d.nombres,
      d.apellido_paterno,
      d.apellido_materno,
      d.correo,
      d.telefono,
      d.especialidad,
      d.activo,
      COUNT(DISTINCT dc.curso_id)::INTEGER AS cantidad_cursos,
      COUNT(DISTINCT dc.asignatura_id)::INTEGER AS cantidad_asignaturas,
      COUNT(
        DISTINCT dc.curso_id
      ) FILTER (
        WHERE dc.es_profesor_jefe = TRUE
      )::INTEGER AS cursos_como_profesor_jefe
    FROM docentes d
    LEFT JOIN docente_curso dc
      ON dc.docente_id = d.id
      AND dc.anio = $1
    GROUP BY d.id
    ORDER BY
      d.apellido_paterno,
      d.apellido_materno,
      d.nombres
  `, [anio]);

  return result.rows;
};

export const obtenerDetalleDocenteDirectorModel = async (docenteId, anio = 2026) => {
  const docente = await query(`
    SELECT *
    FROM docentes
    WHERE id = $1
    LIMIT 1
  `, [docenteId]);

  if (!docente.rows[0]) {
    return null;
  }

  const [
    asignaciones,
    desvinculaciones
  ] = await Promise.all([
    query(`
      SELECT
        dc.id,
        dc.anio,
        dc.es_profesor_jefe,
        c.id AS curso_id,
        c.nombre AS curso,
        c.jornada,
        c.codigo_nivel,
        a.id AS asignatura_id,
        a.nombre AS asignatura,
        a.codigo AS asignatura_codigo
      FROM docente_curso dc
      INNER JOIN cursos c
        ON c.id = dc.curso_id
      INNER JOIN asignaturas a
        ON a.id = dc.asignatura_id
      WHERE dc.docente_id = $1
        AND dc.anio = $2
      ORDER BY
        c.nombre,
        a.nombre
    `, [docenteId, anio]),

    query(`
      SELECT *
      FROM desvinculaciones_docente
      WHERE docente_id = $1
      ORDER BY fecha_desvinculacion DESC, creado_en DESC
    `, [docenteId])
  ]);

  return {
    docente: docente.rows[0],
    asignaciones: asignaciones.rows,
    desvinculaciones: desvinculaciones.rows
  };
};

export const obtenerCursosDirectorModel = async (anio = 2026) => {
  const result = await query(`
    SELECT
      c.id,
      c.codigo_nivel,
      c.nombre,
      c.jornada,
      c.anio,
      c.activo,
      COUNT(DISTINCT m.alumno_id)::INTEGER AS cantidad_alumnos,
      COUNT(DISTINCT dc.docente_id)::INTEGER AS cantidad_docentes,
      COUNT(DISTINCT dc.asignatura_id)::INTEGER AS cantidad_asignaturas,
      MAX(
        CASE
          WHEN dc.es_profesor_jefe = TRUE
          THEN CONCAT_WS(
            ' ',
            d.nombres,
            d.apellido_paterno,
            d.apellido_materno
          )
        END
      ) AS profesor_jefe
    FROM cursos c
    LEFT JOIN matriculas m
      ON m.curso_id = c.id
      AND m.anio = $1
      AND m.estado = 'ACTIVA'
    LEFT JOIN docente_curso dc
      ON dc.curso_id = c.id
      AND dc.anio = $1
    LEFT JOIN docentes d
      ON d.id = dc.docente_id
    WHERE c.anio = $1
    GROUP BY c.id
    ORDER BY c.nombre
  `, [anio]);

  return result.rows;
};

export const obtenerDetalleCursoDirectorModel = async (cursoId, anio = 2026) => {
  const [
    curso,
    alumnos,
    docentes,
    horarios
  ] = await Promise.all([
    query(`
      SELECT *
      FROM cursos
      WHERE id = $1
      LIMIT 1
    `, [cursoId]),

    query(`
      SELECT
        a.id,
        a.rut,
        a.nombres,
        a.apellido_paterno,
        a.apellido_materno,
        m.estado AS matricula_estado
      FROM matriculas m
      INNER JOIN alumnos a
        ON a.id = m.alumno_id
      WHERE m.curso_id = $1
        AND m.anio = $2
      ORDER BY
        a.apellido_paterno,
        a.apellido_materno,
        a.nombres
    `, [cursoId, anio]),

    query(`
      SELECT
        dc.id,
        dc.es_profesor_jefe,
        d.id AS docente_id,
        d.rut,
        CONCAT_WS(
          ' ',
          d.nombres,
          d.apellido_paterno,
          d.apellido_materno
        ) AS docente,
        d.correo,
        d.telefono,
        d.especialidad,
        a.id AS asignatura_id,
        a.nombre AS asignatura,
        a.codigo AS asignatura_codigo
      FROM docente_curso dc
      INNER JOIN docentes d
        ON d.id = dc.docente_id
      INNER JOIN asignaturas a
        ON a.id = dc.asignatura_id
      WHERE dc.curso_id = $1
        AND dc.anio = $2
      ORDER BY
        a.nombre,
        docente
    `, [cursoId, anio]),

    query(`
      SELECT
        h.id,
        h.dia_semana,
        h.hora_inicio,
        h.hora_fin,
        a.id AS asignatura_id,
        a.nombre AS asignatura,
        d.id AS docente_id,
        CONCAT_WS(
          ' ',
          d.nombres,
          d.apellido_paterno,
          d.apellido_materno
        ) AS docente
      FROM horarios h
      INNER JOIN asignaturas a
        ON a.id = h.asignatura_id
      LEFT JOIN docentes d
        ON d.id = h.docente_id
      WHERE h.curso_id = $1
        AND h.anio = $2
      ORDER BY
        h.dia_semana,
        h.hora_inicio
    `, [cursoId, anio])
  ]);

  if (!curso.rows[0]) {
    return null;
  }

  return {
    curso: curso.rows[0],
    alumnos: alumnos.rows,
    docentes: docentes.rows,
    horarios: horarios.rows
  };
};

export const obtenerAsignaturasDirectorModel = async () => {
  const result = await query(`
    SELECT
      id,
      codigo,
      nombre,
      activo
    FROM asignaturas
    WHERE activo = TRUE
    ORDER BY nombre
  `);

  return result.rows;
};

export const obtenerAsignacionesDocenteDirectorModel = async (anio = 2026) => {
  const result = await query(`
    SELECT
      dc.id,
      dc.anio,
      dc.es_profesor_jefe,
      d.id AS docente_id,
      d.rut AS docente_rut,
      CONCAT_WS(
        ' ',
        d.nombres,
        d.apellido_paterno,
        d.apellido_materno
      ) AS docente,
      c.id AS curso_id,
      c.nombre AS curso,
      a.id AS asignatura_id,
      a.nombre AS asignatura
    FROM docente_curso dc
    INNER JOIN docentes d
      ON d.id = dc.docente_id
    INNER JOIN cursos c
      ON c.id = dc.curso_id
    INNER JOIN asignaturas a
      ON a.id = dc.asignatura_id
    WHERE dc.anio = $1
    ORDER BY
      c.nombre,
      a.nombre,
      docente
  `, [anio]);

  return result.rows;
};

export const crearDocenteDirectorModel = async (datos) => {
  const result = await query(`
    INSERT INTO docentes (
      rut,
      nombres,
      apellido_paterno,
      apellido_materno,
      correo,
      telefono,
      especialidad,
      activo
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      TRUE
    )
    RETURNING *
  `, [
    datos.rut,
    datos.nombres,
    datos.apellido_paterno || null,
    datos.apellido_materno || null,
    datos.correo || null,
    datos.telefono || null,
    datos.especialidad || null
  ]);

  return result.rows[0];
};

export const actualizarDocenteDirectorModel = async (docenteId, datos) => {
  const result = await query(`
    UPDATE docentes
    SET
      rut = $2,
      nombres = $3,
      apellido_paterno = $4,
      apellido_materno = $5,
      correo = $6,
      telefono = $7,
      especialidad = $8,
      actualizado_en = NOW()
    WHERE id = $1
    RETURNING *
  `, [
    docenteId,
    datos.rut,
    datos.nombres,
    datos.apellido_paterno || null,
    datos.apellido_materno || null,
    datos.correo || null,
    datos.telefono || null,
    datos.especialidad || null
  ]);

  return result.rows[0] || null;
};

export const desvincularDocenteDirectorModel = async (
  docenteId,
  motivo,
  observacion = null,
  fechaDesvinculacion = null
) => {
  const clientQuery = `
    INSERT INTO desvinculaciones_docente (
      docente_id,
      fecha_desvinculacion,
      motivo,
      observacion
    )
    VALUES (
      $1,
      COALESCE($4::DATE, CURRENT_DATE),
      $2,
      $3
    )
    RETURNING *
  `;

  const result = await query(clientQuery, [
    docenteId,
    motivo,
    observacion,
    fechaDesvinculacion
  ]);

  await query(`
    UPDATE docentes
    SET
      activo = FALSE,
      actualizado_en = NOW()
    WHERE id = $1
  `, [docenteId]);

  return result.rows[0];
};

export const reactivarDocenteDirectorModel = async (docenteId) => {
  const result = await query(`
    UPDATE docentes
    SET
      activo = TRUE,
      actualizado_en = NOW()
    WHERE id = $1
    RETURNING *
  `, [docenteId]);

  return result.rows[0] || null;
};

export const crearAsignacionDocenteDirectorModel = async (datos) => {
  const result = await query(`
    INSERT INTO docente_curso (
      docente_id,
      curso_id,
      asignatura_id,
      anio,
      es_profesor_jefe
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5
    )
    RETURNING *
  `, [
    datos.docente_id,
    datos.curso_id,
    datos.asignatura_id,
    datos.anio || 2026,
    Boolean(datos.es_profesor_jefe)
  ]);

  return result.rows[0];
};

export const actualizarAsignacionDocenteDirectorModel = async (
  asignacionId,
  datos
) => {
  const result = await query(`
    UPDATE docente_curso
    SET
      docente_id = $2,
      curso_id = $3,
      asignatura_id = $4,
      anio = $5,
      es_profesor_jefe = $6
    WHERE id = $1
    RETURNING *
  `, [
    asignacionId,
    datos.docente_id,
    datos.curso_id,
    datos.asignatura_id,
    datos.anio || 2026,
    Boolean(datos.es_profesor_jefe)
  ]);

  return result.rows[0] || null;
};

export const eliminarAsignacionDocenteDirectorModel = async (asignacionId) => {
  const result = await query(`
    DELETE FROM docente_curso
    WHERE id = $1
    RETURNING *
  `, [asignacionId]);

  return result.rows[0] || null;
};

export const obtenerAsistenciaDirectorModel = async (
  anio = 2026,
  cursoId = null,
  fechaInicio = null,
  fechaFin = null
) => {
  const result = await query(`
    SELECT
      asis.id,
      asis.fecha,
      asis.estado,
      asis.observacion,
      a.id AS alumno_id,
      a.rut,
      CONCAT_WS(
        ' ',
        a.nombres,
        a.apellido_paterno,
        a.apellido_materno
      ) AS alumno,
      c.id AS curso_id,
      c.nombre AS curso,
      CONCAT_WS(
        ' ',
        d.nombres,
        d.apellido_paterno,
        d.apellido_materno
      ) AS docente
    FROM asistencia asis
    INNER JOIN alumnos a
      ON a.id = asis.alumno_id
    INNER JOIN cursos c
      ON c.id = asis.curso_id
    LEFT JOIN docentes d
      ON d.id = asis.docente_id
    WHERE c.anio = $1
      AND ($2::UUID IS NULL OR c.id = $2)
      AND ($3::DATE IS NULL OR asis.fecha >= $3)
      AND ($4::DATE IS NULL OR asis.fecha <= $4)
    ORDER BY
      asis.fecha DESC,
      c.nombre,
      a.apellido_paterno,
      a.nombres
  `, [anio, cursoId, fechaInicio, fechaFin]);

  return result.rows;
};

export const obtenerEstadisticasAsistenciaDirectorModel = async (anio = 2026) => {
  const result = await query(`
    SELECT
      c.id AS curso_id,
      c.nombre AS curso,
      COUNT(*)::INTEGER AS total_registros,
      COUNT(*) FILTER (
        WHERE UPPER(TRIM(asis.estado)) IN ('PRESENTE', 'ASISTIO', 'P')
      )::INTEGER AS presentes,
      COUNT(*) FILTER (
        WHERE UPPER(TRIM(asis.estado)) IN ('AUSENTE', 'INASISTENTE', 'A')
      )::INTEGER AS ausentes,
      COUNT(*) FILTER (
        WHERE UPPER(TRIM(asis.estado)) IN ('JUSTIFICADO', 'JUSTIFICADA')
      )::INTEGER AS justificados
    FROM asistencia asis
    INNER JOIN cursos c
      ON c.id = asis.curso_id
    WHERE c.anio = $1
    GROUP BY c.id, c.nombre
    ORDER BY c.nombre
  `, [anio]);

  return result.rows.map((row) => {
    const total = Number(row.total_registros || 0);
    const presentes = Number(row.presentes || 0);

    return {
      ...row,
      porcentaje_asistencia: total > 0
        ? Number(((presentes / total) * 100).toFixed(2))
        : 0
    };
  });
};

export const obtenerRendimientoDirectorModel = async (
  anio = 2026,
  cursoId = null
) => {
  const result = await query(`
    SELECT
      a.id AS alumno_id,
      a.rut,
      CONCAT_WS(
        ' ',
        a.nombres,
        a.apellido_paterno,
        a.apellido_materno
      ) AS alumno,
      c.id AS curso_id,
      c.nombre AS curso,
      asig.id AS asignatura_id,
      asig.nombre AS asignatura,
      COUNT(n.id)::INTEGER AS cantidad_notas,
      ROUND(AVG(n.nota), 2) AS promedio
    FROM notas n
    INNER JOIN alumnos a
      ON a.id = n.alumno_id
    INNER JOIN cursos c
      ON c.id = n.curso_id
    INNER JOIN asignaturas asig
      ON asig.id = n.asignatura_id
    WHERE n.anio = $1
      AND ($2::UUID IS NULL OR c.id = $2)
      AND n.nota IS NOT NULL
    GROUP BY
      a.id,
      a.rut,
      a.nombres,
      a.apellido_paterno,
      a.apellido_materno,
      c.id,
      c.nombre,
      asig.id,
      asig.nombre
    ORDER BY
      c.nombre,
      alumno,
      asig.nombre
  `, [anio, cursoId]);

  return result.rows;
};

export const obtenerJustificativosDirectorModel = async (
  anio = 2026,
  estado = null
) => {
  const result = await query(`
    SELECT
      j.id,
      j.fecha_inicio,
      j.fecha_fin,
      j.motivo,
      j.archivo_pdf,
      j.estado,
      j.observacion,
      j.creado_en,
      a.id AS alumno_id,
      a.rut,
      CONCAT_WS(
        ' ',
        a.nombres,
        a.apellido_paterno,
        a.apellido_materno
      ) AS alumno,
      c.nombre AS curso
    FROM justificativos j
    INNER JOIN alumnos a
      ON a.id = j.alumno_id
    LEFT JOIN matriculas m
      ON m.alumno_id = a.id
      AND m.anio = $1
    LEFT JOIN cursos c
      ON c.id = m.curso_id
    WHERE ($2::VARCHAR IS NULL OR UPPER(j.estado) = UPPER($2))
    ORDER BY
      j.fecha_inicio DESC,
      j.creado_en DESC
  `, [anio, estado]);

  return result.rows;
};

export const obtenerHorariosDirectorModel = async (
  anio = 2026,
  cursoId = null
) => {
  const result = await query(`
    SELECT
      h.id,
      h.dia_semana,
      h.hora_inicio,
      h.hora_fin,
      c.id AS curso_id,
      c.nombre AS curso,
      a.id AS asignatura_id,
      a.nombre AS asignatura,
      d.id AS docente_id,
      CONCAT_WS(
        ' ',
        d.nombres,
        d.apellido_paterno,
        d.apellido_materno
      ) AS docente
    FROM horarios h
    INNER JOIN cursos c
      ON c.id = h.curso_id
    INNER JOIN asignaturas a
      ON a.id = h.asignatura_id
    LEFT JOIN docentes d
      ON d.id = h.docente_id
    WHERE h.anio = $1
      AND ($2::UUID IS NULL OR h.curso_id = $2)
    ORDER BY
      c.nombre,
      h.dia_semana,
      h.hora_inicio
  `, [anio, cursoId]);

  return result.rows;
};

export const obtenerAnotacionesDirectorModel = async (
  anio = 2026
) => {
  const result = await query(`
    SELECT
      an.id,
      an.fecha,
      an.tipo,
      an.titulo,
      an.descripcion,
      a.id AS alumno_id,
      a.rut,
      CONCAT_WS(
        ' ',
        a.nombres,
        a.apellido_paterno,
        a.apellido_materno
      ) AS alumno,
      c.nombre AS curso,
      CONCAT_WS(
        ' ',
        d.nombres,
        d.apellido_paterno,
        d.apellido_materno
      ) AS docente
    FROM anotaciones an
    INNER JOIN alumnos a
      ON a.id = an.alumno_id
    LEFT JOIN cursos c
      ON c.id = an.curso_id
    LEFT JOIN docentes d
      ON d.id = an.docente_id
    LEFT JOIN matriculas m
      ON m.alumno_id = a.id
      AND m.anio = $1
    ORDER BY
      an.fecha DESC,
      an.creado_en DESC
  `, [anio]);

  return result.rows;
};

export const desvincularAlumnoDirectorModel = async (
  alumnoId,
  cursoId,
  motivo,
  observacion = null,
  fechaRetiro = null
) => {
  const result = await query(`
    INSERT INTO retiros_estudiante (
      alumno_id,
      curso_id,
      fecha_retiro,
      motivo,
      observacion
    )
    VALUES (
      $1,
      $2,
      COALESCE($5::DATE, CURRENT_DATE),
      $3,
      $4
    )
    RETURNING *
  `, [
    alumnoId,
    cursoId || null,
    motivo,
    observacion,
    fechaRetiro
  ]);

  await query(`
    UPDATE matriculas
    SET
      estado = 'RETIRADA',
      actualizado_en = NOW()
    WHERE alumno_id = $1
      AND ($2::UUID IS NULL OR curso_id = $2)
      AND anio = 2026
  `, [alumnoId, cursoId || null]);

  return result.rows[0];
};

export const actualizarEstadoJustificativoDirectorModel = async (
  justificativoId,
  estado,
  observacion = null
) => {
  const result = await query(`
    UPDATE justificativos
    SET
      estado = $2,
      observacion = $3
    WHERE id = $1
    RETURNING *
  `, [
    justificativoId,
    estado,
    observacion
  ]);

  return result.rows[0] || null;
};


/**
 * Retiros agrupados por año calendario.
 * Permite construir el gráfico histórico de retiros.
 */
export const obtenerRetirosPorAnioDirectorModel = async (anio = 2026) => {
  const result = await query(`
    SELECT
      EXTRACT(YEAR FROM fecha_retiro)::INTEGER AS anio,
      COUNT(*)::INTEGER AS total
    FROM retiros_estudiante
    WHERE fecha_retiro >= make_date($1 - 4, 1, 1)
      AND fecha_retiro < make_date($1 + 1, 1, 1)
    GROUP BY EXTRACT(YEAR FROM fecha_retiro)
    ORDER BY anio
  `, [anio]);

  return result.rows.map((row) => ({
    anio: Number(row.anio),
    total: Number(row.total || 0)
  }));
};

/**
 * Atrasos por día para el año escolar seleccionado.
 */
export const obtenerAtrasosPorDiaDirectorModel = async (anio = 2026) => {
  const result = await query(`
    SELECT
      r.fecha::DATE AS fecha,
      COUNT(*)::INTEGER AS total
    FROM retrasos r
    INNER JOIN cursos c
      ON c.id = r.curso_id
    WHERE c.anio = $1
    GROUP BY r.fecha::DATE
    ORDER BY r.fecha::DATE
  `, [anio]);

  return result.rows.map((row) => ({
    fecha: row.fecha,
    total: Number(row.total || 0)
  }));
};

/**
 * Seguimiento académico orientativo por alumno y matrícula.
 * No determina oficialmente la promoción o repitencia.
 */
export const obtenerRiesgoAcademicoDirectorModel = async (anio = 2026) => {
  const result = await query(`
    WITH notas_alumno AS (
      SELECT
        n.alumno_id,
        n.curso_id,
        n.anio,
        ROUND(AVG(n.nota), 2) AS promedio,
        COUNT(n.id)::INTEGER AS cantidad_notas
      FROM notas n
      WHERE n.anio = $1
        AND n.nota IS NOT NULL
      GROUP BY n.alumno_id, n.curso_id, n.anio
    ),
    asistencia_alumno AS (
      SELECT
        asi.alumno_id,
        asi.curso_id,
        COUNT(*)::INTEGER AS total_registros,
        COUNT(*) FILTER (
          WHERE UPPER(TRIM(asi.estado))
            IN ('PRESENTE', 'ASISTIO', 'P')
        )::INTEGER AS presentes,
        COUNT(*) FILTER (
          WHERE UPPER(TRIM(asi.estado))
            IN ('AUSENTE', 'INASISTENTE', 'A')
        )::INTEGER AS ausentes
      FROM asistencia asi
      INNER JOIN cursos c
        ON c.id = asi.curso_id
      WHERE c.anio = $1
      GROUP BY asi.alumno_id, asi.curso_id
    ),
    datos AS (
      SELECT
        a.id AS alumno_id,
        a.rut,
        a.nombres,
        a.apellido_paterno,
        a.apellido_materno,
        m.id AS matricula_id,
        m.estado AS matricula_estado,
        m.ha_repetido,
        c.id AS curso_id,
        c.nombre AS curso,
        na.promedio,
        COALESCE(na.cantidad_notas, 0)::INTEGER AS cantidad_notas,
        COALESCE(aa.total_registros, 0)::INTEGER AS total_asistencia,
        COALESCE(aa.presentes, 0)::INTEGER AS presentes,
        COALESCE(aa.ausentes, 0)::INTEGER AS ausentes,
        CASE
          WHEN COALESCE(aa.total_registros, 0) > 0
          THEN ROUND(
            aa.presentes::NUMERIC * 100 / aa.total_registros,
            2
          )
          ELSE NULL
        END AS porcentaje_asistencia
      FROM matriculas m
      INNER JOIN alumnos a
        ON a.id = m.alumno_id
      INNER JOIN cursos c
        ON c.id = m.curso_id
      LEFT JOIN notas_alumno na
        ON na.alumno_id = a.id
        AND na.curso_id = c.id
        AND na.anio = m.anio
      LEFT JOIN asistencia_alumno aa
        ON aa.alumno_id = a.id
        AND aa.curso_id = c.id
      WHERE m.anio = $1
        AND UPPER(TRIM(COALESCE(m.estado, ''))) = 'ACTIVA'
    )
    SELECT
      *,
      CASE
        WHEN promedio IS NULL AND porcentaje_asistencia IS NULL
          THEN 'SIN DATOS'
        WHEN promedio < 4.0
          OR porcentaje_asistencia < 80
          THEN 'RIESGO ALTO'
        WHEN promedio < 4.5
          OR porcentaje_asistencia < 85
          THEN 'RIESGO'
        WHEN promedio < 5.0
          OR porcentaje_asistencia < 90
          THEN 'ATENCION'
        ELSE 'SIN ALERTA'
      END AS nivel_alerta
    FROM datos
    ORDER BY apellido_paterno, apellido_materno, nombres
  `, [anio]);

  return result.rows.map((row) => ({
    ...row,
    promedio: row.promedio === null ? null : Number(row.promedio),
    porcentaje_asistencia:
      row.porcentaje_asistencia === null
        ? null
        : Number(row.porcentaje_asistencia),
    cantidad_notas: Number(row.cantidad_notas || 0),
    total_asistencia: Number(row.total_asistencia || 0),
    presentes: Number(row.presentes || 0),
    ausentes: Number(row.ausentes || 0)
  }));
};


export const obtenerMatriculasAnioDirectorModel = async (anio = 2027) => {
  const result = await query(`
    SELECT
      UPPER(TRIM(COALESCE(estado, 'SIN ESTADO'))) AS estado,
      COUNT(*)::INTEGER AS total
    FROM matriculas
    WHERE anio = $1
    GROUP BY UPPER(TRIM(COALESCE(estado, 'SIN ESTADO')))
    ORDER BY estado
  `, [anio]);

  const estados = result.rows.map((row) => ({
    estado: row.estado,
    total: Number(row.total || 0)
  }));

  return {
    anio,
    total_registradas: estados.reduce((suma, item) => suma + item.total, 0),
    por_estado: estados,
    confirmadas: null,
    mensaje:
      'La base de datos no tiene un campo específico para confirmar matrículas.'
  };
};