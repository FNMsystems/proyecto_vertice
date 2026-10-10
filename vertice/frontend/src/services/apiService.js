/**const API_URL = 'http://localhost:3000/api';**/
const API_URL = 'https://0hvj9hvv-3000.brs.devtunnels.ms/api';

export const fetchConAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const esFormData =
    typeof FormData !== 'undefined' &&
    options.body instanceof FormData;

  const headers = {
    ...(esFormData
      ? {}
      : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/';
    throw new Error(
      'Sesión expirada o no autorizada'
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || 'Error en la petición'
    );
  }

  return data;
};