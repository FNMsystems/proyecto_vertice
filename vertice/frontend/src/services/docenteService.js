import { fetchConAuth } from './apiService.js';

export const obtenerMiDashboardDocente = async () => {
  return await fetchConAuth('/docentes/me/dashboard');
};

export const obtenerCursoDocente = async (cursoId) => {
  return await fetchConAuth(
    `/docentes/me/cursos/${cursoId}`
  );
};