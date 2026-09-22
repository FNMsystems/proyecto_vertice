import { query } from "../config/db.js";

export const obtenerAnotacionesCurso = async (req, res) => {
  try {
    const docenteId = req.usuario.id;
    const { cursoId } = req.params;

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
          an.id,
          an.alumno_id,
          an.docente_id,
          an.curso_id,
          an.tipo,
          an.titulo,
          an.descripcion,
          an.fecha,
          an.creado_en,

          al.nombres,
          al.apellido_paterno,
          al.apellido_materno,

          d.nombres AS docente_nombres,
          d.apellido_paterno AS docente_apellido_paterno

        FROM anotaciones an

        INNER JOIN alumnos al
          ON al.id = an.alumno_id

        LEFT JOIN docentes d
          ON d.id = an.docente_id

        WHERE an.curso_id = $1

        ORDER BY
          an.fecha DESC,
          an.creado_en DESC;
      `,
      [cursoId]
    );

    return res.json({
      anotaciones: result.rows.map((anotacion) => ({
        id: anotacion.id,
        alumnoId: anotacion.alumno_id,
        docenteId: anotacion.docente_id,
        cursoId: anotacion.curso_id,
        tipo: anotacion.tipo,
        titulo: anotacion.titulo,
        descripcion: anotacion.descripcion,
        fecha: anotacion.fecha,
        creadoEn: anotacion.creado_en,

        alumno: [
          anotacion.nombres,
          anotacion.apellido_paterno,
          anotacion.apellido_materno
        ]
          .filter(Boolean)
          .join(" "),

        docente: [
          anotacion.docente_nombres,
          anotacion.docente_apellido_paterno
        ]
          .filter(Boolean)
          .join(" ") || null
      }))
    });

  } catch (error) {
    console.error(
      "Error obteniendo anotaciones:",
      error
    );

    return res.status(500).json({
      error: "Error al obtener las anotaciones."
    });
  }
};

export const crearAnotacion = async (req, res) => {
  try {
    const docenteId = req.usuario.id;

    const {
      alumnoId,
      cursoId,
      tipo,
      titulo,
      descripcion,
      fecha
    } = req.body;

    if (
      !alumnoId ||
      !cursoId ||
      !descripcion
    ) {
      return res.status(400).json({
        error:
          "Debe indicar alumno, curso y descripción."
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
        INSERT INTO anotaciones (
          alumno_id,
          docente_id,
          curso_id,
          tipo,
          titulo,
          descripcion,
          fecha
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
        RETURNING *;
      `,
      [
        alumnoId,
        docenteId,
        cursoId,
        tipo || "OBSERVACION",
        titulo || null,
        descripcion,
        fecha || null
      ]
    );

    return res.status(201).json({
      mensaje: "Anotación registrada correctamente.",
      anotacion: result.rows[0]
    });

  } catch (error) {
    console.error(
      "Error creando anotación:",
      error
    );

    return res.status(500).json({
      error: "Error al registrar la anotación."
    });
  }
};

export const eliminarAnotacion = async (req, res) => {
  try {
    const docenteId = req.usuario.id;
    const { anotacionId } = req.params;

    const result = await query(
      `
        DELETE FROM anotaciones
        WHERE id = $1
          AND docente_id = $2
        RETURNING id;
      `,
      [anotacionId, docenteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error:
          "No se encontró la anotación o no tienes permiso para eliminarla."
      });
    }

    return res.json({
      mensaje: "Anotación eliminada correctamente."
    });

  } catch (error) {
    console.error(
      "Error eliminando anotación:",
      error
    );

    return res.status(500).json({
      error: "Error al eliminar la anotación."
    });
  }
};