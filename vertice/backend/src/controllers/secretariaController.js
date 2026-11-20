import { query } from "../config/db.js";
import { get } from "@vercel/blob";
import { Readable } from "node:stream";

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
      SELECT DISTINCT ON (a.id)
        a.id,
        m.id AS matricula_id,
        a.rut AS rut_alumno,
        TRIM(CONCAT(a.nombres, ' ', a.apellido_paterno, ' ', COALESCE(a.apellido_materno, ''))) AS nombre_alumno,
        a.direccion AS direccion_alumno,
        COALESCE(c.nombre, 'Por Asignar') AS curso_nombre,
        m.estado AS estado_matricula,
        m.sistema_salud,
        m.nombre_centro_salud,
        m.observaciones_relevantes,
        ap.rut AS rut_apoderado,
        ap.nombre_completo AS apoderado_nombre,
        ap.telefono AS apoderado_telefono,
        ap.correo AS apoderado_correo,
        ap.direccion AS apoderado_direccion,
        ap.comuna AS apoderado_comuna,
        aa.parentesco AS apoderado_parentesco,
        COALESCE(aa.es_apoderado_principal, TRUE) AS es_apoderado_principal
      FROM alumnos a
      INNER JOIN matriculas m ON a.id = m.alumno_id
      LEFT JOIN cursos c ON m.curso_id = c.id
      LEFT JOIN alumno_apoderado aa ON a.id = aa.alumno_id
      LEFT JOIN apoderados ap ON aa.apoderado_id = ap.id
      WHERE UPPER(COALESCE(m.estado, 'ACTIVA')) = 'ACTIVA'
      ORDER BY
        a.id,
        m.anio DESC NULLS LAST,
        m.creado_en DESC NULLS LAST,
        COALESCE(aa.es_apoderado_principal, TRUE) DESC;
    `;
    const result = await query(sqlQuery);

    const estudiantesFormateados = result.rows
      .sort((a, b) =>
        String(a.nombre_alumno || "").localeCompare(
          String(b.nombre_alumno || ""),
          "es",
          { sensitivity: "base" },
        ),
      )
      .map((item) => {
        const direccionFinal =
          [
            item.apoderado_direccion || item.direccion_alumno,
            item.apoderado_comuna,
          ]
            .filter(Boolean)
            .join(", ") || "Sin dirección registrada";

        return {
          id: item.id,
          matricula_id: item.matricula_id,
          rut: item.rut_alumno || "Sin RUT",
          nombre: item.nombre_alumno || "Sin Nombre",
          direccion: direccionFinal,
          curso: item.curso_nombre || "Por Asignar",
          estadoMatricula: item.estado_matricula || "ACTIVA",
          sistema_salud: item.sistema_salud || "No especificado",
          nombre_centro_salud: item.nombre_centro_salud || "No especificado",
          observaciones_relevantes:
            item.observaciones_relevantes || "Sin observaciones",
          apoderado: item.apoderado_nombre || "Por Asignar",
          rutApoderado: item.rut_apoderado || "Sin RUT",
          telefono: item.apoderado_telefono || "Sin teléfono",
          correoApoderado: item.apoderado_correo || "Sin correo",
          parentescoApoderado: item.apoderado_parentesco || "Apoderado",
          esApoderadoPrincipal: Boolean(item.es_apoderado_principal),
        };
      });

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
    alumnosRes.rows.forEach((a) => alumnosMap.set(String(a.id), a.nombre_completo));

    const justificativosFormateados = result.rows.map((item) => {
      const aId =
        item.alumno_id ||
        item.estudiante_id ||
        item.id_alumno ||
        item.usuario_id;
      const nombreAlumno =
        alumnosMap.get(String(aId)) ||
        item.alumno_nombre ||
        item.nombre_alumno ||
        item.estudiante ||
        item.nombre_estudiante ||
        "Estudiante";

      const rutaArchivo =
        item.archivo_pdf ||
        item.archivo_url ||
        item.archivo ||
        item.documento_url ||
        item.url_archivo ||
        null;

      return {
        ...item,
        fecha_inicio: formatearCreadoEn(item.fecha_inicio),
        fecha_fin: formatearCreadoEn(item.fecha_fin),
        estudiante: nombreAlumno,
        alumno_nombre: nombreAlumno,
        archivo_pdf: rutaArchivo,
        tiene_archivo: Boolean(rutaArchivo),
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

export const getMatriculasActivasPorCurso = async (req, res) => {
  try {
    const { cursoId } = req.params;
    const anio = Number(req.query.anio) || 2026;

    if (!cursoId || cursoId === "undefined") {
      return res.json([]);
    }

    const result = await query(
      `
      SELECT
        m.id AS matricula_id,
        m.alumno_id,
        m.curso_id,
        m.anio,
        m.estado,
        m.ha_repetido,
        a.rut,
        a.nombres,
        a.apellido_paterno,
        a.apellido_materno,
        TRIM(CONCAT(a.nombres, ' ', a.apellido_paterno, ' ', COALESCE(a.apellido_materno, ''))) AS nombre_completo,
        c.nombre AS curso_nombre
      FROM matriculas m
      INNER JOIN alumnos a ON a.id = m.alumno_id
      INNER JOIN cursos c ON c.id = m.curso_id
      WHERE m.curso_id = $1::uuid
        AND UPPER(COALESCE(m.estado, 'ACTIVA')) = 'ACTIVA'
        AND m.anio = $2
      ORDER BY a.apellido_paterno ASC, a.apellido_materno ASC NULLS FIRST, a.nombres ASC;
      `,
      [cursoId, anio],
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(
      "Error al obtener matrículas activas por curso:",
      error.message,
    );
    return res
      .status(500)
      .json({ error: "Error al obtener matrículas activas del curso." });
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
      ha_repetido,
      opta_religion,
      credo_religioso,
      pertenece_programa_social,
      procedencia_escolar,
      observaciones_relevantes,
      se_atiende_centro_salud,
      nombre_centro_salud,
      pertenece_pueblo_indigena,
      porcentaje_registro_social,
      vivienda,
      numero_personas_hogar,
      personas_trabajando_hogar,
      ingreso_mensual_hogar,
      numero_habitaciones,
      con_quien_vive,
      sistema_salud,
      tiene_agua,
      tiene_electricidad,
      tiene_alcantarillado,
      autorizado_salir_solo,
      observaciones,
      estado,
    } = req.body;

    let idEstudianteFinal = alumno_id;
    const esAlumnoNuevo = es_nuevo === true || es_nuevo === "true";

    if (esAlumnoNuevo) {
      if (
        !nuevo_nombres?.trim() ||
        !nuevo_apellido_paterno?.trim() ||
        !nuevo_rut?.trim()
      ) {
        return res.status(400).json({
          error:
            "Para un alumno nuevo, nombres, apellido paterno y RUT son obligatorios.",
        });
      }

      const nuevoAlumno = await query(
        `
        INSERT INTO alumnos (nombres, apellido_paterno, apellido_materno, rut)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
        `,
        [
          nuevo_nombres.trim(),
          nuevo_apellido_paterno.trim(),
          nuevo_apellido_materno?.trim() || null,
          nuevo_rut.trim(),
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
      INSERT INTO matriculas (
        alumno_id,
        curso_id,
        anio,
        ha_repetido,
        opta_religion,
        credo_religioso,
        pertenece_programa_social,
        procedencia_escolar,
        observaciones_relevantes,
        se_atiende_centro_salud,
        nombre_centro_salud,
        pertenece_pueblo_indigena,
        porcentaje_registro_social,
        vivienda,
        numero_personas_hogar,
        personas_trabajando_hogar,
        ingreso_mensual_hogar,
        numero_habitaciones,
        con_quien_vive,
        sistema_salud,
        tiene_agua,
        tiene_electricidad,
        tiene_alcantarillado,
        autorizado_salir_solo,
        observaciones,
        estado,
        fecha_matricula,
        creado_en,
        actualizado_en
      )
      VALUES (
        $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, CURRENT_DATE, NOW(), NOW()
      )
      RETURNING id, anio, curso_id, ha_repetido;
      `,
      [
        idEstudianteFinal,
        curso_id,
        anioMatricula,
        Boolean(ha_repetido),
        Boolean(opta_religion),
        credo_religioso || null,
        Boolean(pertenece_programa_social),
        procedencia_escolar || null,
        observaciones_relevantes || null,
        Boolean(se_atiende_centro_salud),
        nombre_centro_salud || null,
        Boolean(pertenece_pueblo_indigena),
        porcentaje_registro_social || null,
        vivienda || null,
        numero_personas_hogar !== "" &&
        numero_personas_hogar !== null &&
        numero_personas_hogar !== undefined
          ? Number(numero_personas_hogar)
          : null,
        personas_trabajando_hogar !== "" &&
        personas_trabajando_hogar !== null &&
        personas_trabajando_hogar !== undefined
          ? Number(personas_trabajando_hogar)
          : null,
        ingreso_mensual_hogar !== "" &&
        ingreso_mensual_hogar !== null &&
        ingreso_mensual_hogar !== undefined
          ? Number(ingreso_mensual_hogar)
          : null,
        numero_habitaciones !== "" &&
        numero_habitaciones !== null &&
        numero_habitaciones !== undefined
          ? Number(numero_habitaciones)
          : null,
        con_quien_vive || null,
        sistema_salud || null,
        Boolean(tiene_agua),
        Boolean(tiene_electricidad),
        Boolean(tiene_alcantarillado),
        Boolean(autorizado_salir_solo),
        observaciones || null,
        estado || "ACTIVA",
      ],
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

