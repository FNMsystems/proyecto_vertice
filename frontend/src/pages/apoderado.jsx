import React, { useState, useEffect } from 'react';
import { getAlumnos } from '../services/alumnoService.js';
import { logoutService, getUsuarioActual } from '../services/authService.js';

export default function ApoderadoPage() {
  const usuario = getUsuarioActual();
  const [alumnos, setAlumnos] = useState([]);

  useEffect(() => {
    getAlumnos().then(data => setAlumnos(data)).catch(err => console.error(err));
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Portal del Apoderado</h1>
        <div className="user-info">
          <span>Apoderado: <strong>{usuario?.nombre || 'Apoderado'}</strong></span>
          <button onClick={logoutService} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="section-card">
          <h2>Ficha del Estudiante Acompañado</h2>
          {alumnos.length > 0 ? (
            <div>
              <p><strong>Estudiante:</strong> {alumnos[0].nombres} {alumnos[0].apellido_paterno}</p>
              <p><strong>RUT:</strong> {alumnos[0].rut}</p>
              <p><strong>Curso:</strong> {alumnos[0].curso_nombre || 'En asignación'}</p>
              <p><strong>Asistencia:</strong> {alumnos[0].porcentaje_asistencia}%</p>
            </div>
          ) : (
            <p>Cargando información del estudiante...</p>
          )}
        </section>
      </main>
    </div>
  );
}
