import { query } from "../config/db.js";



const formatearFecha = (fechaRaw) => {
  if (!fechaRaw) return "-";
  const str = typeof fechaRaw === "string" ? fechaRaw : fechaRaw.toISOString();
  return str.split("T")[0];
};


const formatearCreadoEn = (fechaRaw) => {
  if (!fechaRaw) return "-";
  const date = new Date(fechaRaw);
  if (isNaN(date.getTime())) return "-";
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const anio = date.getFullYear();
  return `${dia}-${mes}-${anio}`;
};


export const getCursos = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, nombre FROM cursos ORDER BY nombre ASC;`,
    );
    return res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener cursos:", error);
    return res
      .status(500)
      .json({ error: "Error al consultar cursos en la base de datos." });
  }
};


export const getAlumnosPorCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;


    if (!cursoId || cursoId === "undefined") {
      return res.json([]);
    }


    const result = await query(
      `
      SELECT DISTINCT
        a.id,
        a.rut,
        a.nombres,
        a.apellido_paterno,
        a.apellido_materno
      FROM alumnos a
      INNER JOIN matriculas m ON a.id = m.alumno_id
      WHERE m.curso_id = $1::uuid
      ORDER BY a.apellido_paterno ASC;
    `,
      [cursoId],
    );


    return res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener alumnos por curso:", error.message);
    return res
      .status(500)
      .json({ error: "Error al obtener alumnos por curso." });
  }
};


export const registrarAtraso = async (req, res) => {
  try {
    const {
      alumno_id,
      curso_id,
      fecha,
      hora_llegada,
      motivo,
      observacion,
      registrado_por,
    } = req.body;


    if (!alumno_id || !curso_id) {
      return res
        .status(400)
        .json({ error: "El alumno y el curso son obligatorios." });
    }


   
    const usuarioId = req.usuario?.id || registrado_por || null;


    const fechaSql = fecha || new Date().toISOString().split("T")[0];


    const result = await query(
      `
      INSERT INTO retrasos (alumno_id, curso_id, fecha, hora_llegada, motivo, observacion, registrado_por)
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7)
      RETURNING *;
    `,
      [
        alumno_id,
        curso_id,
        fechaSql,
        hora_llegada || null,
        motivo || null,
        observacion || null,
        usuarioId ? usuarioId : null,
      ],
    );


    return res.status(201).json({
      message: "Atraso registrado exitosamente",
      atraso: result.rows[0],
    });
  } catch (error) {
    console.error("Error al registrar atraso:", error.message);
    return res
      .status(500)
      .json({ error: "Error interno al registrar atraso: " + error.message });
  }
};

export const getRetiroPorId = async (req, res) => {
  try {
    const { id } = req.params;


    const result = await query(
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
        -- 1. Intentar obtener la persona autorizada del Pase QR
        pa.nombre_completo AS retira_nombre,
        pa.parentesco AS retira_parentesco,
        pa.rut AS retira_rut,
        -- 2. Si es retiro presencial/nómina, obtener el Apoderado Titular de la tabla apoderados
        apo.nombre_completo AS apoderado_titular_nombre,
        apo.rut AS apoderado_titular_rut
      FROM retiros_estudiante r
      LEFT JOIN alumnos a ON r.alumno_id = a.id
      LEFT JOIN cursos c ON r.curso_id = c.id
      LEFT JOIN solicitudes_retiro_qr sqr ON sqr.alumno_id = r.alumno_id
      LEFT JOIN personas_autorizadas_retiro pa ON sqr.persona_autorizada_id = pa.id
      LEFT JOIN alumno_apoderado aa ON aa.alumno_id = r.alumno_id
      LEFT JOIN apoderados apo ON aa.apoderado_id = apo.id
      WHERE r.id = $1::uuid
      ORDER BY sqr.creado_en DESC NULLS LAST
      LIMIT 1;
    `,
      [id.trim()],
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "No se encontró ningún registro de retiro con ese ID.",
      });
    }


    const row = result.rows[0];


   
    let nombreRetira = "Apoderado Titular / Registrado Presencial";
    let rutRetira = "Sin RUT";


    if (row.retira_nombre) {
      nombreRetira = `${row.retira_nombre} (${row.retira_parentesco || "AUTORIZADO"})`;
      rutRetira = row.retira_rut || "Sin RUT";
    } else if (row.apoderado_titular_nombre) {
      nombreRetira = `${row.apoderado_titular_nombre} (APODERADO TITULAR)`;
      rutRetira = row.apoderado_titular_rut || "Sin RUT";
    }


    res.json({
      id: row.id,
      fecha_retiro: formatearFecha(row.fecha_retiro),
      motivo: row.motivo,
      observacion: row.observacion,
      creado_en: row.creado_en,
      alumno_nombre:
        `${row.alumno_nombres || ""} ${row.alumno_paterno || ""} ${row.alumno_materno || ""}`.trim(),
      alumno_rut: row.alumno_rut || "Sin RUT",
      curso: row.curso_nombre || "Sin curso",
      retira_persona: nombreRetira,
      retira_rut: rutRetira,
    });
  } catch (error) {
    console.error("Error al obtener pase de retiro:", error);
    res
      .status(500)
      .json({ error: "Error interno al consultar el pase de retiro." });
  }
};



