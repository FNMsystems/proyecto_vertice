import { fetchConAuth } from './apiService.js';

const API = '/director';

export const getResumenDirector = async (anio = 2026) => {
  return await fetchConAuth(`${API}/resumen?anio=${anio}`);
};

export const getAlumnosDirector = async (anio = 2026) => {
  return await fetchConAuth(`${API}/alumnos?anio=${anio}`);
};

export const getDetalleAlumnoDirector = async (id, anio = 2026) => {
  return await fetchConAuth(`${API}/alumnos/${id}?anio=${anio}`);
};

export const desvincularAlumno = async (
  id,
  cursoId,
  motivo,
  observacion = '',
  fechaRetiro = ''
) => {
  return await fetchConAuth(`${API}/alumnos/${id}/desvincular`, {
    method: 'PUT',
    body: JSON.stringify({
      cursoId,
      motivo,
      observacion,
      fechaRetiro
    })
  });
};

export const getDocentesDirector = async (anio = 2026) => {
  return await fetchConAuth(`${API}/docentes?anio=${anio}`);
};

export const getDetalleDocenteDirector = async (id, anio = 2026) => {
  return await fetchConAuth(`${API}/docentes/${id}?anio=${anio}`);
};

export const crearDocente = async (datos) => {
  return await fetchConAuth(`${API}/docentes`, {
    method: 'POST',
    body: JSON.stringify(datos)
  });
};

export const actualizarDocente = async (id, datos) => {
  return await fetchConAuth(`${API}/docentes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });
};

export const desvincularDocente = async (
  id,
  motivo,
  observacion = '',
  fechaDesvinculacion = ''
) => {
  return await fetchConAuth(`${API}/docentes/${id}/desvincular`, {
    method: 'PUT',
    body: JSON.stringify({
      motivo,
      observacion,
      fechaDesvinculacion
    })
  });
};

export const reactivarDocente = async (id) => {
  return await fetchConAuth(`${API}/docentes/${id}/reactivar`, {
    method: 'PUT'
  });
};

export const getCursosDirector = async (anio = 2026) => {
  return await fetchConAuth(`${API}/cursos?anio=${anio}`);
};

export const getDetalleCursoDirector = async (id, anio = 2026) => {
  return await fetchConAuth(`${API}/cursos/${id}?anio=${anio}`);
};

export const getAsignaturasDirector = async () => {
  return await fetchConAuth(`${API}/asignaturas`);
};

export const getAsignacionesDirector = async (anio = 2026) => {
  return await fetchConAuth(`${API}/asignaciones?anio=${anio}`);
};

export const crearAsignacion = async (datos) => {
  return await fetchConAuth(`${API}/asignaciones`, {
    method: 'POST',
    body: JSON.stringify(datos)
  });
};

export const actualizarAsignacion = async (id, datos) => {
  return await fetchConAuth(`${API}/asignaciones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });
};

export const eliminarAsignacion = async (id) => {
  return await fetchConAuth(`${API}/asignaciones/${id}`, {
    method: 'DELETE'
  });
};

export const getAsistenciaDirector = async ({
  anio = 2026,
  cursoId = '',
  fechaInicio = '',
  fechaFin = ''
} = {}) => {
  const params = new URLSearchParams({
    anio: String(anio)
  });

  if (cursoId) params.set('cursoId', cursoId);
  if (fechaInicio) params.set('fechaInicio', fechaInicio);
  if (fechaFin) params.set('fechaFin', fechaFin);

  return await fetchConAuth(`${API}/asistencia?${params.toString()}`);
};

export const getEstadisticasAsistenciaDirector = async (anio = 2026) => {
  return await fetchConAuth(
    `${API}/asistencia/estadisticas?anio=${anio}`
  );
};

export const getRendimientoDirector = async (
  anio = 2026,
  cursoId = ''
) => {
  const params = new URLSearchParams({
    anio: String(anio)
  });

  if (cursoId) params.set('cursoId', cursoId);

  return await fetchConAuth(
    `${API}/rendimiento?${params.toString()}`
  );
};

export const getJustificativosDirector = async (
  anio = 2026,
  estado = ''
) => {
  const params = new URLSearchParams({
    anio: String(anio)
  });

  if (estado) params.set('estado', estado);

  return await fetchConAuth(
    `${API}/justificativos?${params.toString()}`
  );
};

export const actualizarJustificativo = async (
  id,
  estado,
  observacion = ''
) => {
  return await fetchConAuth(`${API}/justificativos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      estado,
      observacion
    })
  });
};

export const getHorariosDirector = async (
  anio = 2026,
  cursoId = ''
) => {
  const params = new URLSearchParams({
    anio: String(anio)
  });

  if (cursoId) params.set('cursoId', cursoId);

  return await fetchConAuth(
    `${API}/horarios?${params.toString()}`
  );
};

export const getAnotacionesDirector = async (anio = 2026) => {
  return await fetchConAuth(
    `${API}/anotaciones?anio=${anio}`
  );
};

export const getPersonal = getDocentesDirector;

export const registrarFuncionario = crearDocente;

export const desvincularFuncionario = desvincularDocente;

export const getRetirosPorAnioDirector = async (anio = 2026) =>
  fetchConAuth(`${API}/estadisticas/retiros-por-anio?anio=${anio}`);

export const getAtrasosPorDiaDirector = async (anio = 2026) =>
  fetchConAuth(`${API}/estadisticas/atrasos-por-dia?anio=${anio}`);

export const getRiesgoAcademicoDirector = async (anio = 2026) =>
  fetchConAuth(`${API}/estadisticas/riesgo-academico?anio=${anio}`);

export const getMatriculasAnioDirector = async (anio = 2027) =>
  fetchConAuth(`${API}/matriculas-anio?anio=${anio}`);