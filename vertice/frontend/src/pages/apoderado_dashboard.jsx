import React, { useState, useEffect } from 'react';
import './apoderado_dashboard.css';
import { mockData } from '../mockData';

const ApoderadoDashboard = ({ apoderadoId = 5 }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [tab, setTab] = useState('notas');
  
  const [motivo, setMotivo] = useState('');
  const [archivo, setArchivo] = useState(null);

  useEffect(() => {
    // Carga de alumnos en local sin backend
    const misHijos = mockData.alumnos.filter(a => a.apoderadoId === apoderadoId);
    setAlumnos(misHijos);
  }, [apoderadoId]);

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setCargando(true);
    
    // Simula tiempo de respuesta
    setTimeout(() => {
      setDetalle(alumno);
      setCargando(false);
    }, 200);
  };

  const handleSubmitJustificativo = (e) => {
    e.preventDefault();
    alert("Justificativo enviado exitosamente (Modo Prueba)");
    setMotivo('');
    setArchivo(null);
  };

  return (
    <div className="apoderado-container">
      <header className="apoderado-header">
        <h1>Panel del Apoderado</h1>
      </header>

      <main className="apoderado-main">
        {!alumnoSeleccionado ? (
          <div>
            <h2>Alumnos Asociados</h2>
            <div className="alumnos-grid">
              {alumnos.map((alumno) => (
                <div 
                  key={alumno.id} 
                  className="alumno-card"
                  onClick={() => seleccionarAlumno(alumno)}
                >
                  <h3>{alumno.nombre} {alumno.apellido}</h3>
                  <p><strong>Curso:</strong> {alumno.curso}</p>
                  <p><strong>RUT:</strong> {alumno.rut}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button className="btn-volver" onClick={() => setAlumnoSeleccionado(null)}>
              ← Volver a Alumnos
            </button>

            <h2>{alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}</h2>

            {detalle && detalle.riesgoRepitencia && (
              <div className="alert-repitencia">
                <strong>Alerta Académica / Asistencia:</strong>
                <p>{detalle.riesgoRepitencia}</p>
              </div>
            )}

            <div className="tabs-header">
              <button className={`tab-button ${tab === 'notas' ? 'active' : ''}`} onClick={() => setTab('notas')}>Notas y Asignaturas</button>
              <button className={`tab-button ${tab === 'anotaciones' ? 'active' : ''}`} onClick={() => setTab('anotaciones')}>Anotaciones</button>
              <button className={`tab-button ${tab === 'asistencia' ? 'active' : ''}`} onClick={() => setTab('asistencia')}>Asistencia</button>
              <button className={`tab-button ${tab === 'justificativo' ? 'active' : ''}`} onClick={() => setTab('justificativo')}>Subir Justificativo</button>
              <button className={`tab-button ${tab === 'qr' ? 'active' : ''}`} onClick={() => setTab('qr')}>Generar QR Retiro</button>
              <button className={`tab-button ${tab === 'certificados' ? 'active' : ''}`} onClick={() => setTab('certificados')}>Certificados</button>
              <button className={`tab-button ${tab === 'comunicaciones' ? 'active' : ''}`} onClick={() => setTab('comunicaciones')}>Comunicaciones</button>
              <button className={`tab-button ${tab === 'pie' ? 'active' : ''}`} onClick={() => setTab('pie')}>Atención Psicóloga/Psicopedagoga</button>
            </div>

            <div className="tab-body">
              {cargando ? (
                <p>Cargando información del estudiante...</p>
              ) : detalle && (
                <>
                  {tab === 'notas' && (
                    <div>
                      <button className="btn-rojo" onClick={() => alert("Descargando PDF de notas...")}>
                        Descargar Notas Anuales (PDF)
                      </button>
                      <table className="tabla-custom">
                        <thead>
                          <tr>
                            <th>Asignatura</th>
                            <th>Notas del Semestre</th>
                            <th>Promedio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalle.asignaturas.map((a, i) => (
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
                    <table className="tabla-custom">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Asignatura</th>
                          <th>Tipo</th>
                          <th>Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.anotaciones.map((a, i) => (
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
                      <p><strong>Porcentaje de Asistencia Anual:</strong> {detalle.asistenciaPorcentaje}%</p>
                      <table className="tabla-custom">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalle.asistencia.map((a, i) => (
                            <tr key={i}>
                              <td>{a.fecha}</td>
                              <td>{a.estado}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {tab === 'justificativo' && (
                    <form onSubmit={handleSubmitJustificativo}>
                      <label>Motivo de la inasistencia:</label>
                      <textarea 
                        className="input-field" 
                        rows="4" 
                        value={motivo} 
                        onChange={(e) => setMotivo(e.target.value)} 
                        required 
                      />
                      <label>Adjuntar documento / certificado:</label>
                      <input 
                        type="file" 
                        className="input-field" 
                        onChange={(e) => setArchivo(e.target.files[0])} 
                        required 
                      />
                      <button type="submit" className="btn-rojo">Enviar Justificativo</button>
                    </form>
                  )}

                  {tab === 'qr' && (
                    <div className="qr-container">
                      <h3>Código de Retiro</h3>
                      <div className="qr-box">QR-{alumnoSeleccionado.rut}</div>
                      <p>Presente este código en portería para retirar al alumno.</p>
                    </div>
                  )}

                  {tab === 'certificados' && (
                    <div>
                      <h3>Descarga de Documentos</h3>
                      <button className="btn-rojo" style={{marginRight: '10px'}} onClick={() => alert("Descargando Certificado de Alumno Regular...")}>
                        Certificado Alumno Regular
                      </button>
                      <button className="btn-rojo" onClick={() => alert("Descargando Certificado de Matrícula...")}>
                        Certificado de Matrícula
                      </button>
                    </div>
                  )}

                  {tab === 'comunicaciones' && (
                    <div>
                      {detalle.comunicaciones.length > 0 ? detalle.comunicaciones.map((c, i) => (
                        <div key={i} style={{marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px'}}>
                          <h4>{c.titulo} ({c.tipo})</h4>
                          <p><small>De: {c.remitente} - {c.fecha}</small></p>
                          <p>{c.contenido}</p>
                        </div>
                      )) : <p>No hay comunicaciones registradas.</p>}
                    </div>
                  )}

                  {tab === 'pie' && (
                    <div>
                      <h3>Atención de Apoyo (PIE)</h3>
                      {detalle.pie ? (
                        <div>
                          <p><strong>Atención Psicóloga:</strong> {detalle.pie.psicologa ? "Sí" : "No"}</p>
                          <p><strong>Atención Psicopedagoga:</strong> {detalle.pie.psicopedagoga ? "Sí" : "No"}</p>
                          <p><strong>Observaciones:</strong> {detalle.pie.observaciones}</p>
                        </div>
                      ) : (
                        <p>El estudiante no registra atenciones con el equipo de psicóloga o psicopedagoga.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ApoderadoDashboard;