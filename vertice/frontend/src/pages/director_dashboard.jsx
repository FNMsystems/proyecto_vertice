import React, { useEffect, useMemo, useState } from 'react';
import {
  getResumenDirector,
  getAlumnosDirector,
  getDetalleAlumnoDirector,
  getDocentesDirector,
  getDetalleDocenteDirector,
  crearDocente,
  actualizarDocente,
  desvincularDocente,
  reactivarDocente,
  getCursosDirector,
  getDetalleCursoDirector,
  getAsignaturasDirector,
  getAsignacionesDirector,
  crearAsignacion,
  actualizarAsignacion,
  eliminarAsignacion,
  getEstadisticasAsistenciaDirector,
  getRendimientoDirector,
  getJustificativosDirector,
  actualizarJustificativo,
  getHorariosDirector,
  getAnotacionesDirector,
  desvincularAlumno
} from '../services/directorService.js';
import { logoutService, getUsuarioActual } from '../services/authService.js';
import './director_dashboard.css';

const ANIO = 2026;

const menu = [
  { id: 'resumen', label: 'Resumen', icon: '▦' },
  { id: 'alumnos', label: 'Alumnos', icon: '👨‍🎓' },
  { id: 'docentes', label: 'Docentes', icon: '👨‍🏫' },
  { id: 'cursos', label: 'Cursos', icon: '🏫' },
  { id: 'asignaciones', label: 'Asignaciones', icon: '🔗' },
  { id: 'asistencia', label: 'Asistencia', icon: '📅' },
  { id: 'rendimiento', label: 'Rendimiento', icon: '📈' },
  { id: 'justificativos', label: 'Justificativos', icon: '📄' },
  { id: 'horarios', label: 'Horarios', icon: '🕐' },
  { id: 'anotaciones', label: 'Anotaciones', icon: '📋' }
];

const nombreCompleto = (persona) => {
  if (!persona) return '';
  return [
    persona.nombres,
    persona.apellido_paterno,
    persona.apellido_materno
  ].filter(Boolean).join(' ');
};

const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  const partes = String(fecha).split('T')[0].split('-');
  if (partes.length !== 3) return fecha;
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
};

const promedioColor = (valor) => {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return 'neutral';
  if (numero < 4) return 'danger';
  if (numero < 5) return 'warning';
  return 'success';
};

const asistenciaColor = (valor) => {
  const numero = Number(valor);

  if (numero < 80) return 'danger';
  if (numero < 90) return 'warning';
  return 'success';
};

