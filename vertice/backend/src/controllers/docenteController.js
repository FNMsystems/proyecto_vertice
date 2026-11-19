import { query } from "../config/db.js";

const CURSOS_PRIMER_BASICO_IDS = [
  "11000000-0000-0000-0000-000000000001",
  "11000000-0000-0000-0000-000000000002",
];

const esCursoGeneralista = (curso) => {
  return (
    String(curso?.codigoNivel || curso?.codigo_nivel || "").trim() === "010" ||
    CURSOS_PRIMER_BASICO_IDS.includes(String(curso?.id || ""))
  );
};

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
        docenteId: docenteId,
        docente: [
          docente.nombres,
          docente.apellido_paterno,
          docente.apellido_materno,
        ]
          .filter(Boolean)
          .join(" "),
        correoDocente: docente.correo,
        puedeGestionar: true,
      });
    }

    const cursosIniciales = Array.from(cursosMap.values());

    for (const curso of cursosIniciales) {
      if (!curso.esProfesorJefe) {
        continue;
      }

      const generalista = esCursoGeneralista(curso);

      const asignaturasCursoResult = await query(
        `
          SELECT
            a.id AS asignatura_id,
            a.codigo AS asignatura_codigo,
            a.nombre AS asignatura_nombre,
            d.id AS docente_id,
            CONCAT(
              d.nombres,
              ' ',
              d.apellido_paterno,
              CASE
                WHEN d.apellido_materno IS NOT NULL
                  AND TRIM(d.apellido_materno) <> ''
                THEN ' ' || d.apellido_materno
                ELSE ''
              END
            ) AS docente_nombre,
            d.correo AS docente_correo
          FROM docente_curso dc
          INNER JOIN asignaturas a
            ON a.id = dc.asignatura_id
          LEFT JOIN docentes d
            ON d.id = dc.docente_id
          WHERE dc.curso_id = $1
            AND dc.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
            AND a.activo = TRUE
          ORDER BY a.nombre;
        `,
        [curso.id],
      );

      curso.asignaturas = asignaturasCursoResult.rows.map((asignatura) => ({
        id: asignatura.asignatura_id,
        codigo: asignatura.asignatura_codigo,
        nombre: asignatura.asignatura_nombre,
        docenteId: asignatura.docente_id,
        docente: asignatura.docente_nombre,
        correoDocente: asignatura.docente_correo,
        puedeGestionar:
          generalista || String(asignatura.docente_id) === String(docenteId),
      }));
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
      cursos: cursosIniciales,
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
    const esJefeGeneralista =
      Boolean(curso.es_profesor_jefe) && esCursoGeneralista(curso);

    let horario = [];

    if (Boolean(curso.es_profesor_jefe)) {
      const horarioResult = await query(
        `
          SELECT
            h.id,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin,
            a.id AS asignatura_id,
            a.nombre AS asignatura_nombre,
            a.codigo AS asignatura_codigo,
            d.id AS docente_id,
            CONCAT(
              d.nombres,
              ' ',
              d.apellido_paterno,
              CASE
                WHEN d.apellido_materno IS NOT NULL
                  AND TRIM(d.apellido_materno) <> ''
                THEN ' ' || d.apellido_materno
                ELSE ''
              END
            ) AS docente_nombre
          FROM horarios h
          INNER JOIN asignaturas a
            ON a.id = h.asignatura_id
          LEFT JOIN docentes d
            ON d.id = h.docente_id
          WHERE h.curso_id = $1
            AND h.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
            AND a.activo = TRUE
          ORDER BY
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin;
        `,
        [cursoId],
      );

      horario = horarioResult.rows.map((clase) => ({
        id: clase.id,
        diaSemana: clase.dia_semana,
        horaInicio: clase.hora_inicio,
        horaFin: clase.hora_fin,
        asignaturaId: clase.asignatura_id,
        asignatura: clase.asignatura_nombre,
        codigoAsignatura: clase.asignatura_codigo,
        docenteId: clase.docente_id,
        docente: clase.docente_nombre,
      }));
    }

    const asignaturasResult = await query(
      `
        SELECT
          a.id,
          a.codigo,
          a.nombre,
          d.id AS docente_id,
          CONCAT(
            d.nombres,
            ' ',
            d.apellido_paterno,
            CASE
              WHEN d.apellido_materno IS NOT NULL
                AND TRIM(d.apellido_materno) <> ''
              THEN ' ' || d.apellido_materno
              ELSE ''
            END
          ) AS docente_nombre,
          d.correo AS docente_correo

        FROM docente_curso dc

        INNER JOIN asignaturas a
          ON a.id = dc.asignatura_id

        LEFT JOIN docentes d
          ON d.id = dc.docente_id

        WHERE dc.curso_id = $1
          AND dc.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
          AND a.activo = TRUE

          AND (
            EXISTS (
              SELECT 1
              FROM docente_curso dc_jefe
              WHERE dc_jefe.docente_id = $2
                AND dc_jefe.curso_id = dc.curso_id
                AND dc_jefe.anio = dc.anio
                AND dc_jefe.es_profesor_jefe = TRUE
            )
            OR dc.docente_id = $2
          )

        ORDER BY a.nombre;
      `,
      [cursoId, docenteId],
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
          al.sexo,
          m.observaciones_relevantes,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', p.id,
                'nombre', p.nombre_completo,
                'rut', p.rut,
                'telefono', p.telefono,
                'correo', p.correo,
                'parentesco', aa.parentesco,
                'esApoderadoPrincipal', aa.es_apoderado_principal
              )
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::json
          ) AS apoderados
        FROM matriculas m
        INNER JOIN alumnos al
          ON al.id = m.alumno_id
        LEFT JOIN alumno_apoderado aa
          ON aa.alumno_id = al.id
        LEFT JOIN apoderados p
          ON p.id = aa.apoderado_id
        WHERE m.curso_id = $1
          AND m.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        GROUP BY
          al.id,
          al.nombres,
          al.apellido_paterno,
          al.apellido_materno,
          al.rut,
          al.fecha_nacimiento,
          al.sexo,
          m.observaciones_relevantes
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
        docenteId: asignatura.docente_id,
        docente: asignatura.docente_nombre,
        correoDocente: asignatura.docente_correo,
        puedeGestionar:
          esJefeGeneralista ||
          String(asignatura.docente_id) === String(docenteId),
      })),

      horario,

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
        observacionesRelevantes: alumno.observaciones_relevantes,
        apoderados: alumno.apoderados || [],
      })),
    });
  } catch (error) {
    console.error("Error al obtener curso del docente:", error);

    return res.status(500).json({
      error: "Error al obtener la información del curso.",
    });
  }
};

