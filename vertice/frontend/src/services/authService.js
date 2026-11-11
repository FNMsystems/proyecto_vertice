const rawBaseUrl = import.meta.env.DEV
  ? 'http://localhost:3000'
  : (import.meta.env.VITE_API_URL || 'https://vertice-backend-sd48.onrender.com');

const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

const API_URL = `${BASE_URL}/api`;

export const loginService = async (
  email,
  password
) => {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      'Error al iniciar sesión'
    );
  }

  localStorage.setItem(
    'token',
    data.token
  );

  localStorage.setItem(
    'usuario',
    JSON.stringify(data.usuario)
  );

  return data;
};

export const logoutService = () => {
  localStorage.removeItem(
    'token'
  );

  localStorage.removeItem(
    'usuario'
  );

  window.location.href = '/';
};

export const getUsuarioActual = () => {
  const userStr =
    localStorage.getItem(
      'usuario'
    );

  return userStr
    ? JSON.parse(userStr)
    : null;
};

export const cambiarPasswordService = async (
  passwordActual,
  passwordNueva
) => {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `${API_URL}/auth/cambiar-password`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        passwordActual,
        passwordNueva
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || 'No se pudo cambiar la contraseña.'
    );
  }

  return data;
};