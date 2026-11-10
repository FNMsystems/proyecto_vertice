import { fetchConAuth } from "./apiService.js";

export const getCursosSecretaria = () =>
  fetchConAuth("/api/secretaria/cursos");

export const getAlumnosPorCursoSecretaria = (cursoId) =>
  fetchConAuth(
    `/api/secretaria/cursos/${encodeURIComponent(cursoId)}/alumnos`
  );

export const registrarAtrasoSecretaria = (datos) =>
  fetchConAuth("/api/secretaria/atrasos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

export const getRetiroPorIdSecretaria = (id) =>
  fetchConAuth(
    `/api/secretaria/validar-qr/${encodeURIComponent(id)}`
  );

export const getRetirosSecretaria = () =>
  fetchConAuth("/api/secretaria/retiros-recientes");

export const getEstudiantesSecretaria = () =>
  fetchConAuth("/api/secretaria/estudiantes");

export const getJustificativosSecretaria = () =>
  fetchConAuth("/api/secretaria/justificativos");

export const cambiarEstadoJustificativoSecretaria = (
  id,
  estado
) =>
  fetchConAuth(
    `/api/secretaria/justificativos/${encodeURIComponent(id)}/estado`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado }),
    }
  );

export const registrarMatriculaSecretaria = (datos) =>
  fetchConAuth("/api/secretaria/matriculas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });