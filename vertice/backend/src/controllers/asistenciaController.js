import { query } from "../config/db.js";


const estadosValidos = [
  "PRESENTE",
  "AUSENTE",
  "ATRASADO",
  "JUSTIFICADO"
];


export const obtenerAsistencia = async (req, res) => {
  try {
    const docenteId = req.usuario.id;
    const { cursoId } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        error: "Debe indicar una fecha."
      });
    }

    const accesoResult = await query(
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

    if (accesoResult.rows.length === 0) {
      return res.status(403).json({
        error: "No tienes asignado este curso."
      });
    }

    const result = await query(
      `
        SELECT
          al.id AS alumno_id,
          al.nombres,
          al.apellido_paterno,
          al.apellido_materno,
          al.rut,

          ast.id,
          ast.fecha,
          ast.estado,
          ast.observacion

        FROM matriculas m

        INNER JOIN alumnos al
          ON al.id = m.alumno_id

        LEFT JOIN asistencia ast
          ON ast.alumno_id = al.id
          AND ast.curso_id = m.curso_id
          AND ast.fecha = $2

        WHERE m.curso_id = $1
          AND m.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER

        ORDER BY
          al.apellido_paterno,
          al.apellido_materno,
          al.nombres;
      `,
      [cursoId, fecha]
    );

    return res.json({
      fecha,
      asistencia: result.rows.map((fila) => ({
        id: fila.id,
        alumnoId: fila.alumno_id,
        alumno: [
          fila.nombres,
          fila.apellido_paterno,
          fila.apellido_materno
        ]
          .filter(Boolean)
          .join(" "),
        rut: fila.rut,
        fecha: fila.fecha,
        estado: fila.estado || null,
        observacion: fila.observacion || null
      }))
    });

  } catch (error) {
    console.error(
      "Error obteniendo asistencia:",
      error
    );

    return res.status(500).json({
      error: "Error al obtener la asistencia."
    });
  }
};


export const guardarAsistencia = async (req, res) => {
  try {
    const docenteId = req.usuario.id;

    const {
      alumnoId,
      cursoId,
      fecha,
      estado,
      observacion
    } = req.body;

    if (
      !alumnoId ||
      !cursoId ||
      !fecha ||
      !estado
    ) {
      return res.status(400).json({
        error:
          "Debe indicar alumno, curso, fecha y estado."
      });
    }

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error:
          "Estado de asistencia no válido."
      });
    }

    const accesoResult = await query(
      `
        SELECT 1
        FROM docente_curso
        WHERE docente_id = $1
          AND curso_id = $2
          AND anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        LIMIT 1;
      `,
      [docenteId, cursoId]
    );

    if (accesoResult.rows.length === 0) {
      return res.status(403).json({
        error: "No tienes asignado este curso."
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
        INSERT INTO asistencia (
          alumno_id,
          curso_id,
          docente_id,
          fecha,
          estado,
          observacion
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
        ON CONFLICT (
          alumno_id,
          curso_id,
          fecha
        )
        DO UPDATE SET
          docente_id = EXCLUDED.docente_id,
          estado = EXCLUDED.estado,
          observacion = EXCLUDED.observacion

        RETURNING *;
      `,
      [
        alumnoId,
        cursoId,
        docenteId,
        fecha,
        estado,
        observacion || null
      ]
    );

    return res.json({
      mensaje:
        "Asistencia guardada correctamente.",
      asistencia: result.rows[0]
    });

  } catch (error) {
    console.error(
      "Error guardando asistencia:",
      error
    );

    return res.status(500).json({
      error: "Error al guardar la asistencia."
    });
  }
};