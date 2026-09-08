import React, { useState, useEffect } from 'react';
import logoColegio from "../img/logo_institucional.png";
import fondoColegio from "../img/home_fondo.jpeg";
import { mockData } from "../mockData";
import "./apoderado_dashboard.css";

function ApoderadoDashboard({ apoderadoId = 5 }) {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [tab, setTab] = useState('notas');

  const [motivo, setMotivo] = useState('');
  const [archivo, setArchivo] = useState(null);

  useEffect(() => {
    const misHijos = mockData.alumnos.filter(a => a.apoderadoId === apoderadoId);
    setAlumnos(misHijos);
  }, [apoderadoId]);

  const backgroundStyle = {
    backgroundImage: `
      linear-gradient(
        rgba(0, 0, 0, 0.52),
        rgba(0, 0, 0, 0.52)
      ),
      url(${fondoColegio})
    `,
  };

  const handleSubirJustificativo = (e) => {
    e.preventDefault();
    alert("Justificativo enviado exitosamente.");
    setMotivo('');
    setArchivo(null);
  };

  return (
    <main className="apoderado-page" style={backgroundStyle}>
      <section className="apoderado-card">
        <header className="apoderado-header">
          <img
            className="apoderado-header__logo"
            src={logoColegio}
            alt="Colegio Orden de San Jorge"
          />
          <h1 className="apoderado-header__title">
            Portal del Apoderado
          </h1>
          <div className="apoderado-header__divider" />
        </header>

        {!alumnoSeleccionado ? (
          <div>
            <p style={{ textAlign: 'center', color: '#555', marginBottom: '20px' }}>
              Seleccione el estudiante para ver su información académica y de asistencia:
            </p>
            <div className="alumnos-grid">
              {alumnos.map((alumno) => (
                <div
                  key={alumno.id}
                  className="alumno-card"
                  onClick={() => setAlumnoSeleccionado(alumno)}
                >
                  <h3 className="alumno-card__nombre">{alumno.nombre} {alumno.apellido}</h3>
                  <p className="alumno-card__info"><strong>Curso:</strong> {alumno.curso}</p>
                  <p className="alumno-card__info"><strong>RUT:</strong> {alumno.rut}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button className="btn-back-link" onClick={() => setAlumnoSeleccionado(null)}>
              ← Volver a la lista de alumnos
            </button>

            <h2 style={{ margin: '0 0 16px 0', color: '#1a1a1a' }}>
              {alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido} - <small style={{ color: '#666' }}>{alumnoSeleccionado.curso}</small>
            </h2>

            {alumnoSeleccionado.riesgoRepitencia && (
              <div className="alert-repitencia">
                <strong>Alerta Académica / Asistencia:</strong>
                {alumnoSeleccionado.riesgoRepitencia}
              </div>
            )}

            <nav className="tabs-navigation">
              <button className={`tab-btn ${tab === 'notas' ? 'active' : ''}`} onClick={() => setTab('notas')}>Notas y Asignaturas</button>
              <button className={`tab-btn ${tab === 'anotaciones' ? 'active' : ''}`} onClick={() => setTab('anotaciones')}>Anotaciones</button>
              <button className={`tab-btn ${tab === 'asistencia' ? 'active' : ''}`} onClick={() => setTab('asistencia')}>Asistencia</button>
              <button className={`tab-btn ${tab === 'justificativo' ? 'active' : ''}`} onClick={() => setTab('justificativo')}>Subir Justificativo</button>
              <button className={`tab-btn ${tab === 'qr' ? 'active' : ''}`} onClick={() => setTab('qr')}>Generar QR Retiro</button>
              <button className={`tab-btn ${tab === 'certificados' ? 'active' : ''}`} onClick={() => setTab('certificados')}>Certificados</button>
              <button className={`tab-btn ${tab === 'comunicaciones' ? 'active' : ''}`} onClick={() => setTab('comunicaciones')}>Comunicaciones</button>
              <button className={`tab-btn ${tab === 'pie' ? 'active' : ''}`} onClick={() => setTab('pie')}>Apoyo (PIE)</button>
            </nav>

            <div className="tab-content">
              {tab === 'notas' && (
                <div>
                  <button className="btn-action" style={{ marginBottom: '16px' }} onClick={() => alert("Descargando PDF...")}>
                    Descargar Notas Anuales (PDF)
                  </button>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Asignatura</th>
                        <th>Notas del Semestre</th>
                        <th>Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnoSeleccionado.asignaturas.map((a, i) => (
                        <tr key={i}>
                          <td>{a.nombre}</td>
                          <td>{a.notas ? a.notas.join(' - ') : '-'}</td>
                          <td><strong>{a.promedio}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'anotaciones' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Asignatura</th>
                      <th>Tipo</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnoSeleccionado.anotaciones.map((a, i) => (
                      <tr key={i}>
                        <td>{a.fecha}</td>
                        <td>{a.asignatura}</td>
                        <td>{a.tipo}</td>
                        <td>{a.detalle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tab === 'asistencia' && (
                <div>
                  <p style={{ fontSize: '15px', marginBottom: '12px' }}>
                    <strong>Porcentaje de Asistencia Anual:</strong> {alumnoSeleccionado.asistenciaPorcentaje}%
                  </p>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnoSeleccionado.asistencia.map((a, i) => (
                        <tr key={i}>
                          <td>{a.fecha}</td>
                          <td style={{ textTransform: 'capitalize' }}>{a.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'justificativo' && (
                <form className="form-justificativo" onSubmit={handleSubirJustificativo}>
                  <div className="form-group">
                    <label>Motivo de la inasistencia:</label>
                    <textarea
                      className="form-input"
                      rows="4"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Adjuntar documento / certificado:</label>
                    <input
                      type="file"
                      className="form-input"
                      onChange={(e) => setArchivo(e.target.files[0])}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-action">Enviar Justificativo</button>
                </form>
              )}

              {tab === 'qr' && (
                <div className="qr-container">
                  <h3 style={{ margin: 0, color: '#1a1a1a' }}>Código de Retiro</h3>
                  <div className="qr-code-box">
                    QR-{alumnoSeleccionado.rut}
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                    Presente este código en portería al momento de retirar al alumno.
                  </p>
                </div>
              )}

              {tab === 'certificados' && (
                <div>
                  <h3 style={{ marginTop: 0 }}>Descarga de Certificados Oficiales</h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn-action" onClick={() => alert("Descargando Certificado de Alumno Regular...")}>
                      Certificado Alumno Regular
                    </button>
                    <button className="btn-action" onClick={() => alert("Descargando Certificado de Matrícula...")}>
                      Certificado de Matrícula
                    </button>
                  </div>
                </div>
              )}

              {tab === 'comunicaciones' && (
                <div>
                  {alumnoSeleccionado.comunicaciones.length > 0 ? (
                    alumnoSeleccionado.comunicaciones.map((c, i) => (
                      <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <h4 style={{ margin: '0 0 4px 0', color: '#8b151b' }}>{c.titulo} ({c.tipo})</h4>
                        <small style={{ color: '#666' }}>De: {c.remitente} - {c.fecha}</small>
                        <p style={{ margin: '8px 0 0 0', color: '#374151' }}>{c.contenido}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#666' }}>No hay comunicaciones registradas.</p>
                  )}
                </div>
              )}

              {tab === 'pie' && (
                <div>
                  <h3 style={{ marginTop: 0 }}>Atención de Apoyo (PIE / Psicóloga / Psicopedagoga)</h3>
                  {alumnoSeleccionado.pie ? (
                    <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                      <p><strong>Atención Psicóloga:</strong> {alumnoSeleccionado.pie.psicologa ? "Sí" : "No"}</p>
                      <p><strong>Atención Psicopedagoga:</strong> {alumnoSeleccionado.pie.psicopedagoga ? "Sí" : "No"}</p>
                      <p><strong>Observaciones:</strong> {alumnoSeleccionado.pie.observaciones}</p>
                    </div>
                  ) : (
                    <p style={{ color: '#666' }}>El estudiante no registra atenciones con el equipo psicopedagógico.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default ApoderadoDashboard;