const API_URL = import.meta.env.DEV
  ? 'http://localhost:3000/api'
  : (
      import.meta.env.VITE_API_URL ||
      'https://proyecto-vertice-plum.vercel.app/api'
    );

export { API_URL };

const obtenerHeaders = (options = {}) => {
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

  return headers;
};

const verificarSesion = (response) => {
  if (
    response.status === 401 ||
    response.status === 403
  ) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/';
    throw new Error('Sesión expirada o no autorizada');
  }
};

export const fetchConAuth = async (
  endpoint,
  options = {}
) => {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: obtenerHeaders(options)
    }
  );

  verificarSesion(response);

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const mensaje =
      data.mensaje ||
      data.error ||
      data.message ||
      `Error HTTP ${response.status}`;

    const error = new Error(mensaje);
    error.status = response.status;
    error.data = data;

    console.error('Error en petición API:', {
      endpoint,
      status: response.status,
      respuesta: data
    });

    throw error;
  }

  return data;
};

export const fetchArchivoConAuth = async (
  endpoint,
  options = {}
) => {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: obtenerHeaders(options)
    }
  );

  verificarSesion(response);

  if (!response.ok) {
    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    throw new Error(
      data.mensaje ||
      data.error ||
      data.message ||
      `Error al descargar archivo: HTTP ${response.status}`
    );
  }

  return await response.blob();
};
