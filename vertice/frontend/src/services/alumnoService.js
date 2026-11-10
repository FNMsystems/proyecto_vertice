import { fetchConAuth } from './apiService.js';

export const getAlumnos = async () => {
  return await fetchConAuth('/api/alumnos');
};

export const getAlumnoPorId = async (id) => {
  return await fetchConAuth(`/api/alumnos/${id}`);
};

export const expulsarAlumno = async (id, motivoDetalle) => {
  return await fetchConAuth(`/api/alumnos/${id}/expulsar`, {
    method: 'PUT',
    body: JSON.stringify({ motivoDetalle }),
  });
};