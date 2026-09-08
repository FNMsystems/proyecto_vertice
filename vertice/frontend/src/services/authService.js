import { mockData } from '../mockData.js';

const API_URL = 'http://localhost:3000/api/auth';
const USE_MOCK = true; // Cambiar a false cuando el Backend esté activo

export const loginService = async (email, password) => {
  // --- MODO MOCK (Simulación de Login) ---
  if (USE_MOCK) {
    const usuarioEncontrado = mockData.usuarios.find(
      (u) => u.email === email || u.rut === email
    ) || mockData.usuarios[0]; // Retorna usuario por defecto para pruebas

    const fakeResponse = {
      token: 'fake-jwt-token-12345',
      usuario: usuarioEncontrado,
    };

    localStorage.setItem('token', fakeResponse.token);
    localStorage.setItem('usuario', JSON.stringify(fakeResponse.usuario));
    return fakeResponse;
  }

  // --- MODO PRODUCCIÓN / BACKEND REAL ---
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error al iniciar sesión');
  }

  localStorage.setItem('token', data.token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
  return data;
};

export const logoutService = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/';
};

export const getUsuarioActual = () => {
  const userStr = localStorage.getItem('usuario');
  return userStr ? JSON.parse(userStr) : null;
};