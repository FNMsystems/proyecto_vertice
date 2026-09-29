import { fetchConAuth } from './apiService.js';

export const generarSolicitudRetiroQR = async ({
  alumnoId,
  personaAutorizadaId,
  motivo,
  observacion
}) => {
  return await fetchConAuth(
    '/inspectoria/generar-qr',
    {
      method: 'POST',
      body: JSON.stringify({
        alumnoId,
        personaAutorizadaId,
        motivo,
        observacion
      })
    }
  );
};

export const validarRetiroQR = async (
  codigoQR
) => {
  return await fetchConAuth(
    '/inspectoria/validar-qr',
    {
      method: 'POST',
      body: JSON.stringify({
        codigoQR
      })
    }
  );
};

export const confirmarRetiro = async ({
  solicitudId,
  alumnoId,
  cursoId,
  motivo,
  observacion
}) => {
  return await fetchConAuth(
    '/inspectoria/confirmar-retiro',
    {
      method: 'POST',
      body: JSON.stringify({
        solicitudId,
        alumnoId,
        cursoId,
        motivo,
        observacion
      })
    }
  );
};