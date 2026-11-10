import { fetchConAuth } from './apiService.js';

export const obtenerCursosInspector = async () => {
  return await fetchConAuth(
    '/api/retrasos/cursos'
  );
};

export const obtenerAlumnosCurso = async (
  cursoId
) => {
  return await fetchConAuth(
    `/api/retrasos/cursos/${cursoId}/alumnos`
  );
};

export const registrarRetraso = async ({
  alumnoId,
  cursoId,
  fecha,
  horaLlegada,
  motivo,
  observacion
}) => {
  return await fetchConAuth(
    '/api/retrasos',
    {
      method: 'POST',
      body: JSON.stringify({
        alumnoId,
        cursoId,
        fecha,
        horaLlegada,
        motivo,
        observacion
      })
    }
  );
};