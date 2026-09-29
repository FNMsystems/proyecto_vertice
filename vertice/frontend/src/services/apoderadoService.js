import { fetchConAuth } from './apiService.js';

export const obtenerMisAlumnos = async () => {
  return await fetchConAuth(
    '/apoderados/me/alumnos'
  );
};

export const obtenerDetalleAlumno = async (
  alumnoId
) => {
  return await fetchConAuth(
    `/apoderados/alumno/${alumnoId}/detalle`
  );
};