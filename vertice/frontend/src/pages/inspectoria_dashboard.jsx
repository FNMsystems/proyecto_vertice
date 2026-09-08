import React, { useState, useEffect } from 'react';
import './inspectoria_dashboard.css';
import { mockData } from '../mockData';

const InspectoriaDashboard = () => {
  const [tab, setTab] = useState('escaneo');
  const [codigoQR, setCodigoQR] = useState('');
  const [datosRetiro, setDatosRetiro] = useState(null);
  const [mensajeError, setMensajeError] = useState('');
  
  const [alumnos, setAlumnos] = useState([]);
  const [cursoFiltro, setCursoFiltro] = useState('Todos');

  useEffect(() => {
    if (tab === 'atrasos') {
      setAlumnos(mockData.alumnos);
    }
  }, [tab]);

  const handleEscaneoQR = (e) => {
    e.preventDefault();
    setMensajeError('');
    setDatosRetiro(null);

    const encontrado = mockData.retirosQR.find(r => r.codigoQR === codigoQR.trim());

    if (encontrado) {
      setDatosRetiro(encontrado);
    } else {
      setMensajeError('Código QR no válido o no encontrado para hoy (Prueba con: QR-23.456.789-1)');
    }
  };

  const handleConfirmarRetiro = () => {
    alert('Retiro confirmado y registrado exitosamente');
    setDatosRetiro({ ...datosRetiro, estado: 'retirado' });
  };

  const handleRegistrarAtraso = (alumnoId) => {
    alert(`Atraso registrado correctamente para el alumno ID ${alumnoId}`);
  };

  const cursosDisponibles = ['Todos', ...new Set(alumnos.map(a => a.curso).filter(Boolean))];

  const alumnosFiltrados = cursoFiltro === 'Todos' 
    ? alumnos 
    : alumnos.filter(a => a.curso === cursoFiltro);

  return (
    <div className="inspectoria-container">
      <header className="inspectoria-header">
        <h1>Módulo de Inspectoría</h1>
      </header>

      <main className="inspectoria-main">
        <div className="tabs-inspectoria">
          <button 
            className={`tab-insp-btn ${tab === 'escaneo' ? 'active' : ''}`} 
            onClick={() => setTab('escaneo')}
          >
            Escanear QR Retiro
          </button>
          <button 
            className={`tab-insp-btn ${tab === 'atrasos' ? 'active' : ''}`} 
            onClick={() => setTab('atrasos')}
          >
            Control de Atrasos
          </button>
        </div>

        {tab === 'escaneo' && (
          <div className="panel-card">
            <h2>Validación de Retiro de Estudiantes</h2>
            <p><small>Código de prueba disponible: <strong>QR-23.456.789-1</strong></small></p>
            <form onSubmit={handleEscaneoQR}>
              <input 
                type="text" 
                className="input-qr" 
                placeholder="Escanee o ingrese código QR..." 
                value={codigoQR}
                onChange={(e) => setCodigoQR(e.target.value)}
                autoFocus
                required
              />
              <br />
              <button type="submit" className="btn-inspectoria">Validar Código</button>
            </form>

            {mensajeError && (
              <p style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '15px' }}>{mensajeError}</p>
            )}

            {datosRetiro && (
              <div className="datos-retiro-box">
                <h3>Información del Retiro</h3>
                <p><strong>Alumno:</strong> {datosRetiro.alumno_nombre} {datosRetiro.alumno_apellido}</p>
                <p><strong>Curso:</strong> {datosRetiro.curso}</p>
                <hr style={{ borderColor: '#d32f2f' }} />
                <p><strong>Apoderado que retira:</strong> {datosRetiro.apoderado_nombre} {datosRetiro.apoderado_apellido}</p>
                <p><strong>RUT Apoderado:</strong> {datosRetiro.apoderado_rut}</p>
                <p><strong>Teléfono Contacto:</strong> {datosRetiro.telefono}</p>
                <p><strong>Estado:</strong> {datosRetiro.estado}</p>
                
                {datosRetiro.estado !== 'retirado' ? (
                  <button className="btn-inspectoria" style={{ marginTop: '10px' }} onClick={handleConfirmarRetiro}>
                    Autorizar y Confirmar Retiro
                  </button>
                ) : (
                  <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>Este alumno ya fue retirado previamente.</p>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'atrasos' && (
          <div className="panel-card">
            <h2>Registro de Atrasos</h2>
            
            <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Filtrar por Curso:</label>
            <select 
              className="select-curso" 
              value={cursoFiltro} 
              onChange={(e) => setCursoFiltro(e.target.value)}
            >
              {cursosDisponibles.map((curso, idx) => (
                <option key={idx} value={curso}>{curso}</option>
              ))}
            </select>

            <table className="tabla-inspectoria">
              <thead>
                <tr>
                  <th>Nombre Completo Estudiante</th>
                  <th>Curso</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {alumnosFiltrados.map((alumno) => (
                  <tr key={alumno.id}>
                    <td>{alumno.nombre} {alumno.apellido}</td>
                    <td>{alumno.curso}</td>
                    <td>
                      <button 
                        className="btn-atraso" 
                        onClick={() => handleRegistrarAtraso(alumno.id)}
                      >
                        Registrar Atraso
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default InspectoriaDashboard;