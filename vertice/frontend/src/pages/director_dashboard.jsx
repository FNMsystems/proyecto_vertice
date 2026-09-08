import React, { useState, useEffect } from 'react';
import { getPersonal, desvincularFuncionario, registrarFuncionario } from '../services/directorService.js';
import { logoutService, getUsuarioActual } from '../services/authService.js';
import './director_dashboard.css';

export default function DirectorDashboard() {
  const usuario = getUsuarioActual();
  const [personal, setPersonal] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [nuevoFuncionario, setNuevoFuncionario] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'DOCENTE',
    rut: '',
    telefono: '',
    tituloProfesional: '',
  });

  useEffect(() => {
    cargarPersonal();
  }, []);

  const cargarPersonal = async () => {
    try {
      setCargando(true);
      const data = await getPersonal();
      setPersonal(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleDesvincular = async (id) => {
    const motivo = prompt('Ingrese el motivo de desvinculación:');
    if (!motivo) return;

    try {
      await desvincularFuncionario(id, motivo);
      alert('Funcionario desvinculado con éxito');
      cargarPersonal(); 
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCrearFuncionario = async (e) => {
    e.preventDefault();
    try {
      await registrarFuncionario(nuevoFuncionario);
      alert('Funcionario registrado correctamente');
      setNuevoFuncionario({
        nombre: '',
        email: '',
        password: '',
        rol: 'DOCENTE',
        rut: '',
        telefono: '',
        tituloProfesional: '',
      });
      cargarPersonal();
    } catch (err) {
      alert(`Error al registrar: ${err.message}`);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Panel de Dirección - Colegio Orden de San Jorge</h1>
        <div className="user-info">
          <span>Bienvenido, <strong>{usuario?.nombre || 'Director'}</strong></span>
          <button onClick={logoutService} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      {cargando ? (
        <p className="loading-txt">Cargando información de la base de datos...</p>
      ) : error ? (
        <p className="error-msg">Error: {error}</p>
      ) : (
        <main className="dashboard-content">
          <section className="section-card">
            <h2>Personal Activo del Establecimiento</h2>
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>RUT</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Título</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {personal.map((func) => (
                  <tr key={func.personal_id || func.id}>
                    <td>{func.nombre}</td>
                    <td>{func.rut}</td>
                    <td>{func.email}</td>
                    <td><span className={`tag tag-${func.rol ? func.rol.toLowerCase() : 'default'}`}>{func.rol}</span></td>
                    <td>{func.titulo_profesional || 'N/A'}</td>
                    <td>
                      <button 
                        onClick={() => handleDesvincular(func.personal_id || func.id)} 
                        className="btn-danger"
                      >
                        Desvincular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="section-card">
            <h2>Registrar Nuevo Funcionario</h2>
            <form onSubmit={handleCrearFuncionario} className="form-grid">
              <input 
                type="text" 
                placeholder="Nombre Completo" 
                value={nuevoFuncionario.nombre} 
                onChange={(e) => setNuevoFuncionario({...nuevoFuncionario, nombre: e.target.value})}
                required 
              />
              <input 
                type="email" 
                placeholder="Correo Electrónico" 
                value={nuevoFuncionario.email} 
                onChange={(e) => setNuevoFuncionario({...nuevoFuncionario, email: e.target.value})}
                required 
              />
              <input 
                type="password" 
                placeholder="Contraseña Inicial" 
                value={nuevoFuncionario.password} 
                onChange={(e) => setNuevoFuncionario({...nuevoFuncionario, password: e.target.value})}
                required 
              />
              <input 
                type="text" 
                placeholder="RUT (ej: 12.345.678-9)" 
                value={nuevoFuncionario.rut} 
                onChange={(e) => setNuevoFuncionario({...nuevoFuncionario, rut: e.target.value})}
                required 
              />
              <input 
                type="text" 
                placeholder="Teléfono" 
                value={nuevoFuncionario.telefono} 
                onChange={(e) => setNuevoFuncionario({...nuevoFuncionario, telefono: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Título Profesional" 
                value={nuevoFuncionario.tituloProfesional} 
                onChange={(e) => setNuevoFuncionario({...nuevoFuncionario, tituloProfesional: e.target.value})}
              />
              <select 
                value={nuevoFuncionario.rol} 
                onChange={(e) => setNuevoFuncionario({...nuevoFuncionario, rol: e.target.value})}
              >
                <option value="DOCENTE">Docente</option>
                <option value="INSPECTOR_GENERAL">Inspector General</option>
                <option value="UTP">UTP</option>
                <option value="PSICOLOGO">Psicólogo/a</option>
                <option value="PSICOPEDAGOGO">Psicopedagogo/a</option>
                <option value="PARVULARIA">Parvularia</option>
                <option value="SECRETARIA">Secretaria</option>
              </select>
              <button type="submit" className="btn-primary">Registrar Funcionario</button>
            </form>
          </section>
        </main>
      )}
    </div>
  );
}