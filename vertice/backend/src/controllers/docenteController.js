import { query } from "../config/db.js";

export const getMiDashboard = async (req, res) => {
  try {
    const docenteId = req.usuario.id;

    const docenteResult = await query(
      `
        SELECT
          id,
          rut,
          nombres,
          apellido_paterno,
          apellido_materno,
          correo,
          telefono,
          especialidad,
          activo
        FROM docentes
        WHERE id = $1
          AND activo = TRUE
        LIMIT 1;
      `,
      [docenteId],
    );

    if (docenteResult.rows.length === 0) {
      return res.status(404).json({
        error: "No se encontró el docente.",
      });
    }

    const docente = docenteResult.rows[0];

    const cursosResult = await query(
      `
        SELECT
          c.id AS curso_id,
          c.nombre AS curso_nombre,
          c.codigo_nivel,
          c.jornada,
          c.anio,
          dc.asignatura_id,
          a.codigo AS asignatura_codigo,
          a.nombre AS asignatura_nombre,
          dc.es_profesor_jefe
        FROM docente_curso dc
        INNER JOIN cursos c
          ON c.id = dc.curso_id
        INNER JOIN asignaturas a
          ON a.id = dc.asignatura_id
        WHERE dc.docente_id = $1
          AND dc.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
          AND c.activo = TRUE
          AND a.activo = TRUE
        ORDER BY
          c.nombre,
          a.nombre;
      `,
      [docenteId],
    );

    const cursosMap = new Map();

    for (const fila of cursosResult.rows) {
      if (!cursosMap.has(fila.curso_id)) {
        cursosMap.set(fila.curso_id, {
          id: fila.curso_id,
          nombre: fila.curso_nombre,
          codigoNivel: fila.codigo_nivel,
          jornada: fila.jornada,
          anio: fila.anio,
          esProfesorJefe: Boolean(fila.es_profesor_jefe),
          asignaturas: [],
        });
      }

      const curso = cursosMap.get(fila.curso_id);

      if (fila.es_profesor_jefe) {
        curso.esProfesorJefe = true;
      }

      curso.asignaturas.push({
        id: fila.asignatura_id,
        codigo: fila.asignatura_codigo,
        nombre: fila.asignatura_nombre,
      });
    }

    return res.json({
      docente: {
        id: docente.id,
        rut: docente.rut,
        nombre: [
          docente.nombres,
          docente.apellido_paterno,
          docente.apellido_materno,
        ]
          .filter(Boolean)
          .join(" "),
        correo: docente.correo,
        telefono: docente.telefono,
        especialidad: docente.especialidad,
      },
      cursos: Array.from(cursosMap.values()),
    });
  } catch (error) {
    console.error("Error al obtener dashboard del docente:", error);

    return res.status(500).json({
      error: "Error al obtener la información del docente.",
    });
  }
};

export const getCursoDocente = async (req, res) => {
  try {
    const docenteId = req.usuario.id;
    const { cursoId } = req.params;

    if (!cursoId) {
      return res.status(400).json({
        error: "Debe indicar el curso.",
      });
    }

    const cursoResult = await query(
      `
        SELECT
          c.id,
          c.nombre,
          c.codigo_nivel,
          c.jornada,
          c.anio,
          BOOL_OR(dc.es_profesor_jefe) AS es_profesor_jefe
        FROM docente_curso dc
        INNER JOIN cursos c
          ON c.id = dc.curso_id
        INNER JOIN asignaturas a
          ON a.id = dc.asignatura_id
        WHERE dc.docente_id = $1
          AND dc.curso_id = $2
          AND dc.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
          AND c.activo = TRUE
          AND a.activo = TRUE
        GROUP BY
          c.id,
          c.nombre,
          c.codigo_nivel,
          c.jornada,
          c.anio
        LIMIT 1;
      `,
      [docenteId, cursoId],
    );

    if (cursoResult.rows.length === 0) {
      return res.status(403).json({
        error: "No tienes asignado este curso.",
      });
    }

    const curso = cursoResult.rows[0];

    const asignaturasResult = await query(
      `
        SELECT
          a.id,
          a.codigo,
          a.nombre,
          dc.es_profesor_jefe
        FROM docente_curso dc
        INNER JOIN asignaturas a
          ON a.id = dc.asignatura_id
        WHERE dc.docente_id = $1
          AND dc.curso_id = $2
          AND dc.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
          AND a.activo = TRUE
        ORDER BY a.nombre;
      `,
      [docenteId, cursoId],
    );

    const alumnosResult = await query(
      `
    SELECT
      al.id,
      al.nombres,
      al.apellido_paterno,
      al.apellido_materno,
      al.rut,
      al.fecha_nacimiento,
      al.sexo
    FROM matriculas m
    INNER JOIN alumnos al
      ON al.id = m.alumno_id
    WHERE m.curso_id = $1
      AND m.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    ORDER BY
      al.apellido_paterno,
      al.apellido_materno,
      al.nombres;
  `,
      [cursoId],
    );

    return res.json({
      curso: {
        id: curso.id,
        nombre: curso.nombre,
        codigoNivel: curso.codigo_nivel,
        jornada: curso.jornada,
        anio: curso.anio,
        esProfesorJefe: Boolean(curso.es_profesor_jefe),
      },

      asignaturas: asignaturasResult.rows.map((asignatura) => ({
        id: asignatura.id,
        codigo: asignatura.codigo,
        nombre: asignatura.nombre,
        esProfesorJefe: Boolean(asignatura.es_profesor_jefe),
      })),

      alumnos: alumnosResult.rows.map((alumno) => ({
        id: alumno.id,
        nombre: [
          alumno.nombres,
          alumno.apellido_paterno,
          alumno.apellido_materno,
        ]
          .filter(Boolean)
          .join(" "),
        rut: alumno.rut,
        fechaNacimiento: alumno.fecha_nacimiento,
        sexo: alumno.sexo,
      })),
    });
  } catch (error) {
    console.error("Error al obtener curso del docente:", error);

    return res.status(500).json({
      error: "Error al obtener la información del curso.",
    });
  }
};
