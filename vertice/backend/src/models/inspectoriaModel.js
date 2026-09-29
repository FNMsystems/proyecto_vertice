import pool from '../config/db.js';

export const generarSolicitudRetiroQRModel = async (
  alumnoId,
  rutApoderado,
  personaAutorizadaId,
  motivo,
  observacion
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const autorizadoResult = await client.query(
      `
        SELECT
          p.id,
          p.alumno_id,
          p.nombre_completo,
          p.rut,
          p.parentesco,
          p.telefono,
          p.numero_autorizacion,
          p.activo
        FROM personas_autorizadas_retiro p
        INNER JOIN alumno_apoderado aa
          ON aa.alumno_id = p.alumno_id
        INNER JOIN apoderados ap
          ON ap.id = aa.apoderado_id
        WHERE p.id = $1
          AND p.alumno_id = $2
          AND p.activo = TRUE
          AND REPLACE(
                REPLACE(
                  UPPER(TRIM(ap.rut)),
                  '.',
                  ''
                ),
                '-',
                ''
              ) =
              REPLACE(
                REPLACE(
                  UPPER(TRIM($3)),
                  '.',
                  ''
                ),
                '-',
                ''
              )
        LIMIT 1
        FOR UPDATE
      `,
      [
        personaAutorizadaId,
        alumnoId,
        rutApoderado
      ]
    );

    if (autorizadoResult.rows.length === 0) {
      throw new Error(
        'La persona seleccionada no está autorizada para retirar a este alumno o no está asociada al apoderado.'
      );
    }

    const personaAutorizada = autorizadoResult.rows[0];

    const alumnoResult = await client.query(
      `
        SELECT
          a.id,
          a.rut,
          CONCAT(
            a.nombres,
            ' ',
            a.apellido_paterno,
            CASE
              WHEN a.apellido_materno IS NOT NULL
                AND TRIM(a.apellido_materno) <> ''
              THEN ' ' || a.apellido_materno
              ELSE ''
            END
          ) AS nombre
        FROM alumnos a
        WHERE a.id = $1
        LIMIT 1
      `,
      [alumnoId]
    );

    if (alumnoResult.rows.length === 0) {
      throw new Error('El alumno no existe.');
    }

    const alumno = alumnoResult.rows[0];

    const cursoResult = await client.query(
      `
        SELECT
          m.curso_id,
          c.nombre AS curso_nombre
        FROM matriculas m
        INNER JOIN cursos c
          ON c.id = m.curso_id
        WHERE m.alumno_id = $1
          AND m.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
          AND m.estado = 'ACTIVA'
        LIMIT 1
      `,
      [alumnoId]
    );

    if (cursoResult.rows.length === 0) {
      throw new Error(
        'El alumno no tiene una matrícula activa para el año actual.'
      );
    }

    const curso = cursoResult.rows[0];

    await client.query(
      `
        UPDATE solicitudes_retiro_qr
        SET estado = 'EXPIRADO'
        WHERE alumno_id = $1
          AND persona_autorizada_id = $2
          AND estado = 'PENDIENTE'
          AND fecha_expiracion <= NOW()
      `,
      [
        alumnoId,
        personaAutorizada.id
      ]
    );

    const pendienteResult = await client.query(
      `
        SELECT
          id
        FROM solicitudes_retiro_qr
        WHERE alumno_id = $1
          AND persona_autorizada_id = $2
          AND estado = 'PENDIENTE'
        LIMIT 1
      `,
      [
        alumnoId,
        personaAutorizada.id
      ]
    );

    if (pendienteResult.rows.length > 0) {
      throw new Error(
        'Ya existe un código QR pendiente para este alumno.'
      );
    }

    const solicitudResult = await client.query(
      `
        INSERT INTO solicitudes_retiro_qr (
          alumno_id,
          persona_autorizada_id,
          curso_id,
          motivo,
          observacion,
          estado,
          fecha_generacion,
          fecha_expiracion
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'PENDIENTE',
          NOW(),
          NOW() + INTERVAL '15 minutes'
        )
        RETURNING
          id,
          codigo_qr,
          alumno_id,
          persona_autorizada_id,
          curso_id,
          motivo,
          observacion,
          estado,
          fecha_generacion,
          fecha_expiracion
      `,
      [
        alumnoId,
        personaAutorizada.id,
        curso.curso_id,
        motivo,
        observacion || null
      ]
    );

    await client.query('COMMIT');

    return {
      solicitud: solicitudResult.rows[0],
      alumno,
      curso,
      personaAutorizada
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const validarRetiroQRModel = async (
  codigoQR
) => {
  const query = `
    SELECT
      s.id,
      s.codigo_qr,
      s.estado,
      s.motivo,
      s.observacion,
      s.fecha_generacion,
      s.fecha_expiracion,
      s.fecha_uso,

      a.id AS alumno_id,
      a.rut AS alumno_rut,

      CONCAT(
        a.nombres,
        ' ',
        a.apellido_paterno,
        CASE
          WHEN a.apellido_materno IS NOT NULL
            AND TRIM(a.apellido_materno) <> ''
          THEN ' ' || a.apellido_materno
          ELSE ''
        END
      ) AS alumno_nombre,

      c.id AS curso_id,
      c.nombre AS curso_nombre,

      p.id AS persona_autorizada_id,
      p.nombre_completo AS persona_nombre,
      p.rut AS persona_rut,
      p.parentesco AS persona_parentesco,
      p.telefono AS persona_telefono,
      p.numero_autorizacion

    FROM solicitudes_retiro_qr s

    INNER JOIN alumnos a
      ON a.id = s.alumno_id

    INNER JOIN cursos c
      ON c.id = s.curso_id

    INNER JOIN personas_autorizadas_retiro p
      ON p.id = s.persona_autorizada_id

    WHERE s.codigo_qr = $1
    LIMIT 1
  `;

  const result = await pool.query(
    query,
    [codigoQR]
  );

  return result.rows[0] || null;
};

export const confirmarRetiroModel = async (
  solicitudId,
  alumnoId,
  cursoId,
  motivo,
  observacion
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const solicitudResult = await client.query(
      `
        SELECT
          id,
          alumno_id,
          curso_id,
          estado,
          fecha_expiracion
        FROM solicitudes_retiro_qr
        WHERE id = $1
        FOR UPDATE
      `,
      [solicitudId]
    );

    if (solicitudResult.rows.length === 0) {
      throw new Error(
        'La solicitud de retiro no existe.'
      );
    }

    const solicitud =
      solicitudResult.rows[0];

    if (solicitud.estado !== 'PENDIENTE') {
      throw new Error(
        'Esta solicitud de retiro ya fue procesada.'
      );
    }

    if (
      new Date(solicitud.fecha_expiracion) <=
      new Date()
    ) {
      await client.query(
        `
          UPDATE solicitudes_retiro_qr
          SET estado = 'EXPIRADO'
          WHERE id = $1
        `,
        [solicitudId]
      );

      throw new Error(
        'El código QR está expirado.'
      );
    }

    if (
      solicitud.alumno_id !== alumnoId ||
      solicitud.curso_id !== cursoId
    ) {
      throw new Error(
        'Los datos del retiro no coinciden.'
      );
    }

    const retiroResult = await client.query(
      `
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
          CURRENT_DATE,
          $3,
          $4
        )
        RETURNING *
      `,
      [
        alumnoId,
        cursoId,
        motivo,
        observacion || null
      ]
    );

    const updateQR = await client.query(
      `
        UPDATE solicitudes_retiro_qr
        SET
          estado = 'UTILIZADO',
          fecha_uso = NOW()
        WHERE id = $1
          AND estado = 'PENDIENTE'
          AND fecha_expiracion > NOW()
        RETURNING *
      `,
      [solicitudId]
    );

    if (updateQR.rows.length === 0) {
      throw new Error(
        'El código QR ya fue utilizado o expiró.'
      );
    }

    await client.query('COMMIT');

    return retiroResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};