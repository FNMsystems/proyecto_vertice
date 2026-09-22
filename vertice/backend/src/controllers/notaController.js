import { query } from "../config/db.js";

const verificarAsignacion = async (
  docenteId,
  cursoId,
  asignaturaId
) => {
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
    [docenteId, cursoId, asignaturaId]
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
        error: "Debe indicar el curso."
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
      [docenteId, cursoId]
    );

    if (cursoResult.rows.length === 0) {
      return res.status(403).json({
        error: "No tienes asignado este curso."
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

        alumno: [
          nota.nombres,
          nota.apellido_paterno,
          nota.apellido_materno
        ]
          .filter(Boolean)
          .join(" "),

        asignatura: nota.asignatura_nombre,
        codigoAsignatura: nota.asignatura_codigo
      }))
    });

  } catch (error) {
    console.error("Error obteniendo notas:", error);

    return res.status(500).json({
      error: "Error al obtener las notas."
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
      observacion
    } = req.body;

    if (
      !alumnoId ||
      !cursoId ||
      !asignaturaId ||
      nota === undefined ||
      nota === null
    ) {
      return res.status(400).json({
        error:
          "Debe indicar alumno, curso, asignatura y nota."
      });
    }

    const notaNumerica = Number(nota);

    if (
      Number.isNaN(notaNumerica) ||
      notaNumerica < 1 ||
      notaNumerica > 7
    ) {
      return res.status(400).json({
        error: "La nota debe estar entre 1.0 y 7.0."
      });
    }

    if (
      porcentaje !== undefined &&
      porcentaje !== null &&
      (
        Number.isNaN(Number(porcentaje)) ||
        Number(porcentaje) < 0 ||
        Number(porcentaje) > 100
      )
    ) {
      return res.status(400).json({
        error: "El porcentaje debe estar entre 0 y 100."
      });
    }

    const tieneAsignacion = await verificarAsignacion(
      docenteId,
      cursoId,
      asignaturaId
    );

    if (!tieneAsignacion) {
      return res.status(403).json({
        error:
          "No tienes asignada esta asignatura en este curso."
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
      [alumnoId, cursoId]
    );

    if (alumnoResult.rows.length === 0) {
      return res.status(400).json({
        error:
          "El alumno no pertenece a este curso."
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
        observacion || null
      ]
    );

    return res.status(201).json({
      mensaje: "Nota registrada correctamente.",
      nota: result.rows[0]
    });

  } catch (error) {
    console.error("Error creando nota:", error);

    return res.status(500).json({
      error: "Error al registrar la nota."
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
      [notaId, docenteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error:
          "No se encontró la nota o no tienes permiso para eliminarla."
      });
    }

    return res.json({
      mensaje: "Nota eliminada correctamente."
    });

  } catch (error) {
    console.error("Error eliminando nota:", error);

    return res.status(500).json({
      error: "Error al eliminar la nota."
    });
  }
};