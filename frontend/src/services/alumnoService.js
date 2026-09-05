import { fetchConAuth } from './apiService.js';

export const getAlumnos = async () => {
  return await fetchConAuth('/alumnos');
};

export const getAlumnoPorId = async (id) => {
  return await fetchConAuth(`/alumnos/${id}`);
};

export const expulsarAlumno = async (id, motivoDetalle) => {
  return await fetchConAuth(`/alumnos/${id}/expulsar`, {
    method: 'PUT',
    body: JSON.stringify({ motivoDetalle }),
  });
};