export const getInformacionAlumnoDocente = async (req, res) => {
  try {
    const docenteId = req.usuario.id;
    const { alumnoId } = req.params;

    if (!alumnoId) {
      return res.status(400).json({
        error: "Debe indicar el alumno.",
      });
    }

    const alumnoResult = await query(
      `
        SELECT
          al.id,
          al.nombres,
          al.apellido_paterno,
          al.apellido_materno,
          al.rut,
          al.fecha_nacimiento,
          al.sexo,
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
          m.observaciones,
          m.estado,
          m.fecha_matricula
        FROM matriculas m
        INNER JOIN alumnos al
          ON al.id = m.alumno_id
        INNER JOIN docente_curso dc
          ON dc.curso_id = m.curso_id
          AND dc.anio = m.anio
        INNER JOIN cursos c
          ON c.id = m.curso_id
        WHERE al.id = $1
          AND dc.docente_id = $2
          AND m.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
          AND c.activo = TRUE
        LIMIT 1;
      `,
      [alumnoId, docenteId],
    );

    if (alumnoResult.rows.length === 0) {
      return res.status(403).json({
        error: "No tienes acceso a la información de este alumno.",
      });
    }

    const alumno = alumnoResult.rows[0];

    const apoderadosResult = await query(
      `
        SELECT DISTINCT ON (p.id)
          p.id,
          p.nombre_completo,
          p.rut,
          p.telefono,
          p.correo,
          p.direccion,
          p.comuna,
          aa.parentesco,
          aa.es_apoderado_principal
        FROM alumno_apoderado aa
        INNER JOIN apoderados p
          ON p.id = aa.apoderado_id
        WHERE aa.alumno_id = $1
        ORDER BY p.id, aa.es_apoderado_principal DESC;
      `,
      [alumnoId],
    );

    return res.json({
      alumno: {
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
        haRepetido: alumno.ha_repetido,
        optaReligion: alumno.opta_religion,
        credoReligioso: alumno.credo_religioso,
        perteneceProgramaSocial: alumno.pertenece_programa_social,
        procedenciaEscolar: alumno.procedencia_escolar,
        observacionesRelevantes: alumno.observaciones_relevantes,
        seAtiendeCentroSalud: alumno.se_atiende_centro_salud,
        nombreCentroSalud: alumno.nombre_centro_salud,
        pertenecePuebloIndigena: alumno.pertenece_pueblo_indigena,
        porcentajeRegistroSocial: alumno.porcentaje_registro_social,
        vivienda: alumno.vivienda,
        numeroPersonasHogar: alumno.numero_personas_hogar,
        personasTrabajandoHogar: alumno.personas_trabajando_hogar,
        ingresoMensualHogar: alumno.ingreso_mensual_hogar,
        numeroHabitaciones: alumno.numero_habitaciones,
        conQuienVive: alumno.con_quien_vive,
        sistema_salud: alumno.sistema_salud,
        tieneAgua: alumno.tiene_agua,
        tieneElectricidad: alumno.tiene_electricidad,
        tieneAlcantarillado: alumno.tiene_alcantarillado,
        autorizadoSalirSolo: alumno.autorizado_salir_solo,
        observacionesMatricula: alumno.observaciones,
        estadoMatricula: alumno.estado,
        fechaMatricula: alumno.fecha_matricula,
        apoderados: apoderadosResult.rows.map((apoderado) => ({
          id: apoderado.id,
          nombre: apoderado.nombre_completo,
          rut: apoderado.rut,
          telefono: apoderado.telefono,
          correo: apoderado.correo,
          direccion: apoderado.direccion,
          comuna: apoderado.comuna,
          parentesco: apoderado.parentesco,
          esApoderadoPrincipal: Boolean(apoderado.es_apoderado_principal),
        })),
      },
    });
  } catch (error) {
    console.error("Error al obtener información del alumno:", error);

    return res.status(500).json({
      error: "Error al obtener la información del alumno.",
    });
  }
};

