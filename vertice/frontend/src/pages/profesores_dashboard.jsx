import React, { useState, useEffect } from 'react';
import { getAlumnos } from '../services/alumnoService.js';
import { logoutService, getUsuarioActual } from '../services/authService.js';
import logoColegio from "../img/logo_institucional.png";
import fondoInstitucional from "../img/fondo_institucional.jpeg";
import "./profesores_dashboard.css";

export default function ProfesoresDashboard() {
  const usuario = getUsuarioActual();
  const [alumnosList, setAlumnosList] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const data = await getAlumnos();
      setAlumnosList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ backgroundImage: `url(${fondoInstitucional})` }}>
      <header className="dashboard-header">
        <img src={logoColegio} alt="Logo Colegio" className="logo-header" />
        <h1>Panel de Docentes - Colegio Orden de San Jorge</h1>
        <div className="user-info">
          <span>Profesor: <strong>{usuario?.nombre || 'Docente'}</strong></span>
          <button onClick={logoutService} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="section-card">
          <h2>Lista de Alumnos Matriculados</h2>
          {cargando ? (
            <p>Cargando información desde PostgreSQL...</p>
          ) : error ? (
            <p className="error-msg">Error: {error}</p>
          ) : (
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>Curso</th>
                  <th>Promedio</th>
                  <th>% Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {alumnosList.map((alum) => (
                  <tr key={alum.id}>
                    <td>{alum.rut}</td>
                    <td>{alum.nombres}</td>
                    <td>{`${alum.apellido_paterno} ${alum.apellido_materno || ''}`}</td>
                    <td>{alum.curso_nombre || 'Sin Curso'}</td>
                    <td>{alum.promedio_general || 'N/A'}</td>
                    <td>{alum.porcentaje_asistencia ? `${alum.porcentaje_asistencia}%` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}