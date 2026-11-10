import { fetchConAuth } from './apiService.js';

export const obtenerMisAlumnos = async () => {
  return await fetchConAuth(
    '/api/apoderados/me/alumnos'
  );
};

export const obtenerDetalleAlumno = async (
  alumnoId
) => {
  return await fetchConAuth(
    `/api/apoderados/alumno/${alumnoId}/detalle`
  );
};