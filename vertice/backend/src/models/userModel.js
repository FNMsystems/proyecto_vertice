import { query } from '../config/db.js';

export const buscarUsuarioPorEmail = async (email) => {
  const text = 'SELECT * FROM usuarios WHERE email = $1;';
  const { rows } = await query(text, [email]);
  return rows[0];
};

export const crearUsuarioModel = async (nombre, email, passwordHash, rol) => {
  const text = `
    INSERT INTO usuarios (nombre, email, password, rol)
    VALUES ($1, $2, $3, $4)
    RETURNING id, nombre, email, rol;
  `;
  const { rows } = await query(text, [nombre, email, passwordHash, rol]);
  return rows[0];
};

export const crearPersonalModel = async (usuarioId, rut, telefono, tituloProfesional, fechaIngreso) => {
  const text = `
    INSERT INTO personal (usuario_id, rut, telefono, titulo_profesional, fecha_ingreso, estado)
    VALUES ($1, $2, $3, $4, $5, 'ACTIVO')
    RETURNING *;
  `;
  const { rows } = await query(text, [usuarioId, rut, telefono, tituloProfesional, fechaIngreso]);
  return rows[0];
};

export const getPersonalActivoModel = async () => {
  const text = `
    SELECT p.id AS personal_id, u.id AS usuario_id, u.nombre, u.email, u.rol, 
           p.rut, p.telefono, p.titulo_profesional, p.estado, p.fecha_ingreso
    FROM personal p
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.estado = 'ACTIVO'
    ORDER BY u.nombre ASC;
  `;
  const { rows } = await query(text);
  return rows;
};

export const desvincularPersonalModel = async (personalId, motivo, fechaDesvinculacion) => {
  const text = `
    UPDATE personal 
    SET estado = 'DESPEDIDO', 
        motivo_desvinculacion = $1, 
        fecha_desvinculacion = $2
    WHERE id = $3
    RETURNING *;
  `;
  const { rows } = await query(text, [motivo, fechaDesvinculacion || new Date(), personalId]);
  return rows[0];
};