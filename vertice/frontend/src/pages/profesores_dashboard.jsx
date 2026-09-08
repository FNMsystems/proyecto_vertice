import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockData } from '../mockData.js';
import { logoutService, getUsuarioActual } from '../services/authService.js';
import logoColegio from "../img/logo_institucional.png";
import fondoInstitucional from "../img/fondo_institucional.jpeg";
import "./profesores_dashboard.css";

export default function ProfesoresDashboard() {
  const navigate = useNavigate();
  const usuario = getUsuarioActual();
  const [alumnosList, setAlumnosList] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Carga directa desde mockData.js
    if (mockData && mockData.alumnos) {
      setAlumnosList(mockData.alumnos);
    }
    setCargando(false);
  }, []);

  const handleLogout = () => {
    logoutService();
    navigate('/');
  };

  // Función para calcular el promedio general del alumno basado en sus asignaturas
  const calcularPromedioGeneral = (asignaturas) => {
    if (!asignaturas || asignaturas.length === 0) return 'N/A';
    const promedios = asignaturas
      .map((a) => parseFloat(a.promedio))
      .filter((p) => !isNaN(p));
    if (promedios.length === 0) return 'N/A';
    const suma = promedios.reduce((acc, curr) => acc + curr, 0);
    return (suma / promedios.length).toFixed(1);
  };

  return (
    <div className="dashboard-container" style={{ backgroundImage: `url(${fondoInstitucional})` }}>
      <header className="dashboard-header">
        <img src={logoColegio} alt="Logo Colegio" className="logo-header" />
        <h1>Panel de Docentes - Colegio Orden de San Jorge</h1>
        <div className="user-info">
          <span>Profesor: <strong>{usuario?.nombre || 'Docente'}</strong></span>
          <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="section-card">
          <h2>Lista de Alumnos Matriculados</h2>
          {cargando ? (
            <p>Cargando información de alumnos...</p>
          ) : (
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Curso</th>
                  <th>Promedio General</th>
                  <th>% Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {alumnosList.map((alum) => (
                  <tr key={alum.id}>
                    <td>{alum.rut}</td>
                    <td>{alum.nombre}</td>
                    <td>{alum.apellido}</td>
                    <td>{alum.curso}</td>
                    <td>{calcularPromedioGeneral(alum.asignaturas)}</td>
                    <td>{alum.asistenciaPorcentaje ? `${alum.asistenciaPorcentaje}%` : 'N/A'}</td>
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