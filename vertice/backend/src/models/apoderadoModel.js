import pool from '../config/db.js';

export const getAlumnosPorApoderadoModel = async (apoderadoId) => {
  const query = `
    SELECT a.id, a.nombre, a.apellido, a.rut, c.nombre as curso 
    FROM alumnos a 
    LEFT JOIN cursos c ON a.curso_id = c.id 
    WHERE a.apoderado_id = $1
  `;
  const result = await pool.query(query, [apoderadoId]);
  return result.rows;
};

export const getDetalleAlumnoModel = async (alumnoId) => {
  const asignaturasQuery = `
    SELECT asig.nombre, array_agg(n.nota) as notas, ROUND(AVG(n.nota), 1) as promedio
    FROM notas n
    JOIN asignaturas asig ON n.asignatura_id = asig.id
    WHERE n.alumno_id = $1
    GROUP BY asig.nombre
  `;

  const anotacionesQuery = `
    SELECT a.fecha, asig.nombre as asignatura, a.tipo, a.detalle
    FROM anotaciones a
    JOIN asignaturas asig ON a.asignatura_id = asig.id
    WHERE a.alumno_id = $1
  `;

  const asistenciaQuery = `
    SELECT fecha, estado FROM asistencia WHERE alumno_id = $1 ORDER BY fecha DESC
  `;

  const comunicacionesQuery = `
    SELECT titulo, contenido, fecha, tipo, remitente FROM comunicaciones 
    WHERE alumno_id = $1 OR tipo = 'general' ORDER BY fecha DESC
  `;

  const pieQuery = `
    SELECT psicologa, psicopedagoga, observaciones FROM atencion_pie WHERE alumno_id = $1
  `;

  const [asignaturas, anotaciones, asistencia, comunicaciones, pie] = await Promise.all([
    pool.query(asignaturasQuery, [alumnoId]),
    pool.query(anotacionesQuery, [alumnoId]),
    pool.query(asistenciaQuery, [alumnoId]),
    pool.query(comunicacionesQuery, [alumnoId]),
    pool.query(pieQuery, [alumnoId])
  ]);

  return {
    asignaturas: asignaturas.rows,
    anotaciones: anotaciones.rows,
    asistencia: asistencia.rows,
    comunicaciones: comunicaciones.rows,
    pie: pie.rows[0] || null
  };
};