export default function DirectorDashboard() {
  const usuario = getUsuarioActual();

  const [seccion, setSeccion] = useState('resumen');
  const [anio] = useState(ANIO);

  const [resumen, setResumen] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [estadisticasAsistencia, setEstadisticasAsistencia] = useState([]);
  const [rendimiento, setRendimiento] = useState([]);
  const [justificativos, setJustificativos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [anotaciones, setAnotaciones] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [cursoFiltro, setCursoFiltro] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [formDocente, setFormDocente] = useState({
    rut: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    telefono: '',
    especialidad: ''
  });

  const [formAsignacion, setFormAsignacion] = useState({
    docente_id: '',
    curso_id: '',
    asignatura_id: '',
    anio: ANIO,
    es_profesor_jefe: false
  });

  const cargarBase = async () => {
    setCargando(true);
    setError('');

    try {
      const [
        resumenData,
        alumnosData,
        docentesData,
        cursosData,
        asignaturasData,
        asignacionesData
      ] = await Promise.all([
        getResumenDirector(anio),
        getAlumnosDirector(anio),
        getDocentesDirector(anio),
        getCursosDirector(anio),
        getAsignaturasDirector(),
        getAsignacionesDirector(anio)
      ]);

      setResumen(resumenData);
      setAlumnos(alumnosData);
      setDocentes(docentesData);
      setCursos(cursosData);
      setAsignaturas(asignaturasData);
      setAsignaciones(asignacionesData);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información.');
    } finally {
      setCargando(false);
    }
  };

  const cargarSeccion = async (seccionActual) => {
    try {
      setError('');

      if (seccionActual === 'asistencia') {
        const data = await getEstadisticasAsistenciaDirector(anio);
        setEstadisticasAsistencia(data);
      }

      if (seccionActual === 'rendimiento') {
        const data = await getRendimientoDirector(
          anio,
          cursoFiltro || ''
        );
        setRendimiento(data);
      }

      if (seccionActual === 'justificativos') {
        const data = await getJustificativosDirector(anio);
        setJustificativos(data);
      }

      if (seccionActual === 'horarios') {
        const data = await getHorariosDirector(
          anio,
          cursoFiltro || ''
        );
        setHorarios(data);
      }

      if (seccionActual === 'anotaciones') {
        const data = await getAnotacionesDirector(anio);
        setAnotaciones(data);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información.');
    }
  };

  useEffect(() => {
    cargarBase();
  }, []);

  useEffect(() => {
    if (seccion !== 'resumen') {
      cargarSeccion(seccion);
    }
  }, [seccion, cursoFiltro]);

  const cambiarSeccion = (id) => {
    setSeccion(id);
    setBusqueda('');
  };

  const alumnosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return alumnos;

    return alumnos.filter((alumno) => {
      const contenido = [
        alumno.rut,
        alumno.nombres,
        alumno.apellido_paterno,
        alumno.apellido_materno,
        alumno.curso
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [alumnos, busqueda]);

  const docentesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return docentes;

    return docentes.filter((docente) => {
      const contenido = [
        docente.rut,
        docente.nombres,
        docente.apellido_paterno,
        docente.apellido_materno,
        docente.correo,
        docente.especialidad
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [docentes, busqueda]);

  const cursosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return cursos;

    return cursos.filter((curso) => {
      const contenido = [
        curso.nombre,
        curso.codigo_nivel,
        curso.jornada,
        curso.profesor_jefe
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [cursos, busqueda]);

  const asignacionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return asignaciones;

    return asignaciones.filter((item) => {
      const contenido = [
        item.docente,
        item.docente_rut,
        item.curso,
        item.asignatura
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return contenido.includes(texto);
    });
  }, [asignaciones, busqueda]);

  const abrirDetalleAlumno = async (id) => {
    try {
      setGuardando(true);
      const data = await getDetalleAlumnoDirector(id, anio);
      setDetalle(data);
      setModal('alumno');
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const abrirDetalleDocente = async (id) => {
    try {
      setGuardando(true);
      const data = await getDetalleDocenteDirector(id, anio);
      setDetalle(data);
      setModal('docente');
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const abrirDetalleCurso = async (id) => {
    try {
      setGuardando(true);
      const data = await getDetalleCursoDirector(id, anio);
      setDetalle(data);
      setModal('curso');
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const abrirNuevoDocente = () => {
    setFormDocente({
      rut: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      correo: '',
      telefono: '',
      especialidad: ''
    });

    setModal('nuevo-docente');
  };

  const guardarDocente = async (event) => {
    event.preventDefault();

    try {
      setGuardando(true);

      await crearDocente(formDocente);

      alert('Docente creado correctamente.');
      setModal(null);
      await cargarBase();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const editarDocente = (docente) => {
    setFormDocente({
      rut: docente.docente?.rut || docente.rut || '',
      nombres: docente.docente?.nombres || docente.nombres || '',
      apellido_paterno:
        docente.docente?.apellido_paterno ||
        docente.apellido_paterno ||
        '',
      apellido_materno:
        docente.docente?.apellido_materno ||
        docente.apellido_materno ||
        '',
      correo: docente.docente?.correo || docente.correo || '',
      telefono: docente.docente?.telefono || docente.telefono || '',
      especialidad:
        docente.docente?.especialidad ||
        docente.especialidad ||
        ''
    });

    setDetalle(docente);
    setModal('editar-docente');
  };

  const guardarEdicionDocente = async (event) => {
    event.preventDefault();

    if (!detalle?.docente?.id) return;

    try {
      setGuardando(true);

      await actualizarDocente(
        detalle.docente.id,
        formDocente
      );

      alert('Docente actualizado correctamente.');
      setModal(null);
      await cargarBase();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarDesvinculacionDocente = async (docente) => {
    const motivo = window.prompt(
      `Motivo de desvinculación de ${nombreCompleto(docente)}:`
    );

    if (!motivo) return;

    const observacion = window.prompt(
      'Observación adicional (opcional):'
    ) || '';

    try {
      setGuardando(true);

      await desvincularDocente(
        docente.id,
        motivo,
        observacion
      );

      alert('Docente desvinculado correctamente.');
      await cargarBase();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarReactivacionDocente = async (docente) => {
    if (
      !window.confirm(
        `¿Deseas reactivar a ${nombreCompleto(docente)}?`
      )
    ) {
      return;
    }

    try {
      setGuardando(true);

      await reactivarDocente(docente.id);

      alert('Docente reactivado correctamente.');
      await cargarBase();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarDesvinculacionAlumno = async (alumno) => {
    const motivo = window.prompt(
      `Motivo de retiro de ${alumno.nombres} ${alumno.apellido_paterno}:`
    );

    if (!motivo) return;

    const observacion = window.prompt(
      'Observación adicional (opcional):'
    ) || '';

    try {
      setGuardando(true);

      await desvincularAlumno(
        alumno.id,
        alumno.curso_id || null,
        motivo,
        observacion
      );

      alert('Retiro del alumno registrado correctamente.');
      await cargarBase();

      if (modal === 'alumno') {
        setModal(null);
        setDetalle(null);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const abrirNuevaAsignacion = () => {
    setFormAsignacion({
      docente_id: '',
      curso_id: '',
      asignatura_id: '',
      anio: ANIO,
      es_profesor_jefe: false
    });

    setModal('nueva-asignacion');
  };

  const guardarAsignacion = async (event) => {
    event.preventDefault();

    if (
      !formAsignacion.docente_id ||
      !formAsignacion.curso_id ||
      !formAsignacion.asignatura_id
    ) {
      alert('Selecciona docente, curso y asignatura.');
      return;
    }

    try {
      setGuardando(true);

      await crearAsignacion(formAsignacion);

      alert('Asignación creada correctamente.');
      setModal(null);
      await cargarBase();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarAsignacionConfirmada = async (id) => {
    if (
      !window.confirm(
        '¿Deseas eliminar esta asignación docente?'
      )
    ) {
      return;
    }

    try {
      setGuardando(true);

      await eliminarAsignacion(id);

      alert('Asignación eliminada correctamente.');
      await cargarBase();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoJustificativo = async (
    justificativo,
    estado
  ) => {
    try {
      const observacion =
        window.prompt(
          'Observación (opcional):',
          justificativo.observacion || ''
        ) || '';

      setGuardando(true);

      await actualizarJustificativo(
        justificativo.id,
        estado,
        observacion
      );

      setJustificativos((actuales) =>
        actuales.map((item) =>
          item.id === justificativo.id
            ? {
                ...item,
                estado,
                observacion
              }
            : item
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModal = () => {
    setModal(null);
    setDetalle(null);
  };

  const tarjetasResumen = resumen
    ? [
        {
          titulo: 'Alumnos',
          valor: resumen.alumnos,
          icono: '👨‍🎓',
          clase: 'blue'
        },
        {
          titulo: 'Docentes activos',
          valor: resumen.docentes,
          icono: '👨‍🏫',
          clase: 'green'
        },
        {
          titulo: 'Cursos',
          valor: resumen.cursos,
          icono: '🏫',
          clase: 'purple'
        },
        {
          titulo: 'Matrículas activas',
          valor: resumen.matriculas,
          icono: '📝',
          clase: 'orange'
        },
        {
          titulo: 'Asistencia',
          valor: `${resumen.asistencia?.porcentaje || 0}%`,
          icono: '📅',
          clase: asistenciaColor(
            resumen.asistencia?.porcentaje || 0
          )
        },
        {
          titulo: 'Promedio general',
          valor: resumen.notas?.promedio || 0,
          icono: '📈',
          clase: promedioColor(
            resumen.notas?.promedio || 0
          )
        },
        {
          titulo: 'Justificativos pendientes',
          valor: resumen.justificativos_pendientes,
          icono: '📄',
          clase: 'yellow'
        },
        {
          titulo: 'Atrasos',
          valor: resumen.atrasos,
          icono: '⏰',
          clase: 'red'
        }
      ]
    : [];

  return (
    <div className="director-layout">
      <aside className="director-sidebar">
        <div className="director-brand">
          <div className="director-brand-symbol">OSJ</div>
          <div>
            <strong>Orden de San Jorge</strong>
            <span>Dirección</span>
          </div>
        </div>

        <div className="director-menu-title">
          ADMINISTRACIÓN
        </div>

        <nav className="director-menu">
          {menu.map((item) => (
            <button
              key={item.id}
              className={
                seccion === item.id
                  ? 'director-menu-item active'
                  : 'director-menu-item'
              }
              onClick={() => cambiarSeccion(item.id)}
            >
              <span className="menu-icon">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="director-sidebar-bottom">
          <div className="director-year">
            <span>Año académico</span>
            <strong>{anio}</strong>
          </div>

          <button
            className="director-logout"
            onClick={logoutService}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="director-main">
        <header className="director-topbar">
          <div>
            <div className="director-breadcrumb">
              Dirección / Administración
            </div>
            <h1>
              {menu.find((item) => item.id === seccion)?.label ||
                'Dirección'}
            </h1>
          </div>

          <div className="director-user">
            <div className="director-user-avatar">
              {(usuario?.nombre || 'D').charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>
                {usuario?.nombre || 'Director'}
              </strong>
              <span>Administrador</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="director-alert error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {cargando ? (
          <div className="director-loading">
            <div className="loading-spinner"></div>
            <p>Cargando información institucional...</p>
          </div>
        ) : (
          <div className="director-content">
            {seccion === 'resumen' && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Resumen institucional</h2>
                    <p>
                      Situación general del establecimiento para el
                      año {anio}.
                    </p>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={cargarBase}
                  >
                    Actualizar información
                  </button>
                </div>

                <div className="summary-grid">
                  {tarjetasResumen.map((tarjeta) => (
                    <div
                      className={`summary-card ${tarjeta.clase}`}
                      key={tarjeta.titulo}
                    >
                      <div className="summary-icon">
                        {tarjeta.icono}
                      </div>
                      <div>
                        <span>{tarjeta.titulo}</span>
                        <strong>{tarjeta.valor}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="dashboard-columns">
                  <div className="director-card">
                    <div className="card-heading">
                      <div>
                        <h3>Asistencia institucional</h3>
                        <span>
                          Indicadores generales del año
                        </span>
                      </div>
                    </div>

                    <div className="large-stat">
                      <strong>
                        {resumen?.asistencia?.porcentaje || 0}%
                      </strong>
                      <span>Asistencia registrada</span>
                    </div>

                    <div className="mini-stat-grid">
                      <div>
                        <strong>
                          {resumen?.asistencia?.presentes || 0}
                        </strong>
                        <span>Presentes</span>
                      </div>

                      <div>
                        <strong>
                          {resumen?.asistencia?.ausentes || 0}
                        </strong>
                        <span>Ausencias</span>
                      </div>

                      <div>
                        <strong>
                          {resumen?.asistencia?.justificados || 0}
                        </strong>
                        <span>Justificadas</span>
                      </div>
                    </div>
                  </div>

                  <div className="director-card">
                    <div className="card-heading">
                      <div>
                        <h3>Situación académica</h3>
                        <span>
                          Información general de evaluaciones
                        </span>
                      </div>
                    </div>

                    <div className="academic-highlight">
                      <strong>
                        {resumen?.notas?.promedio || 0}
                      </strong>
                      <span>Promedio general</span>
                    </div>

                    <div className="dashboard-list">
                      <div>
                        <span>Evaluaciones registradas</span>
                        <strong>
                          {resumen?.notas?.total || 0}
                        </strong>
                      </div>

                      <div>
                        <span>Justificativos pendientes</span>
                        <strong>
                          {resumen?.justificativos_pendientes || 0}
                        </strong>
                      </div>

                      <div>
                        <span>Retiros registrados</span>
                        <strong>
                          {resumen?.retiros || 0}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {seccion === 'alumnos' && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Alumnos</h2>
                    <p>
                      Matrículas y situación de los estudiantes.
                    </p>
                  </div>
                </div>

                <div className="toolbar">
                  <input
                    className="search-input"
                    placeholder="Buscar por RUT, nombre o curso..."
                    value={busqueda}
                    onChange={(e) =>
                      setBusqueda(e.target.value)
                    }
                  />
                </div>

                <div className="director-card table-card">
                  <div className="table-wrapper">
                    <table className="director-table">
                      <thead>
                        <tr>
                          <th>RUT</th>
                          <th>Alumno</th>
                          <th>Curso</th>
                          <th>Jornada</th>
                          <th>Estado matrícula</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>

                      <tbody>
                        {alumnosFiltrados.map((alumno) => (
                          <tr key={alumno.id}>
                            <td>{alumno.rut}</td>
                            <td>
                              <strong>
                                {nombreCompleto(alumno)}
                              </strong>
                            </td>
                            <td>
                              {alumno.curso || 'Sin curso'}
                            </td>
                            <td>
                              {alumno.jornada || '-'}
                            </td>
                            <td>
                              <span
                                className={
                                  alumno.matricula_estado ===
                                  'ACTIVA'
                                    ? 'status active'
                                    : 'status inactive'
                                }
                              >
                                {alumno.matricula_estado ||
                                  'SIN MATRÍCULA'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-small primary"
                                  onClick={() =>
                                    abrirDetalleAlumno(
                                      alumno.id
                                    )
                                  }
                                >
                                  Ver ficha
                                </button>

                                {alumno.matricula_estado ===
                                  'ACTIVA' && (
                                  <button
                                    className="btn-small danger"
                                    onClick={() =>
                                      ejecutarDesvinculacionAlumno(
                                        alumno
                                      )
                                    }
                                  >
                                    Retirar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {alumnosFiltrados.length === 0 && (
                      <div className="empty-state">
                        No se encontraron alumnos.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {seccion === 'docentes' && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Docentes</h2>
                    <p>
                      Administración y asignaciones de los
                      profesores.
                    </p>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={abrirNuevoDocente}
                  >
                    + Nuevo docente
                  </button>
                </div>

                <div className="toolbar">
                  <input
                    className="search-input"
                    placeholder="Buscar docente, RUT, correo o especialidad..."
                    value={busqueda}
                    onChange={(e) =>
                      setBusqueda(e.target.value)
                    }
                  />
                </div>

                <div className="director-card table-card">
                  <div className="table-wrapper">
                    <table className="director-table">
                      <thead>
                        <tr>
                          <th>RUT</th>
                          <th>Docente</th>
                          <th>Especialidad</th>
                          <th>Correo</th>
                          <th>Cursos</th>
                          <th>Profesor jefe</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>

                      <tbody>
                        {docentesFiltrados.map((docente) => (
                          <tr key={docente.id}>
                            <td>{docente.rut}</td>
                            <td>
                              <strong>
                                {nombreCompleto(docente)}
                              </strong>
                            </td>
                            <td>
                              {docente.especialidad || '-'}
                            </td>
                            <td>{docente.correo || '-'}</td>
                            <td>
                              {docente.cantidad_cursos || 0}
                            </td>
                            <td>
                              {docente.cursos_como_profesor_jefe ||
                                0}
                            </td>
                            <td>
                              <span
                                className={
                                  docente.activo
                                    ? 'status active'
                                    : 'status inactive'
                                }
                              >
                                {docente.activo
                                  ? 'ACTIVO'
                                  : 'DESVINCULADO'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-small primary"
                                  onClick={() =>
                                    abrirDetalleDocente(
                                      docente.id
                                    )
                                  }
                                >
                                  Ver ficha
                                </button>

                                {docente.activo ? (
                                  <button
                                    className="btn-small danger"
                                    onClick={() =>
                                      ejecutarDesvinculacionDocente(
                                        docente
                                      )
                                    }
                                  >
                                    Desvincular
                                  </button>
                                ) : (
                                  <button
                                    className="btn-small success"
                                    onClick={() =>
                                      ejecutarReactivacionDocente(
                                        docente
                                      )
                                    }
                                  >
                                    Reactivar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {docentesFiltrados.length === 0 && (
                      <div className="empty-state">
                        No se encontraron docentes.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {seccion === 'cursos' && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Cursos</h2>
                    <p>
                      Vista general de cursos, alumnos y docentes.
                    </p>
                  </div>
                </div>

                <div className="toolbar">
                  <input
                    className="search-input"
                    placeholder="Buscar curso..."
                    value={busqueda}
                    onChange={(e) =>
                      setBusqueda(e.target.value)
                    }
                  />
                </div>

                <div className="course-grid">
                  {cursosFiltrados.map((curso) => (
                    <div
                      className="course-card"
                      key={curso.id}
                    >
                      <div className="course-card-top">
                        <span>{curso.codigo_nivel}</span>
                        <strong>{curso.nombre}</strong>
                      </div>

                      <div className="course-info">
                        <div>
                          <span>Jornada</span>
                          <strong>
                            {curso.jornada || '-'}
                          </strong>
                        </div>

                        <div>
                          <span>Alumnos</span>
                          <strong>
                            {curso.cantidad_alumnos || 0}
                          </strong>
                        </div>

                        <div>
                          <span>Docentes</span>
                          <strong>
                            {curso.cantidad_docentes || 0}
                          </strong>
                        </div>

                        <div>
                          <span>Asignaturas</span>
                          <strong>
                            {curso.cantidad_asignaturas || 0}
                          </strong>
                        </div>
                      </div>

                      <div className="homeroom">
                        <span>Profesor jefe</span>
                        <strong>
                          {curso.profesor_jefe ||
                            'No asignado'}
                        </strong>
                      </div>

                      <button
                        className="btn-card"
                        onClick={() =>
                          abrirDetalleCurso(curso.id)
                        }
                      >
                        Ver curso
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {seccion === 'asignaciones' && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Asignaciones docentes</h2>
                    <p>
                      Relación entre docentes, cursos y
                      asignaturas.
                    </p>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={abrirNuevaAsignacion}
                  >
                    + Nueva asignación
                  </button>
                </div>

                <div className="toolbar">
                  <input
                    className="search-input"
                    placeholder="Buscar docente, curso o asignatura..."
                    value={busqueda}
                    onChange={(e) =>
                      setBusqueda(e.target.value)
                    }
                  />
                </div>

                <div className="director-card table-card">
                  <div className="table-wrapper">
                    <table className="director-table">
                      <thead>
                        <tr>
                          <th>Docente</th>
                          <th>Curso</th>
                          <th>Asignatura</th>
                          <th>Profesor jefe</th>
                          <th>Año</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>

                      <tbody>
                        {asignacionesFiltradas.map((item) => (
                          <tr key={item.id}>
                            <td>{item.docente}</td>
                            <td>{item.curso}</td>
                            <td>{item.asignatura}</td>
                            <td>
                              {item.es_profesor_jefe ? (
                                <span className="badge-chief">
                                  Profesor jefe
                                </span>
                              ) : (
                                <span className="muted">
                                  No
                                </span>
                              )}
                            </td>
                            <td>{item.anio}</td>
                            <td>
                              <button
                                className="btn-small danger"
                                onClick={() =>
                                  eliminarAsignacionConfirmada(
                                    item.id
                                  )
                                }
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {seccion === 'asistencia' && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Asistencia</h2>
                    <p>
                      Indicadores de asistencia por curso.
                    </p>
                  </div>
                </div>

                <div className="course-grid">
                  {estadisticasAsistencia.map((item) => (
                    <div
                      className={`attendance-card ${asistenciaColor(
                        item.porcentaje_asistencia
                      )}`}
                      key={item.curso_id}
                    >
                      <div className="attendance-title">
                        <strong>{item.curso}</strong>
                        <span>
                          {item.porcentaje_asistencia}%
                        </span>
                      </div>

                      <div className="progress">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Number(
                                item.porcentaje_asistencia
                              )
                            )}%`
                          }}
                        />
                      </div>

                      <div className="attendance-stats">
                        <div>
                          <span>Presentes</span>
                          <strong>
                            {item.presentes}
                          </strong>
                        </div>

                        <div>
                          <span>Ausentes</span>
                          <strong>
                            {item.ausentes}
                          </strong>
                        </div>

                        <div>
                          <span>Justificadas</span>
                          <strong>
                            {item.justificados}
                          </strong>
                        </div>
                      </div>

                      <button
                        className="btn-card"
                        onClick={() => {
                          setCursoFiltro(item.curso_id);
                        }}
                      >
                        Filtrar curso
                      </button>
                    </div>
                  ))}
                </div>

                {estadisticasAsistencia.length === 0 && (
                  <div className="empty-state">
                    No hay registros de asistencia para el
                    período seleccionado.
                  </div>
                )}
              </section>
            )}

            {seccion === 'rendimiento' && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Rendimiento académico</h2>
                    <p>
                      Promedios registrados por alumno y
                      asignatura.
                    </p>
                  </div>

                  <select
                    className="filter-select"
                    value={cursoFiltro}
                    onChange={(e) =>
                      setCursoFiltro(e.target.value)
                    }
                  >
                    <option value="">
                      Todos los cursos
                    </option>

                    {cursos.map((curso) => (
                      <option
                        key={curso.id}
                        value={curso.id}
                      >
                        {curso.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="director-card table-card">
                  <div className="table-wrapper">
                    <table className="director-table">
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th>RUT</th>
                          <th>Curso</th>
                          <th>Asignatura</th>
                          <th>Notas</th>
                          <th>Promedio</th>
                        </tr>
                      </thead>

                      <tbody>
                        {rendimiento.map((item) => (
                          <tr key={`${item.alumno_id}-${item.asignatura_id}`}>
                            <td>{item.alumno}</td>
                            <td>{item.rut}</td>
                            <td>{item.curso}</td>
                            <td>{item.asignatura}</td>
                            <td>{item.cantidad_notas}</td>
                            <td>
                              <span
                                className={`grade ${promedioColor(
                                  item.promedio
                                )}`}
                              >
                                {item.promedio || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {seccion === 'justificativos' && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Justificativos</h2>
                    <p>
                      Revisión y gestión de justificativos de
                      estudiantes.
                    </p>
                  </div>
                </div>

                <div className="director-card table-card">
                  <div className="table-wrapper">
                    <table className="director-table">
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th>Curso</th>
                          <th>Desde</th>
                          <th>Hasta</th>
                          <th>Motivo</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>

                      <tbody>
                        {justificativos.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.alumno}</strong>
                              <small>{item.rut}</small>
                            </td>
                            <td>{item.curso || '-'}</td>
                            <td>
                              {formatearFecha(
                                item.fecha_inicio
                              )}
                            </td>
                            <td>
                              {formatearFecha(
                                item.fecha_fin
                              )}
                            </td>
                            <td>{item.motivo}</td>
                            <td>
                              <span className="status neutral">
                                {item.estado || 'PENDIENTE'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-small success"
                                  onClick={() =>
                                    cambiarEstadoJustificativo(
                                      item,
                                      'APROBADO'
                                    )
                                  }
                                >
                                  Aprobar
                                </button>

                                <button
                                  className="btn-small danger"
                                  onClick={() =>
                                    cambiarEstadoJustificativo(
                                      item,
                                      'RECHAZADO'
                                    )
                                  }
                                >
                                  Rechazar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {seccion === 'horarios' && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Horarios</h2>
                    <p>
                      Horarios académicos registrados por curso.
                    </p>
                  </div>

                  <select
                    className="filter-select"
                    value={cursoFiltro}
                    onChange={(e) =>
                      setCursoFiltro(e.target.value)
                    }
                  >
                    <option value="">
                      Todos los cursos
                    </option>

                    {cursos.map((curso) => (
                      <option
                        key={curso.id}
                        value={curso.id}
                      >
                        {curso.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="director-card table-card">
                  <div className="table-wrapper">
                    <table className="director-table">
                      <thead>
                        <tr>
                          <th>Curso</th>
                          <th>Día</th>
                          <th>Horario</th>
                          <th>Asignatura</th>
                          <th>Docente</th>
                        </tr>
                      </thead>

                      <tbody>
                        {horarios.map((item) => (
                          <tr key={item.id}>
                            <td>{item.curso}</td>
                            <td>
                              {[
                                '',
                                'Lunes',
                                'Martes',
                                'Miércoles',
                                'Jueves',
                                'Viernes',
                                'Sábado',
                                'Domingo'
                              ][item.dia_semana] ||
                                item.dia_semana}
                            </td>
                            <td>
                              {String(
                                item.hora_inicio
                              ).slice(0, 5)}
                              {' - '}
                              {String(
                                item.hora_fin
                              ).slice(0, 5)}
                            </td>
                            <td>{item.asignatura}</td>
                            <td>
                              {item.docente || 'Sin docente'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {seccion === 'anotaciones' && (
              <section>
                <div className="section-heading">
                  <div>
                    <h2>Anotaciones</h2>
                    <p>
                      Registro institucional de anotaciones de
                      estudiantes.
                    </p>
                  </div>
                </div>

                <div className="director-card table-card">
                  <div className="table-wrapper">
                    <table className="director-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Alumno</th>
                          <th>Curso</th>
                          <th>Tipo</th>
                          <th>Título</th>
                          <th>Docente</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>

                      <tbody>
                        {anotaciones.map((item) => (
                          <tr key={item.id}>
                            <td>
                              {formatearFecha(item.fecha)}
                            </td>
                            <td>
                              <strong>{item.alumno}</strong>
                            </td>
                            <td>{item.curso || '-'}</td>
                            <td>
                              <span className="badge-note">
                                {item.tipo || 'General'}
                              </span>
                            </td>
                            <td>{item.titulo || '-'}</td>
                            <td>{item.docente || '-'}</td>
                            <td className="description-cell">
                              {item.descripcion}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {modal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !guardando
            ) {
              cerrarModal();
            }
          }}
        >
          <div className="director-modal">
            <div className="modal-header">
              <div>
                <span>Administración</span>
                <h2>
                  {modal === 'alumno' && 'Ficha del alumno'}
                  {modal === 'docente' && 'Ficha del docente'}
                  {modal === 'curso' && 'Detalle del curso'}
                  {modal === 'nuevo-docente' &&
                    'Nuevo docente'}
                  {modal === 'editar-docente' &&
                    'Editar docente'}
                  {modal === 'nueva-asignacion' &&
                    'Nueva asignación'}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={cerrarModal}
                disabled={guardando}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {modal === 'alumno' && detalle && (
                <AlumnoModal
                  detalle={detalle}
                  onClose={cerrarModal}
                />
              )}

              {modal === 'docente' && detalle && (
                <DocenteModal
                  detalle={detalle}
                  onEditar={() => editarDocente(detalle)}
                />
              )}

              {modal === 'curso' && detalle && (
                <CursoModal detalle={detalle} />
              )}

              {(modal === 'nuevo-docente' ||
                modal === 'editar-docente') && (
                <form
                  className="modal-form"
                  onSubmit={
                    modal === 'nuevo-docente'
                      ? guardarDocente
                      : guardarEdicionDocente
                  }
                >
                  <div className="form-section-title">
                    Información personal
                  </div>

                  <div className="form-grid">
                    <label>
                      RUT
                      <input
                        required
                        value={formDocente.rut}
                        onChange={(e) =>
                          setFormDocente({
                            ...formDocente,
                            rut: e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Nombres
                      <input
                        required
                        value={formDocente.nombres}
                        onChange={(e) =>
                          setFormDocente({
                            ...formDocente,
                            nombres: e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Apellido paterno
                      <input
                        value={
                          formDocente.apellido_paterno
                        }
                        onChange={(e) =>
                          setFormDocente({
                            ...formDocente,
                            apellido_paterno:
                              e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Apellido materno
                      <input
                        value={
                          formDocente.apellido_materno
                        }
                        onChange={(e) =>
                          setFormDocente({
                            ...formDocente,
                            apellido_materno:
                              e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Correo
                      <input
                        type="email"
                        value={formDocente.correo}
                        onChange={(e) =>
                          setFormDocente({
                            ...formDocente,
                            correo: e.target.value
                          })
                        }
                      />
                    </label>

                    <label>
                      Teléfono
                      <input
                        value={formDocente.telefono}
                        onChange={(e) =>
                          setFormDocente({
                            ...formDocente,
                            telefono: e.target.value
                          })
                        }
                      />
                    </label>

                    <label className="form-full">
                      Especialidad
                      <input
                        value={formDocente.especialidad}
                        onChange={(e) =>
                          setFormDocente({
                            ...formDocente,
                            especialidad:
                              e.target.value
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={cerrarModal}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={guardando}
                    >
                      {guardando
                        ? 'Guardando...'
                        : 'Guardar docente'}
                    </button>
                  </div>
                </form>
              )}

              {modal === 'nueva-asignacion' && (
                <form
                  className="modal-form"
                  onSubmit={guardarAsignacion}
                >
                  <div className="form-section-title">
                    Relación académica
                  </div>

                  <div className="form-grid">
                    <label>
                      Docente
                      <select
                        value={
                          formAsignacion.docente_id
                        }
                        onChange={(e) =>
                          setFormAsignacion({
                            ...formAsignacion,
                            docente_id:
                              e.target.value
                          })
                        }
                        required
                      >
                        <option value="">
                          Seleccionar docente
                        </option>

                        {docentes
                          .filter(
                            (docente) => docente.activo
                          )
                          .map((docente) => (
                            <option
                              key={docente.id}
                              value={docente.id}
                            >
                              {nombreCompleto(docente)}
                            </option>
                          ))}
                      </select>
                    </label>

                    <label>
                      Curso
                      <select
                        value={formAsignacion.curso_id}
                        onChange={(e) =>
                          setFormAsignacion({
                            ...formAsignacion,
                            curso_id:
                              e.target.value
                          })
                        }
                        required
                      >
                        <option value="">
                          Seleccionar curso
                        </option>

                        {cursos.map((curso) => (
                          <option
                            key={curso.id}
                            value={curso.id}
                          >
                            {curso.nombre}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Asignatura
                      <select
                        value={
                          formAsignacion.asignatura_id
                        }
                        onChange={(e) =>
                          setFormAsignacion({
                            ...formAsignacion,
                            asignatura_id:
                              e.target.value
                          })
                        }
                        required
                      >
                        <option value="">
                          Seleccionar asignatura
                        </option>

                        {asignaturas.map(
                          (asignatura) => (
                            <option
                              key={asignatura.id}
                              value={asignatura.id}
                            >
                              {asignatura.nombre}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Año
                      <input
                        type="number"
                        value={formAsignacion.anio}
                        onChange={(e) =>
                          setFormAsignacion({
                            ...formAsignacion,
                            anio: Number(
                              e.target.value
                            )
                          })
                        }
                      />
                    </label>

                    <label className="checkbox-label form-full">
                      <input
                        type="checkbox"
                        checked={
                          formAsignacion.es_profesor_jefe
                        }
                        onChange={(e) =>
                          setFormAsignacion({
                            ...formAsignacion,
                            es_profesor_jefe:
                              e.target.checked
                          })
                        }
                      />
                      <span>
                        Este docente es profesor jefe de
                        este curso
                      </span>
                    </label>
                  </div>

                  <div className="modal-info">
                    <strong>Importante:</strong>
                    <span>
                      Un docente puede ser profesor jefe y
                      además impartir una asignatura. La
                      relación se guarda directamente en
                      <code>docente_curso</code>.
                    </span>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={cerrarModal}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={guardando}
                    >
                      Crear asignación
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AlumnoModal({ detalle }) {
  const alumno = detalle.alumno;

  return (
    <div className="detail-content">
      <div className="profile-header">
        <div className="profile-avatar">
          {(alumno.nombres || 'A').charAt(0)}
        </div>

        <div>
          <h3>
            {nombreCompleto(alumno)}
          </h3>
          <span>{alumno.rut}</span>
        </div>
      </div>

      <div className="detail-grid">
        <DetailItem
          label="Fecha nacimiento"
          value={formatearFecha(alumno.fecha_nacimiento)}
        />
        <DetailItem
          label="Sexo"
          value={alumno.sexo}
        />
        <DetailItem
          label="Nacionalidad"
          value={alumno.nacionalidad}
        />
        <DetailItem
          label="Comuna"
          value={alumno.comuna}
        />
        <DetailItem
          label="Dirección"
          value={alumno.direccion}
        />
        <DetailItem
          label="Curso"
          value={alumno.curso}
        />
        <DetailItem
          label="Estado matrícula"
          value={alumno.matricula_estado}
        />
        <DetailItem
          label="Fecha matrícula"
          value={formatearFecha(alumno.fecha_matricula)}
        />
      </div>

      <DetailSection title="Apoderados">
        {detalle.apoderados.length === 0 ? (
          <EmptyDetail text="No hay apoderados registrados." />
        ) : (
          detalle.apoderados.map((apoderado) => (
            <div
              className="related-row"
              key={apoderado.id}
            >
              <div>
                <strong>
                  {apoderado.nombre_completo}
                </strong>
                <span>
                  {apoderado.parentesco || 'Sin parentesco'}
                  {apoderado.es_apoderado_principal
                    ? ' · Principal'
                    : ''}
                </span>
              </div>

              <div>
                <span>{apoderado.telefono || '-'}</span>
                <span>{apoderado.correo || '-'}</span>
              </div>
            </div>
          ))
        )}
      </DetailSection>

      <DetailSection title="Notas">
        {detalle.notas.length === 0 ? (
          <EmptyDetail text="No hay notas registradas." />
        ) : (
          <div className="detail-table-wrapper">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Asignatura</th>
                  <th>Periodo</th>
                  <th>Tipo</th>
                  <th>Nota</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {detalle.notas.map((nota) => (
                  <tr key={nota.id}>
                    <td>{nota.asignatura}</td>
                    <td>{nota.periodo || '-'}</td>
                    <td>{nota.tipo_evaluacion || '-'}</td>
                    <td>
                      <span
                        className={`grade ${promedioColor(
                          nota.nota
                        )}`}
                      >
                        {nota.nota}
                      </span>
                    </td>
                    <td>
                      {formatearFecha(nota.fecha)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DetailSection>

      <DetailSection title="Asistencia">
        {detalle.asistencia.length === 0 ? (
          <EmptyDetail text="No hay asistencia registrada." />
        ) : (
          <div className="detail-table-wrapper">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Observación</th>
                </tr>
              </thead>

              <tbody>
                {detalle.asistencia.slice(0, 30).map((item) => (
                  <tr key={item.id}>
                    <td>
                      {formatearFecha(item.fecha)}
                    </td>
                    <td>{item.estado}</td>
                    <td>{item.observacion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DetailSection>

      <DetailSection title="Justificativos">
        {detalle.justificativos.length === 0 ? (
          <EmptyDetail text="No hay justificativos registrados." />
        ) : (
          detalle.justificativos.map((item) => (
            <div
              className="related-row"
              key={item.id}
            >
              <div>
                <strong>{item.motivo}</strong>
                <span>
                  {formatearFecha(item.fecha_inicio)}
                  {' - '}
                  {formatearFecha(item.fecha_fin)}
                </span>
              </div>

              <span className="status neutral">
                {item.estado}
              </span>
            </div>
          ))
        )}
      </DetailSection>

      <DetailSection title="Anotaciones">
        {detalle.anotaciones.length === 0 ? (
          <EmptyDetail text="No hay anotaciones." />
        ) : (
          detalle.anotaciones.map((item) => (
            <div
              className="annotation-item"
              key={item.id}
            >
              <div className="annotation-header">
                <strong>
                  {item.titulo || 'Anotación'}
                </strong>
                <span>
                  {formatearFecha(item.fecha)}
                </span>
              </div>

              <p>{item.descripcion}</p>

              <small>
                {item.docente_nombres || ''}{' '}
                {item.docente_apellido_paterno || ''}
              </small>
            </div>
          ))
        )}
      </DetailSection>

      <DetailSection title="Retrasos">
        {detalle.retrasos.length === 0 ? (
          <EmptyDetail text="No hay retrasos registrados." />
        ) : (
          detalle.retrasos.map((item) => (
            <div
              className="related-row"
              key={item.id}
            >
              <div>
                <strong>
                  {formatearFecha(item.fecha)}
                </strong>
                <span>
                  Llegada: {String(
                    item.hora_llegada
                  ).slice(0, 5)}
                </span>
              </div>

              <span>
                {item.motivo || 'Sin motivo'}
              </span>
            </div>
          ))
        )}
      </DetailSection>
    </div>
  );
}

function DocenteModal({ detalle, onEditar }) {
  const docente = detalle.docente;

  return (
    <div className="detail-content">
      <div className="profile-header">
        <div className="profile-avatar teacher">
          {(docente.nombres || 'D').charAt(0)}
        </div>

        <div>
          <h3>{nombreCompleto(docente)}</h3>
          <span>{docente.rut}</span>
        </div>

        <button
          className="btn-primary profile-action"
          onClick={onEditar}
        >
          Editar
        </button>
      </div>

      <div className="detail-grid">
        <DetailItem
          label="Correo"
          value={docente.correo}
        />
        <DetailItem
          label="Teléfono"
          value={docente.telefono}
        />
        <DetailItem
          label="Especialidad"
          value={docente.especialidad}
        />
        <DetailItem
          label="Estado"
          value={
            docente.activo
              ? 'ACTIVO'
              : 'DESVINCULADO'
          }
        />
      </div>

      <DetailSection title="Asignaciones académicas">
        {detalle.asignaciones.length === 0 ? (
          <EmptyDetail text="No tiene asignaciones para este año." />
        ) : (
          <div className="detail-table-wrapper">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Asignatura</th>
                  <th>Profesor jefe</th>
                </tr>
              </thead>

              <tbody>
                {detalle.asignaciones.map((item) => (
                  <tr key={item.id}>
                    <td>{item.curso}</td>
                    <td>{item.asignatura}</td>
                    <td>
                      {item.es_profesor_jefe ? (
                        <span className="badge-chief">
                          Sí
                        </span>
                      ) : (
                        'No'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DetailSection>

      <DetailSection title="Historial de desvinculación">
        {detalle.desvinculaciones.length === 0 ? (
          <EmptyDetail text="No existen desvinculaciones registradas." />
        ) : (
          detalle.desvinculaciones.map((item) => (
            <div
              className="annotation-item"
              key={item.id}
            >
              <div className="annotation-header">
                <strong>{item.motivo}</strong>
                <span>
                  {formatearFecha(
                    item.fecha_desvinculacion
                  )}
                </span>
              </div>

              <p>
                {item.observacion || 'Sin observación.'}
              </p>
            </div>
          ))
        )}
      </DetailSection>
    </div>
  );
}

function CursoModal({ detalle }) {
  return (
    <div className="detail-content">
      <div className="profile-header">
        <div className="profile-avatar course">
          🏫
        </div>

        <div>
          <h3>{detalle.curso.nombre}</h3>
          <span>
            {detalle.curso.jornada || 'Jornada no indicada'}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        <DetailItem
          label="Código nivel"
          value={detalle.curso.codigo_nivel}
        />
        <DetailItem
          label="Año"
          value={detalle.curso.anio}
        />
        <DetailItem
          label="Jornada"
          value={detalle.curso.jornada}
        />
      </div>

      <DetailSection title="Alumnos">
        <div className="detail-table-wrapper">
          <table className="detail-table">
            <thead>
              <tr>
                <th>RUT</th>
                <th>Alumno</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {detalle.alumnos.map((alumno) => (
                <tr key={alumno.id}>
                  <td>{alumno.rut}</td>
                  <td>
                    {nombreCompleto(alumno)}
                  </td>
                  <td>{alumno.matricula_estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailSection>

      <DetailSection title="Docentes y asignaturas">
        <div className="detail-table-wrapper">
          <table className="detail-table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Asignatura</th>
                <th>Profesor jefe</th>
              </tr>
            </thead>

            <tbody>
              {detalle.docentes.map((item) => (
                <tr key={item.id}>
                  <td>{item.docente}</td>
                  <td>{item.asignatura}</td>
                  <td>
                    {item.es_profesor_jefe ? (
                      <span className="badge-chief">
                        Sí
                      </span>
                    ) : (
                      'No'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailSection>

      <DetailSection title="Horario">
        {detalle.horarios.length === 0 ? (
          <EmptyDetail text="No hay horario registrado." />
        ) : (
          <div className="detail-table-wrapper">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Horario</th>
                  <th>Asignatura</th>
                  <th>Docente</th>
                </tr>
              </thead>

              <tbody>
                {detalle.horarios.map((item) => (
                  <tr key={item.id}>
                    <td>{item.dia_semana}</td>
                    <td>
                      {String(
                        item.hora_inicio
                      ).slice(0, 5)}
                      {' - '}
                      {String(
                        item.hora_fin
                      ).slice(0, 5)}
                    </td>
                    <td>{item.asignatura}</td>
                    <td>
                      {item.docente || 'Sin docente'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DetailSection>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="detail-section">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function EmptyDetail({ text }) {
  return (
    <div className="empty-detail">
      {text}
    </div>
  );
}