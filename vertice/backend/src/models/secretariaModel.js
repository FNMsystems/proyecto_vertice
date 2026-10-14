import pool, { query } from "../config/db.js";

export const obtenerCursosModel = async () => {
  const { rows } = await query(`
    SELECT id, nombre
    FROM cursos
    ORDER BY nombre ASC
  `);

  return rows;
};

export const obtenerAlumnosPorCursoModel = async (cursoId) => {
  const { rows } = await query(
    `
      SELECT DISTINCT
        a.id,
        a.rut,
        a.nombres,
        a.apellido_paterno,
        a.apellido_materno
      FROM alumnos a
      INNER JOIN matriculas m
        ON m.alumno_id = a.id
      WHERE m.curso_id = $1::uuid
      ORDER BY
        a.apellido_paterno ASC,
        a.apellido_materno ASC NULLS FIRST,
        a.nombres ASC
    `,
    [cursoId]
  );

  return rows;
};

export const registrarAtrasoModel = async (datos) => {
  const {
    alumno_id,
    curso_id,
    fecha,
    hora_llegada,
    motivo,
    observacion,
    registrado_por,
  } = datos;

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
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      alumno_id,
      curso_id,
      fecha || new Date().toISOString().slice(0, 10),
      hora_llegada || null,
      motivo || null,
      observacion || null,
      registrado_por || null,
    ]
  );

  return rows[0];
};

