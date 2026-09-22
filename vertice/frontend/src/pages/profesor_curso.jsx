import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  obtenerCursoDocente
} from '../services/docenteService.js';

import {
  logoutService
} from '../services/authService.js';

import './profesor_curso.css';

export default function ProfesorCurso() {

  const navigate = useNavigate();
  const { cursoId } = useParams();

  const [curso, setCurso] = useState(null);
  const [asignaturas, setAsignaturas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarCurso();
  }, [cursoId]);

  const cargarCurso = async () => {

    try {

      setCargando(true);
      setError(null);

      const data =
        await obtenerCursoDocente(cursoId);

      setCurso(data.curso);
      setAsignaturas(data.asignaturas || []);
      setAlumnos(data.alumnos || []);

    } catch (error) {

      console.error(
        'Error cargando curso:',
        error
      );

      setError(
        error.message ||
        'No se pudo cargar el curso.'
      );

    } finally {

      setCargando(false);

    }
  };

  const volver = () => {
    navigate('/profesores_dashboard');
  };

  const cerrarSesion = () => {
    logoutService();
    navigate('/');
  };

  if (cargando) {
    return (
      <div className="profesor-curso-container">
        <div className="profesor-curso-card">
          <h2>Cargando curso...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profesor-curso-container">
        <div className="profesor-curso-card">

          <h2>No se pudo cargar el curso</h2>

          <p>{error}</p>

          <button onClick={volver}>
            Volver a mis cursos
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="profesor-curso-container">

      <header className="profesor-curso-header">

        <div>
          <h1>{curso?.nombre}</h1>

          <p>
            Panel del curso
          </p>
        </div>

        <div className="profesor-curso-actions">

          <button onClick={volver}>
            ← Mis cursos
          </button>

          <button onClick={cerrarSesion}>
            Cerrar sesión
          </button>

        </div>

      </header>


      <main className="profesor-curso-content">

        <section className="curso-info-card">

          <h2>
            {curso?.nombre}
          </h2>

          {curso?.esProfesorJefe && (
            <span className="badge-jefe">
              Profesor Jefe
            </span>
          )}

          <p>
            Alumnos: <strong>{alumnos.length}</strong>
          </p>

        </section>


        <section className="curso-info-card">

          <h2>
            Mis asignaturas
          </h2>

          <div className="asignaturas-list">

            {asignaturas.map((asignatura) => (

              <div
                key={asignatura.id}
                className="asignatura-item"
              >

                <strong>
                  {asignatura.nombre}
                </strong>

                {asignatura.codigo && (
                  <span>
                    {asignatura.codigo}
                  </span>
                )}

              </div>

            ))}

          </div>

        </section>


        <section className="curso-info-card">

          <div className="alumnos-header">

            <div>
              <h2>
                Alumnos
              </h2>

              <p>
                Estudiantes matriculados en este curso.
              </p>
            </div>

            <strong>
              {alumnos.length}
            </strong>

          </div>


          {alumnos.length === 0 ? (

            <div className="empty-alumnos">
              No hay alumnos matriculados en este curso.
            </div>

          ) : (

            <div className="alumnos-table-wrapper">

              <table className="alumnos-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Alumno</th>
                    <th>RUT</th>
                  </tr>
                </thead>

                <tbody>

                  {alumnos.map((alumno, index) => (

                    <tr key={alumno.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {alumno.nombre}
                      </td>

                      <td>
                        {alumno.rut || '-'}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}