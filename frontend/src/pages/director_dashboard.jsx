import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoColegio from '../img/logo_institucional.png';
import fondoInstitucional from '../img/fondo_institucional.jpeg';
import './director_dashboard.css';

function DirectorDashboard() {
  const navigate = useNavigate();
  const [moduloActivo, setModuloActivo] = useState(null);

  const handleCerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  const backgroundStyle = {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${fondoInstitucional})`
  };

  return (
    <div className="director-container" style={backgroundStyle}>
      {/* Header Institucional */}
      <header className="director-header">
        <div className="header-left">
          <img src={logoColegio} alt="Logo Colegio Orden de San Jorge" className="header-logo" />
          <div className="header-titles">
            <h1>COLEGIO ORDEN DE SAN JORGE</h1>
            <h2>VISTA GENERAL DEL DIRECTOR</h2>
          </div>
        </div>
        <button onClick={handleCerrarSesion} className="btn-logout">
          Cerrar Sesión
        </button>
      </header>

      {/* Grid de 6 Tarjetas (Basado en la imagen de referencia) */}
      <main className="director-main">
        <div className="modules-grid">
          
          {/* Módulo 1: Cursos y Libro Digital */}
          <div className="module-card" onClick={() => setModuloActivo('cursos')}>
            <span className="module-icon">🏫</span>
            <h3>GESTIÓN DE CURSOS<br/><small>(KINDER A 4TO MEDIO)</small></h3>
          </div>

          {/* Módulo 2: Docentes */}
          <div className="module-card" onClick={() => setModuloActivo('docentes')}>
            <span className="module-icon">👩‍🏫</span>
            <h3>PLANTEL DOCENTE</h3>
          </div>

          {/* Módulo 3: Planificación y Notas */}
          <div className="module-card" onClick={() => setModuloActivo('curriculo')}>
            <span className="module-icon">📖</span>
            <h3>PLANIFICACIÓN ACADÉMICA Y CURRÍCULO</h3>
          </div>

          {/* Módulo 4: Infraestructura y Recursos */}
          <div className="module-card" onClick={() => setModuloActivo('infraestructura')}>
            <span className="module-icon">🏫</span>
            <h3>INFRAESTRUCTURA Y RECURSOS</h3>
          </div>

          {/* Módulo 5: Estudiantes y Apoderados */}
          <div className="module-card" onClick={() => setModuloActivo('comunidad')}>
            <span className="module-icon">🤝</span>
            <h3>COMUNIDAD ESCOLAR Y PADRES</h3>
          </div>

          {/* Módulo 6: Reportes */}
          <div className="module-card" onClick={() => setModuloActivo('reportes')}>
            <span className="module-icon">📊</span>
            <h3>REPORTES Y EVALUACIÓN INSTITUCIONAL</h3>
          </div>

        </div>

        {/* Panel Detallado Dinámico según la tarjeta seleccionada */}
        {moduloActivo && (
          <div className="detail-panel">
            <div className="detail-header">
              <h3>Detalles del Módulo Seleccionado</h3>
              <button onClick={() => setModuloActivo(null)}>❌ Cerrar</button>
            </div>

            {moduloActivo === 'cursos' && (
              <div className="detail-content">
                <h4>Libro de Asistencia Digital de la Institución</h4>
                <p>Monitoreo diario de asistencia (Presencial / Ausente / Atrasos) de todos los cursos.</p>
                <ul>
                  <li>Verificabilidad de asistencia por curso y asignatura.</li>
                  <li>Justificativos médicos y solicitudes de permiso.</li>
                </ul>
              </div>
            )}

            {moduloActivo === 'docentes' && (
              <div className="detail-content">
                <h4>Gestión Integral del Plantel Docente</h4>
                <ul>
                  <li><strong>Ficha Laboral:</strong> Fecha de contratación, horario de trabajo, contratos.</li>
                  <li><strong>Asignación de Cursos:</strong> Otorgar o quitar permisos para ver/editar cursos y jefaturas.</li>
                  <li><strong>Supervisión:</strong> Clases impartidas y carga horaria asignada.</li>
                </ul>
              </div>
            )}

            {moduloActivo === 'comunidad' && (
              <div className="detail-content">
                <h4>Expediente del Alumno y Entorno Familiar</h4>
                <ul>
                  <li><strong>Ficha de Matrícula:</strong> Años de permanencia en el colegio.</li>
                  <li><strong>Vínculo Familiar:</strong> Con quién vive el alumno, datos del apoderado titular y suplente.</li>
                  <li><strong>Hoja de Vida:</strong> Anotaciones positivas, hoja de convivencia escolar y citaciones.</li>
                </ul>
              </div>
            )}

            {moduloActivo === 'curriculo' && (
              <div className="detail-content">
                <h4>Edición Directa de Notas y Cobertura Curricular</h4>
                <ul>
                  <li>Edición y rectificación de calificaciones puestas por los docentes.</li>
                  <li>Revisión de avances en las planificaciones del Ministerio.</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DirectorDashboard;