export const getTodosLosRetiros = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        r.id,
        r.fecha_retiro,
        r.motivo,
        r.observacion,
        r.creado_en,
        a.nombres AS alumno_nombres,
        a.apellido_paterno AS alumno_paterno
      FROM retiros_estudiante r
      LEFT JOIN alumnos a ON r.alumno_id = a.id
      ORDER BY r.creado_en DESC;
    `);
    const retirosFormateados = result.rows.map((r) => ({
      ...r,
      fecha_retiro: formatearFecha(r.fecha_retiro),
      creado_en_formateado: formatearCreadoEn(r.creado_en),
    }));
    res.json(retirosFormateados);
  } catch (error) {
    console.error("Error al listar retiros:", error);
    res.status(500).json({ error: "Error al obtener el registro de retiros." });
  }
};


export const getEstudiantesSecretaria = async (req, res) => {
  try {
    const sqlQuery = `
      SELECT
        a.id,
        a.rut AS rut_alumno,
        TRIM(CONCAT(a.nombres, ' ', a.apellido_paterno, ' ', COALESCE(a.apellido_materno, ''))) AS nombre_alumno,
        a.direccion,
        COALESCE(c.nombre, 'Por Asignar') AS curso_nombre,
        m.estado AS estado_matricula,
        ap.rut AS rut_apoderado,
        ap.nombre_completo AS apoderado_nombre,
        ap.telefono AS apoderado_telefono
      FROM alumnos a
      LEFT JOIN matriculas m ON a.id = m.alumno_id
      LEFT JOIN cursos c ON m.curso_id = c.id
      LEFT JOIN alumno_apoderado aa ON a.id = aa.alumno_id AND (aa.es_apoderado_principal = TRUE OR aa.es_apoderado_principal IS NULL)
      LEFT JOIN apoderados ap ON aa.apoderado_id = ap.id
      ORDER BY a.apellido_paterno ASC;
    `;
    const result = await query(sqlQuery);
    const estudiantesFormateados = result.rows.map((item) => ({
      id: item.id,
      rut: item.rut_alumno || "Sin RUT",
      nombre: item.nombre_alumno || "Sin Nombre",
      direccion: item.direccion || "Sin Dirección",
      curso:
        item.estado_matricula === "RETIRADA"
          ? "Retirado/a"
          : item.curso_nombre || "Por Asignar",
      estadoMatricula: item.estado_matricula || "SIN MATRÍCULA",
      apoderado: item.apoderado_nombre || "Por Asignar",
      rutApoderado: item.rut_apoderado || "N/A",
      telefono: item.apoderado_telefono || "N/A",
    }));
    return res.json(estudiantesFormateados);
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    return res
      .status(500)
      .json({ error: "Error interno al consultar la base de datos" });
  }
};



export const getJustificativos = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM justificativos ORDER BY id DESC LIMIT 50;`,
    );


   
    const alumnosRes = await query(
      `SELECT id, TRIM(CONCAT(nombres, ' ', apellido_paterno, ' ', COALESCE(apellido_materno, ''))) AS nombre_completo FROM alumnos;`,
    );
    const alumnosMap = new Map();
    alumnosRes.rows.forEach((a) => alumnosMap.set(a.id, a.nombre_completo));


    const justificativosFormateados = result.rows.map((item) => {
   
      const aId =
        item.alumno_id ||
        item.estudiante_id ||
        item.id_alumno ||
        item.usuario_id;
      const nombreAlumno =
        alumnosMap.get(aId) ||
        item.estudiante ||
        item.nombre_estudiante ||
        "Estudiante";


      return {
        ...item,
        fecha_inicio: formatearCreadoEn(item.fecha_inicio),
        fecha_fin: formatearCreadoEn(item.fecha_fin),
        estudiante: nombreAlumno,
      };
    });


    return res.json(justificativosFormateados);
  } catch (error) {
    console.error("Error en justificativos:", error.message);
    return res.json([]);
  }
};


export const cambiarEstadoJustificativo = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const sqlQuery = `UPDATE justificativos SET estado = $1 WHERE id = $2 RETURNING *;`;
    const result = await query(sqlQuery, [estado, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Justificativo no encontrado" });
    }
    return res.json({
      mensaje: `Estado actualizado a ${estado}`,
      justificativo: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar justificativo:", error);
    return res
      .status(500)
      .json({ error: "Error al cambiar estado del justificativo" });
  }
};


export const registrarMatricula = async (req, res) => {
  try {
    const {
      es_nuevo,
      alumno_id,
      nuevo_nombres,
      nuevo_apellido_paterno,
      nuevo_apellido_materno,
      nuevo_rut,
      curso_id,
      anio,
    } = req.body;


    let idEstudianteFinal = alumno_id;


    if (es_nuevo) {
      const nuevoAlumno = await query(
        `
        INSERT INTO alumnos (nombres, apellido_paterno, apellido_materno, rut)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
      `,
        [
          nuevo_nombres,
          nuevo_apellido_paterno,
          nuevo_apellido_materno || null,
          nuevo_rut,
        ],
      );
      idEstudianteFinal = nuevoAlumno.rows[0].id;
    }


    if (!idEstudianteFinal || !curso_id) {
      return res.status(400).json({
        error: "El alumno y el curso son obligatorios para matricular.",
      });
    }



    const anioMatricula = Number(anio) || 2027;


    const nuevaMatricula = await query(
      `
      INSERT INTO matriculas (alumno_id, curso_id, anio, creado_en)
      VALUES ($1::uuid, $2::uuid, $3, NOW())
      RETURNING id, anio;
      `,
      [idEstudianteFinal, curso_id, anioMatricula],
    );


    return res.status(201).json({
      ok: true,
      message: "Matrícula registrada exitosamente.",
      id: nuevaMatricula.rows[0].id,
      anio: nuevaMatricula.rows[0].anio,
    });
  } catch (error) {
    console.error("Error al registrar matrícula:", error.message);
    return res.status(500).json({
      error: "Error interno al registrar matrícula: " + error.message,
    });
  }
};


