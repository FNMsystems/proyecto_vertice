import { query } from '../config/db.js';

export const getPersonalActivoModel = async () => {
  const text = `
    SELECT p.id, u.nombre, u.email, u.rol, p.rut, p.titulo_profesional, p.estado 
    FROM personal p
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.estado = 'ACTIVO'
    ORDER BY u.nombre ASC;
  `;
  const { rows } = await query(text);
  return rows;
};

export const desvincularPersonalModel = async (id, motivo, fecha) => {
  const text = `
    UPDATE personal 
    SET estado = 'DESPEDIDO', 
        motivo_desvinculacion = $1, 
        fecha_desvinculacion = $2
    WHERE id = $3
    RETURNING *;
  `;
  const { rows } = await query(text, [motivo, fecha || new Date(), id]);
  return rows[0];
};