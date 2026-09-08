import React, { useState, useEffect } from 'react';
import { getAlumnos } from '../services/alumnoService.js';
import { logoutService, getUsuarioActual } from '../services/authService.js';
import { supabase } from '../supabaseClient.js'; 

export default function InspectoriaDashboard() {
  const usuario = getUsuarioActual();
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);


  const [codigoQrInput, setCodigoQrInput] = useState('');
  const [datosRetiro, setDatosRetiro] = useState(null);
  const [mensajeRetiro, setMensajeRetiro] = useState({ tipo: '', texto: '' });
  const [buscandoQr, setBuscandoQr] = useState(false);

  useEffect(() => {
    getAlumnos()
      .then(data => setAlumnos(data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  }, []);


  const handleBuscarQR = async (e) => {
    e.preventDefault();
    if (!codigoQrInput.trim()) return;

    setBuscandoQr(true);
    setMensajeRetiro({ tipo: '', texto: '' });
    setDatosRetiro(null);

    try {
      const { data, error } = await supabase
        .from('retiros_qr')
        .select(`
          id_retiro,
          codigo_qr,
          estado,
          fecha_retiro,
          hora_retiro,
          estudiantes ( id_estudiante, nombre, apellido, rut ),
          usuarios ( id_usuario, nombre, apellido, rut, telefono ),
          personas_autorizadas_retiro ( id_autorizado, nombre, apellido, rut, parentesco, telefono )
        `)
        .eq('codigo_qr', codigoQrInput.trim())
        .single();

      if (error || !data) {
        setMensajeRetiro({ tipo: 'error', texto: 'Código QR no encontrado o inválido.' });
      } else {
        setDatosRetiro(data);
      }
    } catch (err) {
      setMensajeRetiro({ tipo: 'error', texto: 'Error de conexión al consultar el QR.' });
    } finally {
      setBuscandoQr(false);
    }
  };


  const handleConfirmarRetiro = async () => {
    if (!datosRetiro) return;

    if (datosRetiro.estado === 'Validado') {
      alert('Este pase ya fue utilizado previamente.');
      return;
    }

    try {
      const { error } = await supabase
        .from('retiros_qr')
        .update({ estado: 'Validado' })
        .eq('id_retiro', datosRetiro.id_retiro);

      if (error) throw error;

      setMensajeRetiro({ tipo: 'exito', texto: '¡Salida del estudiante autorizada y registrada con éxito!' });
      setDatosRetiro({ ...datosRetiro, estado: 'Validado' });
    } catch (err) {
      setMensajeRetiro({ tipo: 'error', texto: 'No se pudo actualizar el estado: ' + err.message });
    }
  };

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
        {/* --- SECCIÓN 1: VALIDACIÓN DE RETIROS CON CÓDIGO QR --- */}
        <section className="section-card" style={{ marginBottom: '25px', borderLeft: '4px solid #0070f3' }}>
          <h2>Validación y Escaneo de Pases de Retiro (QR)</h2>
          
          <form onSubmit={handleBuscarQR} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <input 
              type="text" 
              placeholder="Ingrese o escanee el código QR (ej: QR-ABC123XYZ)..." 
              value={codigoQrInput}
              onChange={(e) => setCodigoQrInput(e.target.value)}
              style={{ flex: 1, padding: '10px', fontSize: '16px' }}
            />
            <button type="submit" disabled={buscandoQr} className="btn-primary" style={{ padding: '10px 20px', cursor: 'pointer' }}>
              {buscandoQr ? 'Consultando...' : 'Buscar Pase'}
            </button>
          </form>

          {/* Mensajes de Resultado */}
          {mensajeRetiro.texto && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: mensajeRetiro.tipo === 'exito' ? '#d4edda' : '#f8d7da', 
              color: mensajeRetiro.tipo === 'exito' ? '#155724' : '#721c24',
              borderRadius: '4px' 
            }}>
              {mensajeRetiro.texto}
            </div>
          )}

          {/* Ficha Detallada del Retiro Encontrado */}
          {datosRetiro && (
            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fafafa' }}>
              <h3>Detalles del Pase de Retiro</h3>
              <p><strong>Estudiante:</strong> {datosRetiro.estudiantes?.nombre} {datosRetiro.estudiantes?.apellido} (RUT: {datosRetiro.estudiantes?.rut})</p>
              
              <hr style={{ margin: '10px 0' }} />

              <p><strong>Persona Autorizada a Retirar:</strong></p>
              {datosRetiro.personas_autorizadas_retiro ? (
                <ul>
                  <li><strong>Nombre:</strong> {datosRetiro.personas_autorizadas_retiro.nombre} {datosRetiro.personas_autorizadas_retiro.apellido}</li>
                  <li><strong>RUT:</strong> {datosRetiro.personas_autorizadas_retiro.rut}</li>
                  <li><strong>Relación:</strong> {datosRetiro.personas_autorizadas_retiro.parentesco}</li>
                  <li><strong>Teléfono:</strong> {datosRetiro.personas_autorizadas_retiro.telefono}</li>
                </ul>
              ) : (
                <ul>
                  <li><strong>Apoderado Titular:</strong> {datosRetiro.usuarios?.nombre} {datosRetiro.usuarios?.apellido}</li>
                  <li><strong>RUT:</strong> {datosRetiro.usuarios?.rut}</li>
                  <li><strong>Teléfono:</strong> {datosRetiro.usuarios?.telefono}</li>
                </ul>
              )}

              <p><strong>Estado Actual del Pase:</strong> 
                <span style={{ 
                  marginLeft: '8px', 
                  fontWeight: 'bold', 
                  color: datosRetiro.estado === 'Validado' ? 'green' : 'orange' 
                }}>
                  {datosRetiro.estado}
                </span>
              </p>

              {datosRetiro.estado === 'Generado' && (
                <button 
                  onClick={handleConfirmarRetiro}
                  style={{ 
                    marginTop: '15px', 
                    padding: '10px 20px', 
                    backgroundColor: '#28a745', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '4px', 
                    fontSize: '16px', 
                    cursor: 'pointer' 
                  }}
                >
                  Autorizar y Confirmar Salida
                </button>
              )}
            </div>
          )}
        </section>

        {/* --- SECCIÓN 2: CONTROL DE ASISTENCIA Y CONDUCTA --- */}
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
                  <tr key={a.id_estudiante || a.id}>
                    <td>{`${a.nombre || a.nombres} ${a.apellido || a.apellido_paterno}`}</td>
                    <td>{a.rut}</td>
                    <td>{a.curso_nombre || 'N/A'}</td>
                    <td>{a.porcentaje_asistencia || 100}%</td>
                    <td><span className="tag tag-activo">{a.estado || 'Activo'}</span></td>
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