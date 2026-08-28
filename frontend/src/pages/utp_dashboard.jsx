import React, { useState, useEffect } from 'react';
import { getAlumnos } from '../services/alumnoService.js';
import { logoutService, getUsuarioActual } from '../services/authService.js';

export default function UtpDashboard() {
  const usuario = getUsuarioActual();
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getAlumnos()
      .then(data => setAlumnos(data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Unidad Técnico Pedagógica (UTP)</h1>
        <div className="user-info">
          <span>Jefe UTP: <strong>{usuario?.nombre || 'UTP'}</strong></span>
          <button onClick={logoutService} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="section-card">
          <h2>Rendimiento Académico General</h2>
          {cargando ? <p>Cargando datos pedagógicos...</p> : (
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Curso</th>
                  <th>Promedio General</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map(a => (
                  <tr key={a.id}>
                    <td>{`${a.nombres} ${a.apellido_paterno}`}</td>
                    <td>{a.curso_nombre || 'N/A'}</td>
                    <td><strong>{a.promedio_general || 'N/A'}</strong></td>
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