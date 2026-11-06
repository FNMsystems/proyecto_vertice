import pool, { query } from "../config/db.js";

const verificarAsignacion = async (docenteId, cursoId, asignaturaId) => {
  const result = await query(
    `
      SELECT 1
      FROM docente_curso dc
      INNER JOIN cursos c
        ON c.id = dc.curso_id
      INNER JOIN asignaturas a
        ON a.id = dc.asignatura_id
      WHERE dc.docente_id = $1
        AND dc.curso_id = $2
        AND dc.asignatura_id = $3
        AND dc.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        AND c.activo = TRUE
        AND a.activo = TRUE
      LIMIT 1;
    `,
    [docenteId, cursoId, asignaturaId],
  );

  return result.rows.length > 0;
};

export const obtenerNotasCurso = async (req, res) => {
  try {
    const docenteId = req.usuario.id;
    const { cursoId } = req.params;
    const { asignaturaId } = req.query;

    if (!cursoId) {
      return res.status(400).json({
        error: "Debe indicar el curso.",
      });
    }

    const cursoResult = await query(
      `
        SELECT 1
        FROM docente_curso dc
        INNER JOIN cursos c
          ON c.id = dc.curso_id
        WHERE dc.docente_id = $1
          AND dc.curso_id = $2
          AND dc.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
          AND c.activo = TRUE
        LIMIT 1;
      `,
      [docenteId, cursoId],
    );

    if (cursoResult.rows.length === 0) {
      return res.status(403).json({
        error: "No tienes asignado este curso.",
      });
    }

    let sql = `
      SELECT
        n.id,
        n.alumno_id,
        n.curso_id,
        n.asignatura_id,
        n.docente_id,
        n.periodo,
        n.tipo_evaluacion,
        n.nota,
        n.porcentaje,
        n.fecha,
        n.observacion,
        n.anio,

        al.nombres,
        al.apellido_paterno,
        al.apellido_materno,

        a.nombre AS asignatura_nombre,
        a.codigo AS asignatura_codigo

      FROM notas n

      INNER JOIN alumnos al
        ON al.id = n.alumno_id

      INNER JOIN asignaturas a
        ON a.id = n.asignatura_id

      WHERE n.curso_id = $1
        AND n.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    `;

    const params = [cursoId];

    if (asignaturaId) {
      sql += `
        AND n.asignatura_id = $2
      `;

      params.push(asignaturaId);
    }

    sql += `
      ORDER BY
        al.apellido_paterno,
        al.apellido_materno,
        al.nombres,
        n.fecha DESC NULLS LAST,
        n.id;
    `;

    const result = await query(sql, params);

    return res.json({
      notas: result.rows.map((nota) => ({
        id: nota.id,
        alumnoId: nota.alumno_id,
        cursoId: nota.curso_id,
        asignaturaId: nota.asignatura_id,
        docenteId: nota.docente_id,
        periodo: nota.periodo,
        tipoEvaluacion: nota.tipo_evaluacion,
        nota: nota.nota,
        porcentaje: nota.porcentaje,
        fecha: nota.fecha,
        observacion: nota.observacion,
        anio: nota.anio,

        alumno: [nota.nombres, nota.apellido_paterno, nota.apellido_materno]
          .filter(Boolean)
          .join(" "),

        asignatura: nota.asignatura_nombre,
        codigoAsignatura: nota.asignatura_codigo,
      })),
    });
  } catch (error) {
    console.error("Error obteniendo notas:", error);

    return res.status(500).json({
      error: "Error al obtener las notas.",
    });
  }
};

export const crearNota = async (req, res) => {
  try {
    const docenteId = req.usuario.id;

    const {
      alumnoId,
      cursoId,
      asignaturaId,
      periodo,
      tipoEvaluacion,
      nota,
      porcentaje,
      fecha,
      observacion,
    } = req.body;

    if (
      !alumnoId ||
      !cursoId ||
      !asignaturaId ||
      nota === undefined ||
      nota === null
    ) {
      return res.status(400).json({
        error: "Debe indicar alumno, curso, asignatura y nota.",
      });
    }

    const notaNumerica = Number(nota);

    if (Number.isNaN(notaNumerica) || notaNumerica < 1 || notaNumerica > 7) {
      return res.status(400).json({
        error: "La nota debe estar entre 1.0 y 7.0.",
      });
    }

    if (
      porcentaje !== undefined &&
      porcentaje !== null &&
      (Number.isNaN(Number(porcentaje)) ||
        Number(porcentaje) < 0 ||
        Number(porcentaje) > 100)
    ) {
      return res.status(400).json({
        error: "El porcentaje debe estar entre 0 y 100.",
      });
    }

    const tieneAsignacion = await verificarAsignacion(
      docenteId,
      cursoId,
      asignaturaId,
    );

    if (!tieneAsignacion) {
      return res.status(403).json({
        error: "No tienes asignada esta asignatura en este curso.",
      });
    }

    const alumnoResult = await query(
      `
        SELECT 1
        FROM matriculas
        WHERE alumno_id = $1
          AND curso_id = $2
          AND anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        LIMIT 1;
      `,
      [alumnoId, cursoId],
    );

    if (alumnoResult.rows.length === 0) {
      return res.status(400).json({
        error: "El alumno no pertenece a este curso.",
      });
    }

    const result = await query(
      `
        INSERT INTO notas (
          alumno_id,
          curso_id,
          asignatura_id,
          docente_id,
          periodo,
          tipo_evaluacion,
          nota,
          porcentaje,
          fecha,
          observacion,
          anio
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        )
        RETURNING *;
      `,
      [
        alumnoId,
        cursoId,
        asignaturaId,
        docenteId,
        periodo || null,
        tipoEvaluacion || null,
        notaNumerica,
        porcentaje ?? null,
        fecha || null,
        observacion || null,
      ],
    );

    return res.status(201).json({
      mensaje: "Nota registrada correctamente.",
      nota: result.rows[0],
    });
  } catch (error) {
    console.error("Error creando nota:", error);

    return res.status(500).json({
      error: "Error al registrar la nota.",
    });
  }
};