export const obtenerRetiroPorIdModel = async (id) => {
  const { rows } = await query(
    `
      SELECT
        r.id,
        r.fecha_retiro,
        r.motivo,
        r.observacion,
        r.creado_en,
        r.alumno_id,
        r.curso_id,
        a.nombres AS alumno_nombres,
        a.apellido_paterno AS alumno_paterno,
        a.apellido_materno AS alumno_materno,
        a.rut AS alumno_rut,
        c.nombre AS curso_nombre,
        pa.nombre_completo AS retira_nombre,
        pa.parentesco AS retira_parentesco,
        pa.rut AS retira_rut,
        apo.nombre_completo AS apoderado_titular_nombre,
        apo.rut AS apoderado_titular_rut
      FROM retiros_estudiante r
      LEFT JOIN alumnos a
        ON a.id = r.alumno_id
      LEFT JOIN cursos c
        ON c.id = r.curso_id
      LEFT JOIN LATERAL (
        SELECT s.persona_autorizada_id
        FROM solicitudes_retiro_qr s
        WHERE s.alumno_id = r.alumno_id
        ORDER BY s.creado_en DESC NULLS LAST
        LIMIT 1
      ) solicitud ON TRUE
      LEFT JOIN personas_autorizadas_retiro pa
        ON pa.id = solicitud.persona_autorizada_id
      LEFT JOIN LATERAL (
        SELECT aa.apoderado_id
        FROM alumno_apoderado aa
        WHERE aa.alumno_id = r.alumno_id
        ORDER BY aa.es_apoderado_principal DESC NULLS LAST
        LIMIT 1
      ) relacion ON TRUE
      LEFT JOIN apoderados apo
        ON apo.id = relacion.apoderado_id
      WHERE r.id = $1::uuid
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
};

export const obtenerRetirosModel = async () => {
  const { rows } = await query(`
    SELECT
      r.id,
      r.fecha_retiro,
      r.motivo,
      r.observacion,
      r.creado_en,
      a.nombres AS alumno_nombres,
      a.apellido_paterno AS alumno_paterno,
      a.apellido_materno AS alumno_materno,
      a.rut AS alumno_rut,
      c.nombre AS curso_nombre
    FROM retiros_estudiante r
    LEFT JOIN alumnos a
      ON a.id = r.alumno_id
    LEFT JOIN cursos c
      ON c.id = r.curso_id
    ORDER BY r.creado_en DESC
  `);

  return rows;
};

export const obtenerEstudiantesSecretariaModel = async () => {
  const { rows } = await query(`
    SELECT
      a.id,
      a.rut AS rut_alumno,
      TRIM(
        CONCAT(
          a.nombres,
          ' ',
          a.apellido_paterno,
          ' ',
          COALESCE(a.apellido_materno, '')
        )
      ) AS nombre_alumno,
      a.direccion,
      COALESCE(c.nombre, 'Por Asignar') AS curso_nombre,
      m.estado AS estado_matricula,
      ap.rut AS rut_apoderado,
      ap.nombre_completo AS apoderado_nombre,
      ap.telefono AS apoderado_telefono
    FROM alumnos a
    LEFT JOIN LATERAL (
      SELECT
        m1.curso_id,
        m1.estado,
        m1.anio
      FROM matriculas m1
      WHERE m1.alumno_id = a.id
      ORDER BY
        m1.anio DESC NULLS LAST,
        m1.creado_en DESC NULLS LAST
      LIMIT 1
    ) m ON TRUE
    LEFT JOIN cursos c
      ON c.id = m.curso_id
    LEFT JOIN LATERAL (
      SELECT aa.apoderado_id
      FROM alumno_apoderado aa
      WHERE aa.alumno_id = a.id
      ORDER BY aa.es_apoderado_principal DESC NULLS LAST
      LIMIT 1
    ) aa ON TRUE
    LEFT JOIN apoderados ap
      ON ap.id = aa.apoderado_id
    ORDER BY
      a.apellido_paterno ASC,
      a.apellido_materno ASC NULLS FIRST,
      a.nombres ASC
  `);

  return rows;
};

export const obtenerJustificativosModel = async () => {
  const [justificativosRes, alumnosRes] = await Promise.all([
    query(`
      SELECT *
      FROM justificativos
      ORDER BY id DESC
      LIMIT 50
    `),
    query(`
      SELECT
        id,
        TRIM(
          CONCAT(
            nombres,
            ' ',
            apellido_paterno,
            ' ',
            COALESCE(apellido_materno, '')
          )
        ) AS nombre_completo
      FROM alumnos
    `),
  ]);

  const alumnosMap = new Map(
    alumnosRes.rows.map((alumno) => [
      String(alumno.id),
      alumno.nombre_completo,
    ])
  );

  return justificativosRes.rows.map((item) => {
    const alumnoId =
      item.alumno_id ??
      item.estudiante_id ??
      item.id_alumno ??
      item.usuario_id;

    return {
      ...item,
      estudiante:
        alumnosMap.get(String(alumnoId)) ||
        item.estudiante ||
        item.nombre_estudiante ||
        "Estudiante",
    };
  });
};

export const cambiarEstadoJustificativoModel = async (id, estado) => {
  const { rows } = await query(
    `
      UPDATE justificativos
      SET estado = $1
      WHERE id = $2
      RETURNING *
    `,
    [estado, id]
  );

  return rows[0] || null;
};

export const registrarMatriculaModel = async (datos) => {
  const {
    es_nuevo,
    alumno_id,
    nuevo_nombres,
    nuevo_apellido_paterno,
    nuevo_apellido_materno,
    nuevo_rut,
    curso_id,
    anio,
  } = datos;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let alumnoIdFinal = alumno_id || null;

    const esAlumnoNuevo =
      es_nuevo === true ||
      es_nuevo === "true" ||
      es_nuevo === 1;

    if (esAlumnoNuevo) {
      if (
        !nuevo_nombres?.trim() ||
        !nuevo_apellido_paterno?.trim() ||
        !nuevo_rut?.trim()
      ) {
        const error = new Error(
          "Para un alumno nuevo, nombres, apellido paterno y RUT son obligatorios."
        );
        error.status = 400;
        throw error;
      }

      const alumnoRes = await client.query(
        `
          INSERT INTO alumnos (
            nombres,
            apellido_paterno,
            apellido_materno,
            rut
          )
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
        [
          nuevo_nombres.trim(),
          nuevo_apellido_paterno.trim(),
          nuevo_apellido_materno?.trim() || null,
          nuevo_rut.trim(),
        ]
      );

      alumnoIdFinal = alumnoRes.rows[0].id;
    }

    if (!alumnoIdFinal || !curso_id) {
      const error = new Error(
        "El alumno y el curso son obligatorios para matricular."
      );
      error.status = 400;
      throw error;
    }

    const anioMatricula = Number(anio) || 2027;

    if (
      !Number.isInteger(anioMatricula) ||
      anioMatricula < 2000 ||
      anioMatricula > 2100
    ) {
      const error = new Error("El año de matrícula no es válido.");
      error.status = 400;
      throw error;
    }

    const duplicada = await client.query(
      `
        SELECT id
        FROM matriculas
        WHERE alumno_id = $1::uuid
          AND curso_id = $2::uuid
          AND anio = $3
        LIMIT 1
      `,
      [alumnoIdFinal, curso_id, anioMatricula]
    );

    if (duplicada.rows.length > 0) {
      const error = new Error(
        "El alumno ya tiene una matrícula registrada en ese curso y año."
      );
      error.status = 409;
      throw error;
    }

    const matriculaRes = await client.query(
      `
        INSERT INTO matriculas (
          alumno_id,
          curso_id,
          anio,
          creado_en
        )
        VALUES ($1::uuid, $2::uuid, $3, NOW())
        RETURNING id, alumno_id, curso_id, anio
      `,
      [alumnoIdFinal, curso_id, anioMatricula]
    );

    await client.query("COMMIT");

    return matriculaRes.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};