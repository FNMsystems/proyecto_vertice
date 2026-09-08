import pool from '../config/db.js';

export const getAlumnosPorCursoModel = async () => {
  const query = `
    SELECT a.id, a.nombre, a.apellido, c.nombre as curso
    FROM alumnos a
    LEFT JOIN cursos c ON a.curso_id = c.id
    ORDER BY c.nombre ASC, a.apellido ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const registrarAtrasoModel = async (alumnoId, fecha, hora, observacion) => {
  const query = `
    INSERT INTO atrasos (alumno_id, fecha, hora, observacion)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await pool.query(query, [alumnoId, fecha, hora, observacion]);
  return result.rows[0];
};

export const validarRetiroQRModel = async (codigoQR) => {
  const query = `
    SELECT r.id, r.fecha, r.estado, 
           a.nombre as alumno_nombre, a.apellido as alumno_apellido, c.nombre as curso,
           ap.nombre as apoderado_nombre, ap.apellido as apoderado_apellido, ap.rut as apoderado_rut, ap.telefono
    FROM retiros r
    JOIN alumnos a ON r.alumno_id = a.id
    LEFT JOIN cursos c ON a.curso_id = c.id
    JOIN apoderados ap ON r.apoderado_id = ap.id
    WHERE r.codigo_qr = $1 AND r.fecha = CURRENT_DATE
  `;
  const result = await pool.query(query, [codigoQR]);
  return result.rows[0];
};

export const confirmarRetiroModel = async (retiroId) => {
  const query = `
    UPDATE retiros 
    SET estado = 'retirado', hora_retiro = CURRENT_TIME 
    WHERE id = $1 
    RETURNING *
  `;
  const result = await pool.query(query, [retiroId]);
  return result.rows[0];
};