export const eliminarNota = async (req, res) => {
  try {
    const docenteId = req.usuario.id;
    const { notaId } = req.params;

    const result = await query(
      `
        DELETE FROM notas
        WHERE id = $1
          AND docente_id = $2
        RETURNING id;
      `,
      [notaId, docenteId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "No se encontró la nota o no tienes permiso para eliminarla.",
      });
    }

    return res.json({
      mensaje: "Nota eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error eliminando nota:", error);

    return res.status(500).json({
      error: "Error al eliminar la nota.",
    });
  }
};

export const guardarNotasMasivas = async (req, res) => {
  const client = await pool.connect();

  try {
    const docenteId = req.usuario?.id;

    const {
      cursoId,
      asignaturaId,
      periodo,
      tipoEvaluacion,
      porcentaje,
      fecha,
      observacion,
      alumnos,
    } = req.body;

    if (!docenteId) {
      return res.status(401).json({
        mensaje: "No se pudo identificar al docente.",
      });
    }

    if (!cursoId || !asignaturaId) {
      return res.status(400).json({
        mensaje: "Debes indicar el curso y la asignatura.",
      });
    }

    if (!["1", "2"].includes(String(periodo))) {
      return res.status(400).json({
        mensaje: "El período debe ser 1 o 2.",
      });
    }

    if (
      !tipoEvaluacion ||
      typeof tipoEvaluacion !== "string" ||
      tipoEvaluacion.trim().length === 0 ||
      tipoEvaluacion.trim().length > 100
    ) {
      return res.status(400).json({
        mensaje:
          "El nombre de la evaluación es obligatorio y no puede superar los 100 caracteres.",
      });
    }

    const porcentajeNumero = Number(porcentaje);

    if (
      !Number.isFinite(porcentajeNumero) ||
      porcentajeNumero <= 0 ||
      porcentajeNumero > 100
    ) {
      return res.status(400).json({
        mensaje: "La ponderación debe ser mayor que 0 y menor o igual a 100.",
      });
    }

    if (!Array.isArray(alumnos) || alumnos.length === 0) {
      return res.status(400).json({
        mensaje: "Debes enviar los alumnos de la evaluación.",
      });
    }

    if (!fecha) {
      return res.status(400).json({
        mensaje: "Debes indicar la fecha de la evaluación.",
      });
    }

    const idsAlumnos = alumnos.map((a) => a.alumnoId);

    if (
      idsAlumnos.some((id) => !id) ||
      new Set(idsAlumnos).size !== idsAlumnos.length
    ) {
      return res.status(400).json({
        mensaje: "La lista contiene alumnos inválidos o repetidos.",
      });
    }

    for (const alumno of alumnos) {
      if (
        alumno.nota !== null &&
        alumno.nota !== undefined &&
        alumno.nota !== ""
      ) {
        const notaNumero = Number(alumno.nota);

        if (!Number.isFinite(notaNumero) || notaNumero < 1 || notaNumero > 7) {
          return res.status(400).json({
            mensaje: `La nota del alumno ${alumno.alumnoId} debe estar entre 1,0 y 7,0.`,
          });
        }
      }
    }

    await client.query("BEGIN");

    const cursoResult = await client.query(
      `
            SELECT id, anio, activo
            FROM cursos
            WHERE id = $1
            LIMIT 1
            `,
      [cursoId],
    );

    if (cursoResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        mensaje: "El curso indicado no existe.",
      });
    }

    const curso = cursoResult.rows[0];
    const anio = Number(curso.anio);

    if (!curso.activo) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        mensaje: "No se pueden registrar notas en un curso inactivo.",
      });
    }

    const asignacionResult = await client.query(
      `
            SELECT 1
            FROM docente_curso dc
            WHERE dc.docente_id = $1
              AND dc.curso_id = $2
              AND dc.asignatura_id = $3
              AND dc.anio = $4
            LIMIT 1
            `,
      [docenteId, cursoId, asignaturaId, anio],
    );

    if (asignacionResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        mensaje: "No tienes asignada esta asignatura en este curso.",
      });
    }

    const matriculasResult = await client.query(
      `
    SELECT m.alumno_id
    FROM matriculas m
    WHERE m.curso_id = $1
      AND m.anio = $2
      AND m.estado = 'ACTIVA'
      AND m.alumno_id = ANY($3::uuid[])
    `,
      [cursoId, anio, idsAlumnos],
    );

    const alumnosMatriculados = new Set(
      matriculasResult.rows.map((row) => String(row.alumno_id)),
    );

    const alumnosActivos = alumnos.filter((alumno) =>
      alumnosMatriculados.has(String(alumno.alumnoId)),
    );

    if (alumnosActivos.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        mensaje: "No hay alumnos con matrícula activa en este curso y año.",
      });
    }

    await client.query(
      `
            SELECT pg_advisory_xact_lock(
                hashtext($1)
            )
            `,
      [`${cursoId}-${asignaturaId}-${periodo}-${anio}`],
    );

    const evaluacionesResult = await client.query(
      `
            SELECT DISTINCT
                periodo,
                tipo_evaluacion,
                porcentaje,
                fecha
            FROM notas
            WHERE curso_id = $1
              AND asignatura_id = $2
              AND anio = $3
              AND periodo = $4
            `,
      [cursoId, asignaturaId, anio, String(periodo)],
    );

    const mismaEvaluacion = (evaluacion) => {
      const mismaFecha =
        evaluacion.fecha === null
          ? fecha === null || fecha === undefined || fecha === ""
          : new Date(evaluacion.fecha).toISOString().slice(0, 10) === fecha;

      return (
        evaluacion.periodo === String(periodo) &&
        evaluacion.tipo_evaluacion === tipoEvaluacion.trim() &&
        Number(evaluacion.porcentaje) === porcentajeNumero &&
        mismaFecha
      );
    };

    const porcentajeAnterior = evaluacionesResult.rows
      .filter((evaluacion) => !mismaEvaluacion(evaluacion))
      .reduce(
        (total, evaluacion) => total + Number(evaluacion.porcentaje || 0),
        0,
      );

    const porcentajeTotal = porcentajeAnterior + porcentajeNumero;

    if (porcentajeTotal > 100.0001) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        mensaje: `La ponderación supera el 100%. Actualmente tienes ${porcentajeAnterior.toFixed(2)}% registrado y estás intentando agregar ${porcentajeNumero.toFixed(2)}%.`,
      });
    }

    let insertadas = 0;
    let actualizadas = 0;
    let pendientes = 0;

    for (const alumno of alumnos) {
      const notaValor =
        alumno.nota === null || alumno.nota === undefined || alumno.nota === ""
          ? null
          : Number(alumno.nota);

      const existenteResult = await client.query(
        `
                SELECT id
                FROM notas
                WHERE alumno_id = $1
                  AND curso_id = $2
                  AND asignatura_id = $3
                  AND anio = $4
                  AND periodo IS NOT DISTINCT FROM $5
                  AND tipo_evaluacion = $6
                  AND porcentaje = $7
                  AND fecha IS NOT DISTINCT FROM $8::date
                ORDER BY creado_en ASC
                LIMIT 1
                FOR UPDATE
                `,
        [
          alumno.alumnoId,
          cursoId,
          asignaturaId,
          anio,
          String(periodo),
          tipoEvaluacion.trim(),
          porcentajeNumero,
          fecha,
        ],
      );

      if (existenteResult.rows.length > 0) {
        await client.query(
          `
                    UPDATE notas
                    SET nota = $1,
                        observacion = $2,
                        docente_id = $3
                    WHERE id = $4
                    `,
          [
            notaValor,
            observacion || null,
            docenteId,
            existenteResult.rows[0].id,
          ],
        );

        actualizadas++;
      } else {
        await client.query(
          `
                    INSERT INTO notas (
                        alumno_id,
                        curso_id,
                        asignatura_id,
                        docente_id,
                        periodo,
                        tipo_evaluacion,
                        nota,
                        porcentaje,
                        fecha,
                        observacion,
                        anio
                    )
                    VALUES (
                        $1, $2, $3, $4, $5,
                        $6, $7, $8, $9, $10, $11
                    )
                    `,
          [
            alumno.alumnoId,
            cursoId,
            asignaturaId,
            docenteId,
            String(periodo),
            tipoEvaluacion.trim(),
            notaValor,
            porcentajeNumero,
            fecha,
            observacion || null,
            anio,
          ],
        );

        insertadas++;
      }

      if (notaValor === null) {
        pendientes++;
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      mensaje: "Evaluación guardada correctamente.",
      resumen: {
        insertadas,
        actualizadas,
        pendientes,
        porcentajeAnterior,
        porcentajeActual: porcentajeNumero,
        porcentajeTotal,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al guardar evaluación masiva:", error);

    return res.status(500).json({
      mensaje: "Ocurrió un error al guardar la evaluación.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};