export const verPdfJustificativo = async (req, res) => {
  try {
    const { id } = req.params;

    const rol = String(req.usuario?.rol || "")
      .trim()
      .toUpperCase();

    const rolesPermitidos = [
      "SECRETARIA",
      "DIRECTOR",
      "ADMIN",
      "ADMINISTRADOR",
    ];

    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({
        error: "No tienes autorización para ver este documento.",
      });
    }

    const resultBD = await query(
      `SELECT * FROM justificativos WHERE id = $1 LIMIT 1`,
      [id],
    );

    if (resultBD.rows.length === 0) {
      return res.status(404).json({
        error: "No se encontró el justificativo.",
      });
    }

    const fila = resultBD.rows[0];
    let rawArchivo =
      fila.archivo_pdf ||
      fila.archivo_url ||
      fila.archivo ||
      fila.documento_url ||
      fila.url_archivo ||
      "";

    rawArchivo = String(rawArchivo).trim();

    if (!rawArchivo) {
      return res.status(404).json({
        error: "El justificativo no tiene un archivo adjunto.",
      });
    }

    let pathname = rawArchivo;
    if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
      try {
        pathname = decodeURIComponent(new URL(pathname).pathname).replace(/^\/+/, "");
      } catch {

      }
    }

    let archivo = null;
    try {
      archivo = await get(pathname, { access: "private" });
    } catch {
      archivo = null;
    }

    if (!archivo || archivo.statusCode !== 200 || !archivo.stream) {
      try {
        archivo = await get(pathname, { access: "public" });
      } catch {
        archivo = null;
      }
    }

    if ((!archivo || archivo.statusCode !== 200 || !archivo.stream) && rawArchivo.startsWith("http")) {
      const respRemota = await fetch(rawArchivo);
      if (respRemota.ok && respRemota.body) {
        const descargar = String(req.query?.download || "") === "1";
        res.setHeader("Content-Type", respRemota.headers.get("content-type") || "application/pdf");
        res.setHeader(
          "Content-Disposition",
          descargar ? 'attachment; filename="justificativo.pdf"' : 'inline; filename="justificativo.pdf"',
        );
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        Readable.fromWeb(respRemota.body).pipe(res);
        return;
      }
    }

    if (!archivo || archivo.statusCode !== 200 || !archivo.stream) {
      return res.status(404).json({
        error: "No se encontró el archivo PDF.",
      });
    }

    const descargar = String(req.query?.download || "") === "1";
    res.setHeader("Content-Type", archivo.contentType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      descargar ? 'attachment; filename="justificativo.pdf"' : 'inline; filename="justificativo.pdf"',
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    Readable.fromWeb(archivo.stream).pipe(res);
  } catch (error) {
    console.error("Error mostrando PDF:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "No se pudo visualizar el justificativo.",
      });
    }
  }
};
