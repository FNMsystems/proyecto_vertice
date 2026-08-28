import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoColegio from '../img/logo_institucional.png';
import fondoInstitucional from '../img/fondo_institucional.jpeg';
import { alumnos } from '../../../backend/src/models/mockData.js';
import './profesores_dashboard.css';

function ProfesoresDashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cursosConsolidados, setCursosConsolidados] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('asistencia');

  useEffect(() => {
    const usuarioSesion = JSON.parse(localStorage.getItem('usuario'));

    if (!usuarioSesion) {
      navigate('/funcionarios');
      return;
    }

    setUsuario(usuarioSesion);

    fetch(`http://localhost:3000/api/asistencia/vista/${usuarioSesion.id}`)
      .then((res) => res.json())
      .then((data) => {
        const jefaturas = data.misCursosJefe || [];
        const asignaturas = data.misAsignaturas || [];

        // Consolidación de cursos para evitar duplicados
        const mapaCursos = new Map();

        jefaturas.forEach((jef) => {
          mapaCursos.set(Number(jef.id), {
            id: Number(jef.id),
            nombre: jef.nombre,
            esJefatura: true,
            asignaturas: []
          });
        });

        asignaturas.forEach((asig) => {
          const cId = Number(asig.cursoId);
          if (mapaCursos.has(cId)) {
            mapaCursos.get(cId).asignaturas.push(asig.asignatura);
          } else {
            mapaCursos.set(cId, {
              id: cId,
              nombre: asig.nombreCurso,
              esJefatura: false,
              asignaturas: [asig.asignatura]
            });
          }
        });

        const listaCursos = Array.from(mapaCursos.values());
        setCursosConsolidados(listaCursos);

        if (listaCursos.length > 0) {
          setCursoSeleccionado(listaCursos[0]);
        }
      })
      .catch((err) => console.error(err));
  }, [navigate]);

  const handleCerrarSesion = () => {
    localStorage.removeItem('usuario');
    navigate('/funcionarios');
  };

  const seleccionarCurso = (curso) => {
    setCursoSeleccionado(curso);
    if (!curso.esJefatura && seccionActiva === 'repitencia') {
      setSeccionActiva('asistencia');
    }
  };

  const backgroundStyle = {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.88)), url(${fondoInstitucional})`
  };

  const alumnosDelCurso = alumnos.filter(
    (a) => Number(a.cursoId) === Number(cursoSeleccionado?.id)
  );

  const modulosDisponibles = [
    { key: 'asistencia', label: '📋 Asistencia' },
    { key: 'calificaciones', label: '📊 Calificaciones' },
    { key: 'anotaciones', label: '📝 Anotaciones' },
    { key: 'leccionario', label: '📖 Leccionario' }
  ];

  if (cursoSeleccionado?.esJefatura) {
    modulosDisponibles.push({ key: 'repitencia', label: '⚠️ Riesgo Repitencia' });
  }

  return (
    <div className="teacher-container" style={backgroundStyle}>
      <header className="teacher-header">
        <div className="header-left">
          <img src={logoColegio} alt="Logo Colegio" className="header-logo" />
          <div className="header-titles">
            <h1>PANEL DOCENTE</h1>
            <p className="teacher-name">{usuario?.nombre || 'Profesor'}</p>
          </div>
        </div>
        <button onClick={handleCerrarSesion} className="btn-logout-teacher">
           Cerrar Sesión
        </button>
      </header>

      <main className="teacher-layout" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
        <aside className="sidebar-menu" style={{ width: '280px', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#800000', marginBottom: '10px' }}>📚 MIS CURSOS</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {cursosConsolidados.map((curso) => (
              <button
                key={`curso-${curso.id}`}
                onClick={() => seleccionarCurso(curso)}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: curso.esJefatura ? '1px solid #800000' : '1px solid #ccc',
                  background: cursoSeleccionado?.id === curso.id ? (curso.esJefatura ? '#800000' : '#4a4a4a') : '#fff',
                  color: cursoSeleccionado?.id === curso.id ? '#fff' : '#333',
                  fontWeight: curso.esJefatura ? 'bold' : 'normal',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div>
                  {curso.esJefatura ? '👤 ' : '📖 '}
                  {curso.nombre}
                  {curso.esJefatura && <small style={{ marginLeft: '5px' }}>(Jefatura)</small>}
                </div>
                {curso.asignaturas.length > 0 && (
                  <small style={{ display: 'block', fontSize: '0.8em', opacity: 0.8, marginTop: '2px' }}>
                    {curso.asignaturas.join(', ')}
                  </small>
                )}
              </button>
            ))}
          </div>

          <hr />

          <h3 style={{ color: '#800000', marginTop: '15px', marginBottom: '10px' }}>⚙️ MÓDULOS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {modulosDisponibles.map((mod) => (
              <button
                key={mod.key}
                onClick={() => setSeccionActiva(mod.key)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: seccionActiva === mod.key ? '#e0e0e0' : 'transparent',
                  fontWeight: seccionActiva === mod.key ? 'bold' : 'normal',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: mod.key === 'repitencia' ? '#c0392b' : '#333'
                }}
              >
                {mod.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="dashboard-content" style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {cursoSeleccionado ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #800000', paddingBottom: '10px' }}>
                <h2>CURSO: {cursoSeleccionado.nombre}</h2>
                {cursoSeleccionado.esJefatura ? (
                  <span style={{ background: '#800000', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em' }}>
                    Profesor Jefe
                  </span>
                ) : (
                  <span style={{ background: '#666', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em' }}>
                    Asignatura Impartida
                  </span>
                )}
              </div>

              <div style={{ marginTop: '20px' }}>
                {seccionActiva === 'repitencia' && cursoSeleccionado.esJefatura && (
                  <div>
                    <h3 style={{ color: '#c0392b' }}>📊 Diagnóstico de Posibilidad de Repitencia (Exclusivo Jefatura)</h3>
                    <p style={{ fontSize: '0.9em', color: '#666' }}>
                      Alumnos destacados en <strong>rojo</strong> poseen un promedio inferior a 4.0 o asistencia menor al 85%.
                    </p>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                      <thead>
                        <tr style={{ background: '#f2f2f2', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Estudiante</th>
                          <th style={{ padding: '8px' }}>Promedio General</th>
                          <th style={{ padding: '8px' }}>Asistencia</th>
                          <th style={{ padding: '8px' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnosDelCurso.map((alumno) => {
                          const enRiesgo = alumno.promedio < 4.0 || alumno.asistencia < 85;
                          return (
                            <tr
                              key={alumno.id}
                              style={{
                                background: enRiesgo ? '#ffdddd' : 'transparent',
                                color: enRiesgo ? '#900' : '#333',
                                fontWeight: enRiesgo ? 'bold' : 'normal',
                                borderBottom: '1px solid #eee'
                              }}
                            >
                              <td style={{ padding: '10px' }}>{alumno.nombre}</td>
                              <td style={{ padding: '10px' }}>{alumno.promedio}</td>
                              <td style={{ padding: '10px' }}>{alumno.asistencia}%</td>
                              <td style={{ padding: '10px' }}>
                                {enRiesgo ? '⚠️ RIESGO DE REPITENCIA' : '✅ REGULAR'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {seccionActiva === 'asistencia' && (
                  <div>
                    <h3>📋 Registro de Asistencia</h3>
                    <ul style={{ marginTop: '10px', listStyle: 'none', padding: 0 }}>
                      {alumnosDelCurso.map((a) => (
                        <li key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                          <span>{a.nombre}</span>
                          <input type="checkbox" defaultChecked={a.asistencia >= 85} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {['calificaciones', 'anotaciones', 'leccionario'].includes(seccionActiva) && (
                  <div>
                    <h3 style={{ textTransform: 'capitalize' }}>{seccionActiva} - {cursoSeleccionado.nombre}</h3>
                    <p style={{ marginTop: '10px', color: '#666' }}>
                      Módulo disponible para edición y consulta.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p>Seleccione un curso del menú lateral.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default ProfesoresDashboard;