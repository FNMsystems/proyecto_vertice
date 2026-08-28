import { fetchConAuth } from './apiService.js';

export const getPersonal = async () => {
  return await fetchConAuth('/personal');
};

export const registrarFuncionario = async (datosFuncionario) => {
  return await fetchConAuth('/auth/registro-personal', {
    method: 'POST',
    body: JSON.stringify(datosFuncionario),
  });
};

export const desvincularFuncionario = async (id, motivo) => {
  return await fetchConAuth(`/personal/${id}/desvincular`, {
    method: 'PUT',
    body: JSON.stringify({ motivo, fechaDesvinculacion: new Date() }),
  });
};