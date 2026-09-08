import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockData } from '../mockData.js';
import { logoutService, getUsuarioActual } from '../services/authService.js';
import logoColegio from "../img/logo_institucional.png";
import fondoInstitucional from "../img/fondo_institucional.jpeg";
import "./inspectoria_dashboard.css"; 

export default function InspectoriaDashboard() {
  const navigate = useNavigate();
  const usuario = getUsuarioActual();
  const [alumnosList, setAlumnosList] = useState([]);
  const [retirosList, setRetirosList] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Carga de alumnos y retiros desde mockData.js
    if (mockData) {
      setAlumnosList(mockData.alumnos || []);
      setRetirosList(mockData.retirosQR || []);
    }
    setCargando(false);
  }, []);

  const handleLogout = () => {
    logoutService();
    navigate('/');
  };

  const procesarRetiro = (codigoQR) => {
    setRetirosList((prev) =>
      prev.map((r) =>
        r.codigoQR === codigoQR ? { ...r, estado: 'completado' } : r
      )
    );
  };

  return (
    <div className="dashboard-container" style={{ backgroundImage: `url(${fondoInstitucional})` }}>
      <header className="dashboard-header">
        <img src={logoColegio} alt="Logo Colegio" className="logo-header" />
        <h1>Panel de Inspectoría - Colegio Orden de San Jorge</h1>
        <div className="user-info">
          <span>Inspector: <strong>{usuario?.nombre || 'Juan Pérez'}</strong></span>
          <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* SECCIÓN DE SOLICITUDES DE RETIRO QR */}
        <section className="section-card" style={{ marginBottom: '20px' }}>
          <h2>Solicitudes de Retiro de Alumnos (Código QR)</h2>
          {cargando ? (
            <p>Cargando registros...</p>
          ) : retirosList.length === 0 ? (
            <p>No hay solicitudes de retiro pendientes.</p>
          ) : (
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Código QR</th>
                  <th>Alumno</th>
                  <th>Curso</th>
                  <th>Apoderado</th>
                  <th>RUT Apoderado</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {retirosList.map((ret, idx) => (
                  <tr key={idx}>
                    <td><code>{ret.codigoQR}</code></td>
                    <td>{`${ret.alumno_nombre} ${ret.alumno_apellido}`}</td>
                    <td>{ret.curso}</td>
                    <td>{`${ret.apoderado_nombre} ${ret.apoderado_apellido}`}</td>
                    <td>{ret.apoderado_rut}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        backgroundColor: ret.estado === 'pendiente' ? '#fff3cd' : '#d4edda',
                        color: ret.estado === 'pendiente' ? '#856404' : '#155724'
                      }}>
                        {ret.estado.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {ret.estado === 'pendiente' ? (
                        <button
                          onClick={() => procesarRetiro(ret.codigoQR)}
                          style={{
                            backgroundColor: '#800000',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Autorizar Retiro
                        </button>
                      ) : (
                        <span style={{ color: 'gray' }}>Autorizado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* SECCIÓN DE ASISTENCIA GENERAL DE ALUMNOS */}
        <section className="section-card">
          <h2>Control de Asistencia General</h2>
          {cargando ? (
            <p>Cargando información...</p>
          ) : (
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Alumno</th>
                  <th>Curso</th>
                  <th>% Asistencia</th>
                  <th>Estado / Alerta</th>
                </tr>
              </thead>
              <tbody>
                {alumnosList.map((alum) => (
                  <tr key={alum.id}>
                    <td>{alum.rut}</td>
                    <td>{`${alum.nombre} ${alum.apellido}`}</td>
                    <td>{alum.curso}</td>
                    <td>{alum.asistenciaPorcentaje}%</td>
                    <td>
                      {alum.asistenciaPorcentaje < 85 ? (
                        <span style={{ color: 'red', fontWeight: 'bold' }}>
                          ⚠️ Riesgo por asistencia baja
                        </span>
                      ) : (
                        <span style={{ color: 'green' }}>Normal</span>
                      )}
                    </td>
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