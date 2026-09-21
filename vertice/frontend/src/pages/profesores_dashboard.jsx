import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  logoutService,
  getUsuarioActual
} from '../services/authService.js';

import {
  obtenerMiDashboardDocente
} from '../services/docenteService.js';

import logoColegio from '../img/logo_institucional.png';
import fondoInstitucional from '../img/fondo_institucional.jpeg';

import './profesores_dashboard.css';


export default function ProfesoresDashboard() {

  const navigate = useNavigate();

  const usuario = getUsuarioActual();

  const [docente, setDocente] = useState(null);
  const [cursos, setCursos] = useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState(null);


  useEffect(() => {

    cargarDashboard();

  }, []);


  const cargarDashboard = async () => {

    try {

      setCargando(true);
      setError(null);

      const data =
        await obtenerMiDashboardDocente();

      setDocente(data.docente);
      setCursos(data.cursos || []);

    } catch (error) {

      console.error(
        'Error cargando dashboard:',
        error
      );

      setError(
        error.message ||
        'No se pudo cargar la información.'
      );

    } finally {

      setCargando(false);
    }
  };


  const handleLogout = () => {

    logoutService();

    navigate('/');
  };


  const nombreDocente =
    docente
      ? [
          docente.nombres,
          docente.apellido_paterno,
          docente.apellido_materno
        ]
          .filter(Boolean)
          .join(' ')
      : usuario?.nombre || 'Docente';


  if (cargando) {

    return (
      <div
        className="dashboard-container"
        style={{
          backgroundImage:
            `url(${fondoInstitucional})`
        }}
      >
        <div className="loading-container">
          <h2>
            Cargando información del docente...
          </h2>
        </div>
      </div>
    );
  }


  return (
    <div
      className="dashboard-container"
      style={{
        backgroundImage:
          `url(${fondoInstitucional})`
      }}
    >

      <header className="dashboard-header">

        <img
          src={logoColegio}
          alt="Logo Colegio"
          className="logo-header"
        />


        <div className="header-title">

          <h1>
            Panel de Docentes
          </h1>

          <span>
            Colegio Orden de San Jorge
          </span>

        </div>


        <div className="user-info">

          <span>
            Profesor:{' '}
            <strong>
              {nombreDocente}
            </strong>
          </span>

          <button
            onClick={handleLogout}
            className="btn-logout"
          >
            Cerrar Sesión
          </button>

        </div>

      </header>


      <main className="dashboard-content">

        {error && (

          <div className="error-card">

            <h3>
              No se pudo cargar la información
            </h3>

            <p>
              {error}
            </p>

            <button
              onClick={cargarDashboard}
              className="btn-reintentar"
            >
              Reintentar
            </button>

          </div>

        )}


        {!error && (

          <>

            <section className="welcome-card">

              <div>

                <h2>
                  Bienvenido, {nombreDocente}
                </h2>

                {docente?.especialidad && (
                  <p>
                    Especialidad:{' '}
                    {docente.especialidad}
                  </p>
                )}

              </div>

            </section>


            <section className="section-card">

              <div className="section-title">

                <div>

                  <h2>
                    Mis cursos
                  </h2>

                  <p>
                    Cursos y asignaturas que tienes
                    asignados.
                  </p>

                </div>

                <span className="course-count">
                  {cursos.length}{' '}
                  {cursos.length === 1
                    ? 'curso'
                    : 'cursos'}
                </span>

              </div>


              {cursos.length === 0 ? (

                <div className="empty-state">

                  <h3>
                    No tienes cursos asignados
                  </h3>

                  <p>
                    No existen asignaturas
                    asociadas a tu usuario
                    para el año actual.
                  </p>

                </div>

              ) : (

                <div className="cursos-grid">

                  {cursos.map((curso) => (

                    <article
                      key={curso.id}
                      className={
                        `curso-card ${
                          curso.esProfesorJefe
                            ? 'curso-jefatura'
                            : ''
                        }`
                      }
                    >

                      <div className="curso-card-header">

                        <div>

                          <h3>
                            {curso.nombre}
                          </h3>

                          {curso.esProfesorJefe && (

                            <span className="badge-jefe">
                              ⭐ Profesor jefe
                            </span>

                          )}

                        </div>

                      </div>


                      <div className="asignaturas-container">

                        <h4>
                          Asignaturas
                        </h4>


                        <div className="asignaturas-list">

                          {curso.asignaturas.map(
                            (asignatura) => (

                              <div
                                key={
                                  asignatura.id
                                }
                                className="asignatura-item"
                              >

                                <span>
                                  {asignatura.nombre}
                                </span>

                                <span className="badge-edicion">
                                  Puede gestionar
                                </span>

                              </div>

                            )
                          )}

                        </div>

                      </div>


                      <button
                        className="btn-ingresar-curso"
                        onClick={() =>
                          navigate(
                            `/profesores_dashboard/curso/${curso.id}`
                          )
                        }
                      >
                        Ingresar al curso
                      </button>

                    </article>

                  ))}

                </div>

              )}

            </section>

          </>

        )}

      </main>

    </div>
  );
}