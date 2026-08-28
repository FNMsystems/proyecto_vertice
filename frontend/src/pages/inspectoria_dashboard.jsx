import React, { useState, useEffect } from 'react';
import { getAlumnos } from '../services/alumnoService.js';
import { logoutService, getUsuarioActual } from '../services/authService.js';

export default function InspectoriaDashboard() {
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
        <h1>Panel de Inspectoría General</h1>
        <div className="user-info">
          <span>Inspector: <strong>{usuario?.nombre || 'Inspector General'}</strong></span>
          <button onClick={logoutService} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="section-card">
          <h2>Control de Asistencia y Conducta</h2>
          {cargando ? <p>Cargando alumnos...</p> : (
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>RUT</th>
                  <th>Curso</th>
                  <th>Asistencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map(a => (
                  <tr key={a.id}>
                    <td>{`${a.nombres} ${a.apellido_paterno}`}</td>
                    <td>{a.rut}</td>
                    <td>{a.curso_nombre || 'N/A'}</td>
                    <td>{a.porcentaje_asistencia}%</td>
                    <td><span className="tag tag-activo">{a.estado}</span></td>
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