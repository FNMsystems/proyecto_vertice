import { fetchConAuth } from "./apiService.js";

export const getCursosSecretaria = () =>
  fetchConAuth("/secretaria/cursos");


export const getAlumnosPorCursoSecretaria = (cursoId) =>
  fetchConAuth(
    `/secretaria/cursos/${encodeURIComponent(cursoId)}/alumnos`
  );


export const registrarAtrasoSecretaria = (datos) =>
  fetchConAuth("/secretaria/atrasos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });


export const getRetiroPorIdSecretaria = (id) =>
  fetchConAuth(
    `/secretaria/validar-qr/${encodeURIComponent(id)}`
  );


export const getRetirosSecretaria = () =>
  fetchConAuth("/secretaria/retiros-recientes");


export const getEstudiantesSecretaria = () =>
  fetchConAuth("/secretaria/estudiantes");


export const getJustificativosSecretaria = () =>
  fetchConAuth("/secretaria/justificativos");


export const cambiarEstadoJustificativoSecretaria = (
  id,
  estado
) =>
  fetchConAuth(
    `/secretaria/justificativos/${encodeURIComponent(id)}/estado`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado }),
    }
  );


export const registrarMatriculaSecretaria = (datos) =>
  fetchConAuth("/secretaria/matriculas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });