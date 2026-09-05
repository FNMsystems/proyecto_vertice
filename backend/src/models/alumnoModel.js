import { query } from '../config/db.js';

export const getAlumnosMatriculadosModel = async () => {
  const text = `
    SELECT 
      a.id, 
      a.rut, 
      a.nombres, 
      a.apellido_paterno, 
      a.apellido_materno, 
      a.promedio_general, 
      a.porcentaje_asistencia, 
      a.estado,
      c.nombre AS curso_nombre,
      c.nivel AS curso_nivel
    FROM alumnos a
    LEFT JOIN cursos c ON a.curso_id = c.id
    WHERE a.estado = 'MATRICULADO'
    ORDER BY a.apellido_paterno ASC, a.nombres ASC;
  `;
  const { rows } = await query(text);
  return rows;
};

export const getAlumnoDetalleModel = async (alumnoId) => {
  const text = `
    SELECT 
      a.*, 
      f.apoderado_nombre, 
      f.apoderado_rut, 
      f.apoderado_telefono, 
      f.apoderado_email,
      f.observaciones_medicas
    FROM alumnos a
    LEFT JOIN fichas_matricula f ON a.id = f.alumno_id
    WHERE a.id = $1;
  `;
  const { rows } = await query(text, [alumnoId]);
  return rows[0];
};

export const registrarExpulsionModel = async (alumnoId, motivoDetalle, usuarioId, documentoUrl) => {

  const updateText = `
    UPDATE alumnos 
    SET estado = 'EXPULSADO' 
    WHERE id = $1 
    RETURNING *;
  `;
  const { rows: alumnosModificados } = await query(updateText, [alumnoId]);

  if (alumnosModificados.length === 0) {
    return null;
  }

  const insertText = `
    INSERT INTO historico_retiros_expulsiones (
      alumno_id, 
      tipo_evento, 
      motivo_detalle, 
      documento_respaldo_url, 
      registrado_por_usuario_id
    )
    VALUES ($1, 'EXPULSION', $2, $3, $4)
    RETURNING *;
  `;
  const { rows: historico } = await query(insertText, [
    alumnoId, 
    motivoDetalle, 
    documentoUrl || null, 
    usuarioId
  ]);

  return {
    alumno: alumnosModificados[0],
    historial: historico[0]
  };
};