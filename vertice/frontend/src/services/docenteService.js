import {
  fetchConAuth
} from './apiService.js';

export const obtenerMiDashboardDocente =
  async () => {

    return await fetchConAuth(
      '/docentes/me/dashboard'
    );

  };