import React, { useState, useEffect } from 'react';
import { logoutService, getUsuarioActual } from '../services/authService.js';
import { supabase } from '../supabaseClient.js';

export default function SecretariaDashboard() {
  const usuario = getUsuarioActual();
  const [retirosDelDia, setRetirosDelDia] = useState([]);
  const [cargandoRetiros, setCargandoRetiros] = useState(true);


  const [codigoQrInput, setCodigoQrInput] = useState('');
  const [busquedaResultado, setBusquedaResultado] = useState(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarHistorialRetiros();
  }, []);


  const cargarHistorialRetiros = async () => {
    setCargandoRetiros(true);
    try {
      const { data, error } = await supabase
        .from('retiros_qr')
        .select(`
          id_retiro,
          codigo_qr,
          estado,
          fecha_retiro,
          hora_retiro,
          estudiantes ( nombre, apellido, rut ),
          usuarios ( nombre, apellido ),
          personas_autorizadas_retiro ( nombre, apellido, parentesco )
        `)
        .order('fecha_retiro', { ascending: false });

      if (!error) {
        setRetirosDelDia(data || []);
      }
    } catch (err) {
      console.error("Error al cargar retiros:", err);
    } finally {
      setCargandoRetiros(false);
    }
  };


  const handleBuscarQR = async (e) => {
    e.preventDefault();
    if (!codigoQrInput.trim()) return;

    setMensaje('');
    setBusquedaResultado(null);

    const { data, error } = await supabase
      .from('retiros_qr')
      .select(`
        id_retiro,
        codigo_qr,
        estado,
        fecha_retiro,
        hora_retiro,
        estudiantes ( nombre, apellido, rut ),
        usuarios ( nombre, apellido, rut, telefono ),
        personas_autorizadas_retiro ( nombre, apellido, rut, parentesco, telefono )
      `)
      .eq('codigo_qr', codigoQrInput.trim())
      .single();

    if (error || !data) {
      setMensaje('No se encontró ningún registro con ese código QR.');
    } else {
      setBusquedaResultado(data);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Portal de Secretaría</h1>
        <div className="user-info">
          <span>Secretario/a: <strong>{usuario?.nombre || 'Secretaría'}</strong></span>
          <button onClick={logoutService} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* --- CONSULTA RÁPIDA DE CÓDIGO QR --- */}
        <section className="section-card" style={{ marginBottom: '20px' }}>
          <h2>Consulta de Pase de Retiro por QR</h2>
          <form onSubmit={handleBuscarQR} style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
            <input 
              type="text" 
              placeholder="Buscar por código QR..." 
              value={codigoQrInput}
              onChange={(e) => setCodigoQrInput(e.target.value)}
              style={{ flex: 1, padding: '8px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 15px' }}>Consultar</button>
          </form>

          {mensaje && <p style={{ color: 'red' }}>{mensaje}</p>}

          {busquedaResultado && (
            <div style={{ padding: '10px', border: '1px solid #17a2b8', borderRadius: '5px', backgroundColor: '#e9f7ef' }}>
              <h4>Pase Encontrado: {busquedaResultado.codigo_qr}</h4>
              <p><strong>Estudiante:</strong> {busquedaResultado.estudiantes?.nombre} {busquedaResultado.estudiantes?.apellido} (RUT: {busquedaResultado.estudiantes?.rut})</p>
              <p><strong>Retira:</strong> {
                busquedaResultado.personas_autorizadas_retiro 
                  ? `${busquedaResultado.personas_autorizadas_retiro.nombre} ${busquedaResultado.personas_autorizadas_retiro.apellido} (${busquedaResultado.personas_autorizadas_retiro.parentesco})` 
                  : `${busquedaResultado.usuarios?.nombre} ${busquedaResultado.usuarios?.apellido} (Apoderado Titular)`
              }</p>
              <p><strong>Estado:</strong> <strong>{busquedaResultado.estado}</strong></p>
            </div>
          )}
        </section>

        {/* --- HISTORIAL Y REGISTRO DE RETIROS --- */}
        <section className="section-card">
          <h2>Registro General de Retiros</h2>
          {cargandoRetiros ? (
            <p>Cargando registros de retiros...</p>
          ) : (
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Código QR</th>
                  <th>Estudiante</th>
                  <th>Quién Retira</th>
                  <th>Fecha / Hora</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {retirosDelDia.map((r) => (
                  <tr key={r.id_retiro}>
                    <td><code>{r.codigo_qr}</code></td>
                    <td>{r.estudiantes?.nombre} {r.estudiantes?.apellido}</td>
                    <td>
                      {r.personas_autorizadas_retiro 
                        ? `${r.personas_autorizadas_retiro.nombre} ${r.personas_autorizadas_retiro.apellido} (${r.personas_autorizadas_retiro.parentesco})`
                        : `${r.usuarios?.nombre} ${r.usuarios?.apellido} (Apoderado)`
                      }
                    </td>
                    <td>{r.fecha_retiro} {r.hora_retiro}</td>
                    <td>
                      <span className={`tag ${r.estado === 'Validado' ? 'tag-activo' : 'tag-pendiente'}`}>
                        {r.estado}
                      </span>
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