export const getAsistenciaCurso = async (req, res) => {
  try {
    const docenteId = req.usuario.id;
    const { cursoId } = req.params;

    const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
    const mesFiltro = req.query.mes || fecha.slice(0, 7);

    if (!cursoId) {
      return res.status(400).json({
        error: "Debe indicar el curso.",
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
      [docenteId, cursoId],
    );

    if (accesoResult.rows.length === 0) {
      return res.status(403).json({
        error: "No tienes asignado este curso.",
      });
    }

    const asistenciaDiaResult = await query(
      `
        SELECT
          al.id AS alumno_id,
          al.nombres,
          al.apellido_paterno,
          al.apellido_materno,
          al.rut,
          asi.id AS asistencia_id,
          asi.fecha,
          asi.estado,
          asi.observacion,
          COALESCE(
            ROUND(
              (
                COUNT(*) FILTER (WHERE a_hist.estado IN ('PRESENTE', 'ATRASADO', 'JUSTIFICADO'))::NUMERIC
                / NULLIF(COUNT(a_hist.id), 0)
              ) * 100,
              1
            ),
            0.0
          ) AS porcentaje_asistencia
        FROM matriculas m
        INNER JOIN alumnos al
          ON al.id = m.alumno_id
        LEFT JOIN asistencia asi
          ON asi.alumno_id = al.id
          AND asi.curso_id = m.curso_id
          AND asi.fecha = $2
        LEFT JOIN asistencia a_hist
          ON a_hist.alumno_id = al.id
          AND a_hist.curso_id = m.curso_id
          AND EXTRACT(YEAR FROM a_hist.fecha)::INTEGER = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        WHERE m.curso_id = $1
          AND m.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        GROUP BY
          al.id,
          al.nombres,
          al.apellido_paterno,
          al.apellido_materno,
          al.rut,
          asi.id,
          asi.fecha,
          asi.estado,
          asi.observacion,
          m.curso_id
        ORDER BY
          al.apellido_paterno,
          al.apellido_materno,
          al.nombres;
      `,
      [cursoId, fecha],
    );

    const statsMesResult = await query(
      `
        SELECT
          COUNT(*) AS total_registros,
          COUNT(*) FILTER (WHERE asi.estado = 'PRESENTE') AS total_presentes,
          COUNT(*) FILTER (WHERE asi.estado = 'AUSENTE') AS total_ausentes,
          COUNT(*) FILTER (WHERE asi.estado = 'ATRASADO') AS total_atrasados,
          COUNT(*) FILTER (WHERE asi.estado = 'JUSTIFICADO') AS total_justificados
        FROM asistencia asi
        INNER JOIN matriculas m
          ON m.alumno_id = asi.alumno_id
          AND m.curso_id = asi.curso_id
          AND m.anio = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        WHERE asi.curso_id = $1
          AND TO_CHAR(asi.fecha, 'YYYY-MM') = $2;
      `,
      [cursoId, mesFiltro],
    );

    const statsRow = statsMesResult.rows[0] || {};
    const totalReg = Number(statsRow.total_registros || 0);
    const totalAsistidos =
      Number(statsRow.total_presentes || 0) +
      Number(statsRow.total_atrasados || 0) +
      Number(statsRow.total_justificados || 0);

    const porcentajeCursoMes =
      totalReg > 0 ? Number(((totalAsistidos / totalReg) * 100).toFixed(1)) : 0.0;

    return res.json({
      fecha,
      mesFiltro,
      estadisticasMes: {
        porcentajeCurso: porcentajeCursoMes,
        presentes: Number(statsRow.total_presentes || 0),
        ausentes: Number(statsRow.total_ausentes || 0),
        atrasados: Number(statsRow.total_atrasados || 0),
        justificados: Number(statsRow.total_justificados || 0),
        totalClasesEvaluadas: totalReg,
      },
      alumnos: asistenciaDiaResult.rows.map((alumno) => ({
        id: alumno.alumno_id,
        nombre: [
          alumno.nombres,
          alumno.apellido_paterno,
          alumno.apellido_materno,
        ]
          .filter(Boolean)
          .join(" "),
        rut: alumno.rut,
        asistenciaId: alumno.asistencia_id || null,
        estado: alumno.estado || null,
        observacion: alumno.observacion || "",
        porcentajeAsistencia: Number(alumno.porcentaje_asistencia ?? 0.0),
      })),
    });
  } catch (error) {
    console.error("Error al obtener asistencia del curso:", error);
    return res.status(500).json({
      error: "Error al obtener la asistencia.",
      detalle: error.message,
    });
  }
};

export const guardarAsistenciaCurso = async (req, res) => {
  try {
    const docenteId = req.usuario.id;
    const { cursoId } = req.params;

    const { fecha, registros } = req.body;

    if (!cursoId) {
      return res.status(400).json({
        error: "Debe indicar el curso.",
      });
    }

    if (!fecha) {
      return res.status(400).json({
        error: "Debe indicar la fecha.",
      });
    }

    if (!Array.isArray(registros)) {
      return res.status(400).json({
        error: "Los registros de asistencia deben ser un arreglo.",
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
      [docenteId, cursoId],
    );

    if (accesoResult.rows.length === 0) {
      return res.status(403).json({
        error: "No tienes asignado este curso.",
      });
    }

    const estadosPermitidos = [
      "PRESENTE",
      "AUSENTE",
      "ATRASADO",
      "JUSTIFICADO",
    ];

    for (const registro of registros) {
      if (!registro.alumnoId) {
        return res.status(400).json({
          error: "Falta el alumno en uno de los registros.",
        });
      }

      if (!estadosPermitidos.includes(registro.estado)) {
        return res.status(400).json({
          error: `Estado de asistencia inválido: ${registro.estado}`,
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
        [registro.alumnoId, cursoId],
      );

      if (alumnoResult.rows.length === 0) {
        return res.status(400).json({
          error: "Uno de los alumnos no pertenece a este curso.",
        });
      }
    }

    for (const registro of registros) {
      const existenteResult = await query(
        `
          SELECT id
          FROM asistencia
          WHERE alumno_id = $1
            AND curso_id = $2
            AND fecha = $3
          LIMIT 1;
        `,
        [registro.alumnoId, cursoId, fecha],
      );

      if (existenteResult.rows.length > 0) {
        await query(
          `
            UPDATE asistencia
            SET
              docente_id = $1,
              estado = $2,
              observacion = $3
            WHERE id = $4;
          `,
          [
            docenteId,
            registro.estado,
            registro.observacion || null,
            existenteResult.rows[0].id,
          ],
        );
      } else {
        await query(
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
            );
          `,
          [
            registro.alumnoId,
            cursoId,
            docenteId,
            fecha,
            registro.estado,
            registro.observacion || null,
          ],
        );
      }
    }

    return res.json({
      mensaje: "Asistencia guardada correctamente.",
      fecha,
      cantidad: registros.length,
    });
  } catch (error) {
    console.error("ERROR REAL AL GUARDAR ASISTENCIA:", error);

    return res.status(500).json({
      error: "Error al guardar la asistencia.",
      detalle: error.message,
    });
  }
};
