import { mockData } from '../mockData.js';

const API_URL = 'http://localhost:3000/api';
const USE_MOCK = true; // Cambiar a false cuando el Backend en Node/Express esté corriendo

export const fetchConAuth = async (endpoint, options = {}) => {
  // --- MODO MOCK (Desarrollo local sin Backend) ---
  if (USE_MOCK) {
    if (endpoint.includes('/alumnos')) return mockData.alumnos;
    if (endpoint.includes('/usuarios')) return mockData.usuarios;
    return mockData;
  }

  // --- MODO PRODUCCIÓN / BACKEND REAL ---
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/'; 
    throw new Error('Sesión expirada o no autorizada');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición');
  }

  return data;
};