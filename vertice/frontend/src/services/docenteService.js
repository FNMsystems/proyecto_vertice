import { fetchConAuth } from './apiService.js';

export const obtenerMiDashboardDocente = async () => {
  return await fetchConAuth('/docentes/me/dashboard');
};

export const obtenerCursoDocente = async (cursoId) => {
  return await fetchConAuth(
    `/docentes/me/cursos/${cursoId}`
  );
};

export const obtenerAsistenciaCurso = async (
  cursoId,
  fecha
) => {
  return await fetchConAuth(
    `/docentes/me/cursos/${cursoId}/asistencia?fecha=${encodeURIComponent(fecha)}`
  );
};

export const guardarAsistenciaCurso = async (
  cursoId,
  fecha,
  alumnoId,
  estado,
  observacion = ''
) => {
  return await fetchConAuth(
    `/docentes/me/cursos/${cursoId}/asistencia`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fecha,
        registros: [
          {
            alumnoId,
            estado,
            observacion,
          },
        ],
      }),
    }
  );
};