import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUsuarioActual } from '../services/authService.js';
import {
  obtenerCursoDocente,
  obtenerAsistenciaCurso,
  guardarAsistenciaCurso,
  obtenerMiDashboardDocente
} from '../services/docenteService.js';

import { fetchConAuth } from '../services/apiService.js';
import { logoutService } from '../services/authService.js';

import './profesor_curso.css';

export default function ProfesorCurso() {

  const navigate = useNavigate();
  const { cursoId } = useParams();

  const [curso, setCurso] = useState(null);
  const [asignaturas, setAsignaturas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [horario, setHorario] = useState([]);
  const [misAsignaturasIds, setMisAsignaturasIds] = useState(new Set());
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState('');
  const [informacionAlumno, setInformacionAlumno] = useState(null);
  const [cargandoInformacionAlumno, setCargandoInformacionAlumno] = useState(false);

  const [pestana, setPestana] = useState('alumnos');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [notas, setNotas] = useState([]);
  const [asignaturaNotas, setAsignaturaNotas] = useState('');
  const [periodoNotas, setPeriodoNotas] = useState('1');
  const [cargandoNotas, setCargandoNotas] = useState(false);

  const [mostrarNuevaEvaluacion, setMostrarNuevaEvaluacion] = useState(false);
  const [guardandoEvaluacion, setGuardandoEvaluacion] = useState(false);

  const [edicionesNotas, setEdicionesNotas] = useState({});

  const [nuevaEvaluacion, setNuevaEvaluacion] = useState({
    tipoEvaluacion: '',
    porcentaje: '',
    fecha: obtenerFechaActual(),
    observacion: ''
  });

  const [fechaAsistencia, setFechaAsistencia] = useState(obtenerFechaActual());
  const [asistencia, setAsistencia] = useState([]);
  const [cargandoAsistencia, setCargandoAsistencia] = useState(false);

  const [anotaciones, setAnotaciones] = useState([]);
  const [cargandoAnotaciones, setCargandoAnotaciones] = useState(false);

  const [mostrarFormularioAnotacion, setMostrarFormularioAnotacion] = useState(false);

  const [anotacionForm, setAnotacionForm] = useState({
    alumnoId: '',
    tipo: 'OBSERVACION',
    titulo: '',
    descripcion: '',
    fecha: obtenerFechaActual()
  });

  useEffect(() => {
    cargarCurso();
  }, [cursoId]);

  const cargarCurso = async () => {
    try {
      setCargando(true);
      setError(null);

      const [data, dashboardData] = await Promise.all([
        obtenerCursoDocente(cursoId),
        obtenerMiDashboardDocente().catch(() => null)
      ]);

      const cursoInfo = data.curso;
      const todasAsignaturasCurso = data.asignaturas || [];

      setCurso(cursoInfo);
      setAlumnos(data.alumnos || []);

      let nombresRamosPropios = new Set();
      let idsRamosPropios = new Set();

      if (dashboardData?.cursos) {
        const cursoEnDashboard = dashboardData.cursos.find(
          (c) => String(c.id) === String(cursoId)
        );
        if (cursoEnDashboard?.asignaturas) {
          cursoEnDashboard.asignaturas.forEach((asig) => {
            if (asig.id) idsRamosPropios.add(String(asig.id));
            if (asig.nombre) nombresRamosPropios.add(asig.nombre.trim().toLowerCase());
          });
        }
      }

      const asignaturasMarcadas = todasAsignaturasCurso.map((asig) => {
        const idStr = String(asig.id);
        const nombreStr = (asig.nombre || '').trim().toLowerCase();
        const esPropia = !cursoInfo?.esProfesorJefe
          ? true
          : (idsRamosPropios.has(idStr) || nombresRamosPropios.has(nombreStr));

        return {
          ...asig,
          esPropia
        };
      });

      setAsignaturas(asignaturasMarcadas);

    } catch (error) {
      console.error('Error cargando curso:', error);
      setError(error.message || 'No se pudo cargar el curso.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (pestana === 'informacion-alumno' && alumnoSeleccionadoId) {
      cargarInformacionAlumno(alumnoSeleccionadoId);
    }
  }, [pestana, alumnoSeleccionadoId]);

  const cargarInformacionAlumno = async (alumnoId) => {
    try {
      setCargandoInformacionAlumno(true);

      const data = await fetchConAuth(
        `/api/docentes/me/alumnos/${alumnoId}/informacion`
      );

      setInformacionAlumno(data.alumno || null);

    } catch (error) {
      console.error('Error cargando información del alumno:', error);
      setInformacionAlumno(null);

      alert(
        error.message ||
        'No se pudo cargar la información del alumno.'
      );

    } finally {
      setCargandoInformacionAlumno(false);
    }
  };

  useEffect(() => {
    if (pestana === 'notas' && cursoId) {
      cargarNotas();
    }
  }, [pestana, cursoId, asignaturaNotas]);

  const cargarNotas = async () => {
    try {
      setCargandoNotas(true);

      let url = `/api/notas/curso/${cursoId}`;

      if (asignaturaNotas) {
        url += `?asignaturaId=${encodeURIComponent(asignaturaNotas)}`;
      }

      const data = await fetchConAuth(url);

      setNotas(data.notas || []);

    } catch (error) {
      console.error('Error cargando notas:', error);

      alert(
        error.message ||
        'No se pudieron cargar las notas.'
      );

    } finally {
      setCargandoNotas(false);
    }
  };

  const evaluacionesAgrupadas = useMemo(() => {
    const agrupadas = new Map();

    const notasFiltradas = notas.filter((nota) => {
      if (String(nota.periodo) !== String(periodoNotas)) {
        return false;
      }

      if (
        asignaturaNotas &&
        String(nota.asignaturaId) !== String(asignaturaNotas)
      ) {
        return false;
      }

      return true;
    });

    notasFiltradas.forEach((nota) => {
      const fecha = nota.fecha
        ? String(nota.fecha).slice(0, 10)
        : '';

      const clave = JSON.stringify([
        nota.periodo,
        nota.tipoEvaluacion,
        Number(nota.porcentaje),
        fecha
      ]);

      if (!agrupadas.has(clave)) {
        agrupadas.set(clave, {
          clave,
          periodo: nota.periodo,
          tipoEvaluacion: nota.tipoEvaluacion || 'Evaluación sin nombre',
          porcentaje: Number(nota.porcentaje || 0),
          fecha,
          observacion: nota.observacion || '',
          notas: {}
        });
      }

      agrupadas.get(clave).notas[nota.alumnoId] = nota;
    });

    return Array.from(agrupadas.values()).sort((a, b) => {
      return (a.fecha || '').localeCompare(b.fecha || '');
    });

  }, [notas, periodoNotas, asignaturaNotas]);

  const { asignaturasPropias, asignaturasJefatura } = useMemo(() => {
    const propias = [];
    const jefatura = [];

    asignaturas.forEach((asig) => {
      if (asig.esPropia) {
        propias.push(asig);
      } else {
        jefatura.push(asig);
      }
    });

    return { asignaturasPropias: propias, asignaturasJefatura: jefatura };
  }, [asignaturas]);

  const puedeEditarAsignaturaActual = useMemo(() => {
    if (!asignaturaNotas) return false;
    const encontrada = asignaturas.find(
      (a) => String(a.id) === String(asignaturaNotas)
    );
    return encontrada ? Boolean(encontrada.esPropia) : false;
  }, [asignaturaNotas, asignaturas]);

  const alumnosOrdenados = useMemo(() => {
    return [...alumnos].sort((a, b) =>
      String(a.nombre || '').localeCompare(
        String(b.nombre || ''),
        'es',
        { sensitivity: 'base' }
      )
    );
  }, [alumnos]);

  const porcentajePeriodo = useMemo(() => {
    return evaluacionesAgrupadas.reduce(
      (total, evaluacion) => total + Number(evaluacion.porcentaje || 0),
      0
    );
  }, [evaluacionesAgrupadas]);

  const calcularPromedioAlumno = (alumnoId) => {
    let sumaPonderada = 0;
    let porcentajeIngresado = 0;

    evaluacionesAgrupadas.forEach((evaluacion) => {
      const registro = evaluacion.notas[alumnoId];

      const claveCelda = `${evaluacion.clave}_${alumnoId}`;
      const valorEditado = edicionesNotas[claveCelda];

      const valorNota = valorEditado !== undefined
        ? valorEditado
        : registro?.nota;

      if (
        valorNota !== null &&
        valorNota !== undefined &&
        valorNota !== ''
      ) {
        const nota = Number(valorNota);
        const porcentaje = Number(evaluacion.porcentaje || 0);

        if (
          Number.isFinite(nota) &&
          nota >= 1 &&
          nota <= 7 &&
          porcentaje > 0
        ) {
          sumaPonderada += nota * porcentaje;
          porcentajeIngresado += porcentaje;
        }
      }
    });

    if (porcentajeIngresado === 0) {
      return null;
    }

    return {
      promedio: sumaPonderada / porcentajeIngresado,
      porcentajeIngresado,
      porcentajePendiente: Math.max(0, 100 - porcentajeIngresado),
      definitivo: porcentajeIngresado >= 99.9999
    };
  };

  const cambiarNotaGrilla = (claveEvaluacion, alumnoId, valor) => {
    const claveCelda = `${claveEvaluacion}_${alumnoId}`;

    setEdicionesNotas((actual) => ({
      ...actual,
      [claveCelda]: valor
    }));
  };

  const guardarEvaluacionMasiva = async (evaluacion) => {
    if (!asignaturaNotas) {
      alert('Primero debes seleccionar una asignatura.');
      return false;
    }

    if (!alumnos.length) {
      alert('No se encontraron alumnos para este curso.');
      return false;
    }

    if (!evaluacion.tipoEvaluacion || !evaluacion.porcentaje) {
      alert('La evaluación no tiene nombre o ponderación.');
      return false;
    }

    const listaAlumnos = alumnos.map((alumno) => {
      const claveCelda = `${evaluacion.clave}_${alumno.id}`;
      const registroExistente = evaluacion.notas?.[alumno.id];

      const valorEditado = edicionesNotas[claveCelda];

      const nota = valorEditado !== undefined
        ? valorEditado
        : (registroExistente?.nota ?? null);

      return {
        alumnoId: alumno.id,
        nota: nota === '' || nota === null || nota === undefined
          ? null
          : Number(nota)
      };
    });

    const invalidas = listaAlumnos.filter((alumno) =>
      alumno.nota !== null &&
      (
        !Number.isFinite(alumno.nota) ||
        alumno.nota < 1 ||
        alumno.nota > 7
      )
    );

    if (invalidas.length > 0) {
      alert('Hay notas inválidas. Deben estar entre 1,0 y 7,0.');
      return false;
    }

    try {
      setGuardandoEvaluacion(true);

      const data = await fetchConAuth('/api/notas/masivas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cursoId,
          asignaturaId: asignaturaNotas,
          periodo: periodoNotas,
          tipoEvaluacion: evaluacion.tipoEvaluacion,
          porcentaje: Number(evaluacion.porcentaje),
          fecha: evaluacion.fecha || null,
          observacion: evaluacion.observacion || '',
          alumnos: listaAlumnos
        })
      });

      alert(data.mensaje || 'Evaluación guardada correctamente.');

      setEdicionesNotas({});

      await cargarNotas();

      return true;

    } catch (error) {
      console.error('Error guardando evaluación:', error);

      alert(
        error.message ||
        'No fue posible guardar la evaluación.'
      );

      return false;

    } finally {
      setGuardandoEvaluacion(false);
    }
  };

  const crearNuevaEvaluacion = async (event) => {
    event.preventDefault();

    const nombre = nuevaEvaluacion.tipoEvaluacion.trim();
    const porcentaje = Number(nuevaEvaluacion.porcentaje);

    if (!asignaturaNotas) {
      alert('Selecciona primero la asignatura.');
      return;
    }

    if (!nombre) {
      alert('Debes ingresar el nombre de la evaluación.');
      return;
    }

    if (nombre.length > 100) {
      alert('El nombre no puede superar los 100 caracteres.');
      return;
    }

    if (
      !Number.isFinite(porcentaje) ||
      porcentaje <= 0 ||
      porcentaje > 100
    ) {
      alert('La ponderación debe ser mayor que 0 y no superar el 100%.');
      return;
    }

    if (!nuevaEvaluacion.fecha) {
      alert('Debes seleccionar la fecha de la evaluación.');
      return;
    }

    const evaluacion = {
      clave: 'nueva',
      tipoEvaluacion: nombre,
      porcentaje,
      fecha: nuevaEvaluacion.fecha,
      observacion: nuevaEvaluacion.observacion,
      notas: {}
    };

    const guardado = await guardarEvaluacionMasiva(evaluacion);

    if (guardado) {
      setMostrarNuevaEvaluacion(false);

      setNuevaEvaluacion({
        tipoEvaluacion: '',
        porcentaje: '',
        fecha: obtenerFechaActual(),
        observacion: ''
      });
    }
  };


  const eliminarNota = async (notaId) => {
    const confirmar = window.confirm(
      '¿Seguro que deseas eliminar esta nota?'
    );

    if (!confirmar) return;

    try {
      const data = await fetchConAuth(
        `/api/notas/${notaId}`,
        {
          method: 'DELETE'
        }
      );

      alert(data.mensaje || 'Nota eliminada correctamente.');

      await cargarNotas();

    } catch (error) {
      console.error('Error eliminando nota:', error);

      alert(
        error.message ||
        'No se pudo eliminar la nota.'
      );
    }
  };

  useEffect(() => {
    if (
      pestana === 'asistencia' &&
      cursoId &&
      fechaAsistencia
    ) {
      cargarAsistencia();
    }
  }, [pestana, cursoId, fechaAsistencia]);

  const cargarAsistencia = async () => {
    try {
      setCargandoAsistencia(true);

      const data = await obtenerAsistenciaCurso(
        cursoId,
        fechaAsistencia
      );

      setAsistencia(data.alumnos || []);

    } catch (error) {
      console.error('Error cargando asistencia:', error);

      alert(
        error.message ||
        'No se pudo cargar la asistencia.'
      );

    } finally {
      setCargandoAsistencia(false);
    }
  };

  const guardarEstadoAsistencia = async (
    alumnoId,
    estado,
    observacion = ''
  ) => {
    try {
      await guardarAsistenciaCurso(
        cursoId,
        fechaAsistencia,
        alumnoId,
        estado,
        observacion || ''
      );

      setAsistencia((actual) => {
        const copia = [...actual];

        const indice = copia.findIndex(
          (item) =>
            item.id === alumnoId ||
            item.alumnoId === alumnoId
        );

        if (indice >= 0) {
          copia[indice] = {
            ...copia[indice],
            estado,
            observacion: observacion || ''
          };
        }

        return copia;
      });

    } catch (error) {
      console.error('Error guardando asistencia:', error);

      alert(
        error.message ||
        'No se pudo guardar la asistencia.'
      );
    }
  };

  const obtenerEstadoAlumno = (alumnoId) => {
    const registro = asistencia.find(
      (item) => item.alumnoId === alumnoId
    );

    return registro?.estado || null;
  };

  const estadisticasAsistencia = useMemo(() => {
    return {
      presentes: asistencia.filter(
        (item) => item.estado === 'PRESENTE'
      ).length,

      ausentes: asistencia.filter(
        (item) => item.estado === 'AUSENTE'
      ).length,

      atrasados: asistencia.filter(
        (item) => item.estado === 'ATRASADO'
      ).length,

      justificados: asistencia.filter(
        (item) => item.estado === 'JUSTIFICADO'
      ).length
    };
  }, [asistencia]);

  useEffect(() => {
    if (pestana === 'anotaciones' && cursoId) {
      cargarAnotaciones();
    }
  }, [pestana, cursoId]);

  const cargarAnotaciones = async () => {
    try {
      setCargandoAnotaciones(true);

      const data = await fetchConAuth(
        `/api/anotaciones/curso/${cursoId}`
      );

      setAnotaciones(data.anotaciones || []);

    } catch (error) {
      console.error('Error cargando anotaciones:', error);

      alert(
        error.message ||
        'No se pudieron cargar las anotaciones.'
      );

    } finally {
      setCargandoAnotaciones(false);
    }
  };

  const crearAnotacion = async (event) => {
    event.preventDefault();

    try {
      if (!anotacionForm.alumnoId) {
        alert('Selecciona un alumno.');
        return;
      }

      if (!anotacionForm.descripcion.trim()) {
        alert('Escribe una descripción.');
        return;
      }

      const data = await fetchConAuth(
        '/api/anotaciones',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            alumnoId: anotacionForm.alumnoId,
            cursoId,
            tipo: anotacionForm.tipo,
            titulo: anotacionForm.titulo || null,
            descripcion: anotacionForm.descripcion,
            fecha: anotacionForm.fecha || null
          })
        }
      );

      alert(data.mensaje || 'Anotación registrada correctamente.');

      setAnotacionForm({
        alumnoId: '',
        tipo: 'OBSERVACION',
        titulo: '',
        descripcion: '',
        fecha: obtenerFechaActual()
      });

      setMostrarFormularioAnotacion(false);

      await cargarAnotaciones();

    } catch (error) {
      console.error('Error creando anotación:', error);

      alert(
        error.message ||
        'No se pudo registrar la anotación.'
      );
    }
  };

  const eliminarAnotacion = async (anotacionId) => {
    const confirmar = window.confirm(
      '¿Seguro que deseas eliminar esta anotación?'
    );

    if (!confirmar) return;

    try {
      const data = await fetchConAuth(
        `/api/anotaciones/${anotacionId}`,
        {
          method: 'DELETE'
        }
      );

      alert(data.mensaje || 'Anotación eliminada correctamente.');

      await cargarAnotaciones();

    } catch (error) {
      console.error('Error eliminando anotación:', error);

      alert(
        error.message ||
        'No se pudo eliminar la anotación.'
      );
    }
  };


  const obtenerNombreDia = (dia) => {
    const dias = {
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sábado',
      7: 'Domingo'
    };

    return dias[dia] || `Día ${dia}`;
  };

  const formatearHora = (hora) => {
    if (!hora) return '-';
    return String(hora).slice(0, 5);
  };

  const volver = () => {
    navigate('/profesores_dashboard');
  };

  const cerrarSesion = () => {
    logoutService();
    navigate('/');
  };

  if (cargando) {
    return (
      <div className="profesor-curso-container">
        <div className="profesor-curso-card">
          <div className="loading-icon">⏳</div>
          <h2>Cargando curso...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profesor-curso-container">
        <div className="profesor-curso-card">
          <div className="error-icon">⚠️</div>

          <h2>No se pudo cargar el curso</h2>

          <p>{error}</p>

          <button
            className="btn-primary"
            onClick={volver}
          >
            Volver a mis cursos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profesor-curso-container">

      <header className="profesor-curso-header">

        <div className="header-course-info">

          <button
            className="back-button"
            onClick={volver}
          >
            ← Mis cursos
          </button>

          <div>
            <h1>{curso?.nombre}</h1>
            <p>Panel del curso · {curso?.anio}</p>
          </div>

        </div>

        <button
          className="logout-button"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>

      </header>

      <main className="profesor-curso-content">

        <section className="curso-resumen">

          <div className="resumen-item">
            <span className="resumen-icon">👥</span>
            <div>
              <strong>{alumnos.length}</strong>
              <span>Alumnos</span>
            </div>
          </div>

          <div className="resumen-item">
            <span className="resumen-icon">📚</span>
            <div>
              <strong>{asignaturas.length}</strong>
              <span>Asignaturas</span>
            </div>
          </div>

          <div className="resumen-item">
            <span className="resumen-icon">📝</span>
            <div>
              <strong>{notas.length}</strong>
              <span>Notas cargadas</span>
            </div>
          </div>

          <div className="resumen-item">
            <span className="resumen-icon">📋</span>
            <div>
              <strong>{anotaciones.length}</strong>
              <span>Anotaciones</span>
            </div>
          </div>

        </section>

        <nav className="curso-tabs">

          <button
            className={pestana === 'alumnos' ? 'curso-tab active' : 'curso-tab'}
            onClick={() => setPestana('alumnos')}
          >
            👥 Alumnos
          </button>

          <button
            className={pestana === 'notas' ? 'curso-tab active' : 'curso-tab'}
            onClick={() => setPestana('notas')}
          >
            📝 Notas
          </button>

          <button
            className={pestana === 'asistencia' ? 'curso-tab active' : 'curso-tab'}
            onClick={() => setPestana('asistencia')}
          >
            📅 Asistencia
          </button>

          <button
            className={pestana === 'anotaciones' ? 'curso-tab active' : 'curso-tab'}
            onClick={() => setPestana('anotaciones')}
          >
            📋 Anotaciones
          </button>

          <button
            className={pestana === 'informacion-alumno' ? 'curso-tab active' : 'curso-tab'}
            onClick={() => setPestana('informacion-alumno')}
          >
            👤 Información del alumno
          </button>

          <button
            className={pestana === 'informacion' ? 'curso-tab active' : 'curso-tab'}
            onClick={() => setPestana('informacion')}
          >
            ℹ️ Información
          </button>

          {curso?.esProfesorJefe && (
            <button
              className={pestana === 'jefatura' ? 'curso-tab active' : 'curso-tab'}
              onClick={() => {
                setPestana('jefatura');
                setAsignaturaNotas('');
              }}
            >
              ⭐ Jefatura (Solo Lectura)
            </button>
          )}

        </nav>

        {pestana === 'alumnos' && (
          <section className="curso-panel">

            <div className="panel-header">
              <div>
                <h2>👥 Alumnos</h2>
                <p>Estudiantes matriculados en este curso.</p>
              </div>

              <span className="count-badge">{alumnos.length}</span>
            </div>

            {alumnos.length === 0 ? (
              <div className="empty-state">
                <div>👥</div>
                <h3>No hay alumnos</h3>
                <p>No existen estudiantes matriculados en este curso.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="curso-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Alumno</th>
                      <th>RUT</th>
                      <th>Sexo</th>
                      <th>Información</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alumnos.map((alumno, index) => (
                      <tr key={alumno.id}>
                        <td>{index + 1}</td>

                        <td>
                          <strong>{alumno.nombre}</strong>
                        </td>

                        <td>{alumno.rut || '-'}</td>
                        <td>{alumno.sexo || '-'}</td>

                        <td>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => {
                              setAlumnoSeleccionadoId(alumno.id);
                              setPestana('informacion-alumno');
                            }}
                          >
                            Ver información
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </section>
        )}

        {pestana === 'notas' && (
          <section className="curso-panel">

            <div className="panel-header">
              <div>
                <h2>Libro de clases · Notas</h2>
                <p>
                  Registra evaluaciones y calificaciones de tus asignaturas.
                </p>
              </div>

              {asignaturaNotas && puedeEditarAsignaturaActual && (
                <button
                  className="btn-primary"
                  disabled={guardandoEvaluacion}
                  onClick={() => setMostrarNuevaEvaluacion(!mostrarNuevaEvaluacion)}
                >
                  {mostrarNuevaEvaluacion ? '✕ Cerrar' : '+ Nueva evaluación'}
                </button>
              )}
            </div>

            <div
              className="filter-row"
              style={{
                display: 'flex',
                gap: '18px',
                flexWrap: 'wrap',
                alignItems: 'end',
                marginBottom: '20px'
              }}
            >

              <div className="form-group">
                <label>Asignatura</label>

                <select
                  value={asignaturaNotas}
                  onChange={(e) => {
                    setAsignaturaNotas(e.target.value);
                    setEdicionesNotas({});
                    setMostrarNuevaEvaluacion(false);
                  }}
                >
                  <option value="">Seleccionar asignatura</option>

                  {asignaturasPropias.map((asignatura) => (
                    <option key={asignatura.id} value={asignatura.id}>
                      {asignatura.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Período académico</label>

                <select
                  value={periodoNotas}
                  onChange={(e) => {
                    setPeriodoNotas(e.target.value);
                    setEdicionesNotas({});
                    setMostrarNuevaEvaluacion(false);
                  }}
                >
                  <option value="1">1° Semestre / Período</option>
                  <option value="2">2° Semestre / Período</option>
                </select>
              </div>

            </div>

            {asignaturaNotas && (
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                  marginBottom: '20px'
                }}
              >
                <div className="info-box">
                  <span>Ponderación registrada</span>
                  <strong>{porcentajePeriodo.toFixed(2)}%</strong>
                </div>

                <div className="info-box">
                  <span>Ponderación disponible</span>
                  <strong>
                    {Math.max(0, 100 - porcentajePeriodo).toFixed(2)}%
                  </strong>
                </div>

                <div className="info-box">
                  <span>Evaluaciones</span>
                  <strong>{evaluacionesAgrupadas.length}</strong>
                </div>
              </div>
            )}

            {mostrarNuevaEvaluacion && puedeEditarAsignaturaActual && (
              <form
                className="form-card"
                onSubmit={crearNuevaEvaluacion}
              >
                <h3>Crear evaluación para todo el curso</h3>
                <p>
                  Se creará una columna para todos los alumnos.
                  Podrás ingresar las calificaciones después.
                </p>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre de la evaluación</label>
                    <input
                      type="text"
                      maxLength="100"
                      placeholder="Ej: Prueba unidad 1"
                      value={nuevaEvaluacion.tipoEvaluacion}
                      onChange={(e) =>
                        setNuevaEvaluacion({
                          ...nuevaEvaluacion,
                          tipoEvaluacion: e.target.value
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Ponderación (%)</label>
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      placeholder="Ej: 30"
                      value={nuevaEvaluacion.porcentaje}
                      onChange={(e) =>
                        setNuevaEvaluacion({
                          ...nuevaEvaluacion,
                          porcentaje: e.target.value
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha de evaluación</label>
                    <input
                      type="date"
                      value={nuevaEvaluacion.fecha}
                      onChange={(e) =>
                        setNuevaEvaluacion({
                          ...nuevaEvaluacion,
                          fecha: e.target.value
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Observación (opcional)</label>
                    <textarea
                      rows="2"
                      value={nuevaEvaluacion.observacion}
                      onChange={(e) =>
                        setNuevaEvaluacion({
                          ...nuevaEvaluacion,
                          observacion: e.target.value
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setMostrarNuevaEvaluacion(false)}
                    disabled={guardandoEvaluacion}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={guardandoEvaluacion}
                  >
                    {guardandoEvaluacion ? 'Guardando...' : 'Crear evaluación'}
                  </button>
                </div>
              </form>
            )}

            {!asignaturaNotas ? (
              <div className="empty-state">
                <div>📚</div>
                <h3>Selecciona una asignatura</h3>
                <p>
                  Para consultar o registrar calificaciones,
                  primero selecciona una de tus asignaturas del listado.
                </p>
              </div>
            ) : cargandoNotas ? (
              <div className="loading-state">
                Cargando notas...
              </div>
            ) : alumnos.length === 0 ? (
              <div className="empty-state">
                <div>👥</div>
                <h3>No hay alumnos en el curso</h3>
              </div>
            ) : evaluacionesAgrupadas.length === 0 ? (
              <div className="empty-state">
                <div>📝</div>
                <h3>No hay evaluaciones registradas</h3>
                <p>
                  Utiliza el botón «Nueva evaluación» para crear
                  la primera columna de calificaciones.
                </p>
              </div>
            ) : (
              <div
                className="table-wrapper"
                style={{
                  overflowX: 'auto',
                  width: '100%'
                }}
              >
                <table className="curso-table">
                  <thead>
                    <tr>
                      <th
                        style={{
                          minWidth: '230px',
                          position: 'sticky',
                          left: 0,
                          zIndex: 2,
                          background: '#f4f6f9'
                        }}
                      >
                        Alumno
                      </th>

                      {evaluacionesAgrupadas.map((evaluacion) => (
                        <th
                          key={evaluacion.clave}
                          title={`${evaluacion.tipoEvaluacion} · Ponderación: ${evaluacion.porcentaje}% · Fecha: ${formatearFecha(evaluacion.fecha)}`}
                          style={{
                            minWidth: '145px',
                            textAlign: 'center'
                          }}
                        >
                          <div>
                            <strong>{evaluacion.tipoEvaluacion}</strong>
                          </div>
                          <small>{evaluacion.porcentaje}%</small>
                          <div>
                            <small>{formatearFecha(evaluacion.fecha)}</small>
                          </div>
                        </th>
                      ))}

                      <th
                        style={{
                          minWidth: '150px',
                          textAlign: 'center'
                        }}
                      >
                        Promedio
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {alumnosOrdenados.map((alumno) => {
                      const resultado = calcularPromedioAlumno(alumno.id);

                      return (
                        <tr key={alumno.id}>
                          <td
                            style={{
                              position: 'sticky',
                              left: 0,
                              zIndex: 1,
                              background: '#fff'
                            }}
                          >
                            <strong>{alumno.nombre}</strong>
                            {alumno.rut && (
                              <div>
                                <small>{alumno.rut}</small>
                              </div>
                            )}
                          </td>

                          {evaluacionesAgrupadas.map((evaluacion) => {
                            const registro = evaluacion.notas[alumno.id];
                            const claveCelda = `${evaluacion.clave}_${alumno.id}`;

                            const valorNota = edicionesNotas[claveCelda] !== undefined
                              ? edicionesNotas[claveCelda]
                              : (registro?.nota ?? '');

                            return (
                              <td
                                key={evaluacion.clave}
                                title={`${evaluacion.tipoEvaluacion} · ${evaluacion.porcentaje}%`}
                                style={{ textAlign: 'center' }}
                              >
                                <input
                                  type="number"
                                  min="1"
                                  max="7"
                                  step="0.1"
                                  placeholder="—"
                                  value={valorNota}
                                  disabled={guardandoEvaluacion || !puedeEditarAsignaturaActual}
                                  onChange={(e) =>
                                    cambiarNotaGrilla(
                                      evaluacion.clave,
                                      alumno.id,
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    width: '75px',
                                    padding: '7px',
                                    textAlign: 'center',
                                    border: '1px solid #d0d7de',
                                    borderRadius: '6px'
                                  }}
                                />
                              </td>
                            );
                          })}

                          <td style={{ textAlign: 'center' }}>
                            {resultado ? (
                              <div>
                                <strong
                                  className={
                                    resultado.promedio >= 4
                                      ? 'nota-aprobada'
                                      : 'nota-reprobada'
                                  }
                                  style={{ fontSize: '16px' }}
                                >
                                  {resultado.promedio.toFixed(1)}
                                </strong>

                                <div>
                                  <small>
                                    {resultado.definitivo
                                      ? 'Promedio Final'
                                      : `Parcial · ${resultado.porcentajeIngresado.toFixed(0)}%`}
                                  </small>
                                </div>
                              </div>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {puedeEditarAsignaturaActual && (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                        padding: '15px 0'
                      }}
                    >
                      {evaluacionesAgrupadas.map((evaluacion) => (
                        <button
                          key={evaluacion.clave}
                          type="button"
                          className="btn-primary"
                          disabled={guardandoEvaluacion}
                          onClick={() => guardarEvaluacionMasiva(evaluacion)}
                        >
                          {guardandoEvaluacion
                            ? 'Guardando...'
                            : `Guardar: ${evaluacion.tipoEvaluacion}`}
                        </button>
                      ))}
                    </div>

                    <p style={{ fontSize: '12px', color: '#666' }}>
                      Las notas modificadas se guardan al presionar
                      el botón de la evaluación correspondiente.
                      Los campos vacíos quedan como notas pendientes.
                    </p>
                  </>
                )}
              </div>
            )}

          </section>
        )}

        {pestana === 'asistencia' && (
          <section className="curso-panel">

            <div className="panel-header">
              <div>
                <h2>📅 Asistencia</h2>
                <p>Registra la asistencia de tus alumnos.</p>
              </div>
            </div>

            <div className="attendance-date">
              <div className="form-group">
                <label>Fecha</label>

                <input
                  type="date"
                  value={fechaAsistencia}
                  onChange={(e) => setFechaAsistencia(e.target.value)}
                />
              </div>
            </div>

            <div className="attendance-stats">

              <div>
                <strong>{estadisticasAsistencia.presentes}</strong>
                <span>Presentes</span>
              </div>

              <div>
                <strong>{estadisticasAsistencia.ausentes}</strong>
                <span>Ausentes</span>
              </div>

              <div>
                <strong>{estadisticasAsistencia.atrasados}</strong>
                <span>Atrasados</span>
              </div>

              <div>
                <strong>{estadisticasAsistencia.justificados}</strong>
                <span>Justificados</span>
              </div>

            </div>

            {cargandoAsistencia ? (
              <div className="loading-state">
                Cargando asistencia...
              </div>
            ) : (
              <div className="attendance-list">

                {alumnos.map((alumno, index) => {
                  const estado = obtenerEstadoAlumno(alumno.id);

                  return (
                    <div
                      className="attendance-row"
                      key={alumno.id}
                    >

                      <div className="attendance-student">
                        <span className="student-number">
                          {index + 1}
                        </span>

                        <div>
                          <strong>{alumno.nombre}</strong>
                          <small>{alumno.rut}</small>
                        </div>
                      </div>

                      <div className="attendance-buttons">

                        <button
                          className={
                            estado === 'PRESENTE'
                              ? 'attendance-btn selected present'
                              : 'attendance-btn present'
                          }
                          onClick={() =>
                            guardarEstadoAsistencia(alumno.id, 'PRESENTE')
                          }
                        >
                          ✓ Presente
                        </button>

                        <button
                          className={
                            estado === 'AUSENTE'
                              ? 'attendance-btn selected absent'
                              : 'attendance-btn absent'
                          }
                          onClick={() =>
                            guardarEstadoAsistencia(alumno.id, 'AUSENTE')
                          }
                        >
                          ✕ Ausente
                        </button>

                        <button
                          className={
                            estado === 'ATRASADO'
                              ? 'attendance-btn selected late'
                              : 'attendance-btn late'
                          }
                          onClick={() =>
                            guardarEstadoAsistencia(alumno.id, 'ATRASADO')
                          }
                        >
                          ⏰ Atrasado
                        </button>

                        <button
                          className={
                            estado === 'JUSTIFICADO'
                              ? 'attendance-btn selected justified'
                              : 'attendance-btn justified'
                          }
                          onClick={() =>
                            guardarEstadoAsistencia(alumno.id, 'JUSTIFICADO')
                          }
                        >
                          📄 Justificado
                        </button>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </section>
        )}

        {pestana === 'anotaciones' && (
          <section className="curso-panel">

            <div className="panel-header">
              <div>
                <h2>📋 Anotaciones</h2>
                <p>Registra observaciones sobre tus alumnos.</p>
              </div>

              <button
                className="btn-primary"
                onClick={() =>
                  setMostrarFormularioAnotacion(!mostrarFormularioAnotacion)
                }
              >
                {mostrarFormularioAnotacion
                  ? '✕ Cerrar'
                  : '+ Nueva anotación'}
              </button>
            </div>

            {mostrarFormularioAnotacion && (
              <form
                className="form-card"
                onSubmit={crearAnotacion}
              >

                <h3>Nueva anotación</h3>

                <div className="form-grid">

                  <div className="form-group">
                    <label>Alumno</label>

                    <select
                      value={anotacionForm.alumnoId}
                      onChange={(e) =>
                        setAnotacionForm({
                          ...anotacionForm,
                          alumnoId: e.target.value
                        })
                      }
                      required
                    >
                      <option value="">Seleccionar alumno</option>

                      {alumnos.map((alumno) => (
                        <option key={alumno.id} value={alumno.id}>
                          {alumno.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tipo</label>

                    <select
                      value={anotacionForm.tipo}
                      onChange={(e) =>
                        setAnotacionForm({
                          ...anotacionForm,
                          tipo: e.target.value
                        })
                      }
                    >
                      <option value="POSITIVA">Positiva</option>
                      <option value="NEGATIVA">Negativa</option>
                      <option value="OBSERVACION">Observación</option>
                    </select>
                  </div>

                  <div className="form-group form-group-full">
                    <label>Título</label>

                    <input
                      type="text"
                      placeholder="Ej: Participación destacada"
                      value={anotacionForm.titulo}
                      onChange={(e) =>
                        setAnotacionForm({
                          ...anotacionForm,
                          titulo: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Descripción</label>

                    <textarea
                      rows="4"
                      placeholder="Escribe la anotación..."
                      value={anotacionForm.descripcion}
                      onChange={(e) =>
                        setAnotacionForm({
                          ...anotacionForm,
                          descripcion: e.target.value
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha</label>

                    <input
                      type="date"
                      value={anotacionForm.fecha}
                      onChange={(e) =>
                        setAnotacionForm({
                          ...anotacionForm,
                          fecha: e.target.value
                        })
                      }
                    />
                  </div>

                </div>

                <div className="form-actions">

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setMostrarFormularioAnotacion(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Guardar anotación
                  </button>

                </div>

              </form>
            )}

            {cargandoAnotaciones ? (
              <div className="loading-state">
                Cargando anotaciones...
              </div>
            ) : anotaciones.length === 0 ? (
              <div className="empty-state">
                <div>📋</div>
                <h3>No hay anotaciones</h3>
                <p>Las anotaciones que registres aparecerán aquí.</p>
              </div>
            ) : (
              <div className="anotaciones-list">

                {anotaciones.map((anotacion) => (
                  <article
                    className={`anotacion-card ${anotacion.tipo?.toLowerCase() || ''}`}
                    key={anotacion.id}
                  >

                    <div className="anotacion-top">
                      <div>
                        <span
                          className={`anotacion-tipo ${anotacion.tipo?.toLowerCase() || ''}`}
                        >
                          {textoTipoAnotacion(anotacion.tipo)}
                        </span>

                        <h3>{anotacion.titulo || 'Sin título'}</h3>
                      </div>

                      <button
                        className="btn-delete"
                        onClick={() => eliminarAnotacion(anotacion.id)}
                      >
                        🗑️
                      </button>
                    </div>

                    <p>{anotacion.descripcion}</p>

                    <div className="anotacion-footer">
                      <strong>{anotacion.alumno}</strong>
                      <span>{formatearFecha(anotacion.fecha)}</span>
                    </div>

                  </article>
                ))}

              </div>
            )}

          </section>
        )}

        {pestana === 'informacion-alumno' && (
          <section className="curso-panel">

            <div className="panel-header">
              <div>
                <h2>👤 Información del alumno</h2>
                <p>
                  Consulta los datos personales, apoderados y antecedentes
                  relevantes del estudiante.
                </p>
              </div>
            </div>

            <div className="form-card">
              <div className="form-group form-group-full">
                <label>Seleccionar alumno</label>

                <select
                  value={alumnoSeleccionadoId}
                  onChange={(e) => {
                    const id = e.target.value;

                    setAlumnoSeleccionadoId(id);

                    if (!id) {
                      setInformacionAlumno(null);
                    }
                  }}
                >
                  <option value="">Seleccionar alumno</option>

                  {alumnos.map((alumno) => (
                    <option key={alumno.id} value={alumno.id}>
                      {alumno.nombre} {alumno.rut ? `· ${alumno.rut}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {cargandoInformacionAlumno && (
              <div className="empty-state">
                <div>⏳</div>
                <h3>Cargando información...</h3>
              </div>
            )}

            {!cargandoInformacionAlumno && !informacionAlumno && (
              <div className="empty-state">
                <div>👤</div>
                <h3>Selecciona un alumno</h3>
                <p>
                  Selecciona un estudiante para consultar su información.
                </p>
              </div>
            )}

            {!cargandoInformacionAlumno && informacionAlumno && (
              <>

                <div className="information-section">
                  <h3>Datos del alumno</h3>

                  <div className="info-grid">

                    <div className="info-box">
                      <span>Nombre completo</span>
                      <strong>{informacionAlumno.nombre || '-'}</strong>
                    </div>

                    <div className="info-box">
                      <span>RUT</span>
                      <strong>{informacionAlumno.rut || '-'}</strong>
                    </div>

                    <div className="info-box">
                      <span>Fecha de nacimiento</span>
                      <strong>
                        {formatearFecha(informacionAlumno.fechaNacimiento)}
                      </strong>
                    </div>

                    <div className="info-box">
                      <span>Sexo</span>
                      <strong>{informacionAlumno.sexo || '-'}</strong>
                    </div>

                  </div>
                </div>

                <div className="information-section">
                  <h3>Apoderados</h3>

                  {informacionAlumno.apoderados?.length ? (
                    <div className="table-wrapper">
                      <table className="curso-table">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>RUT</th>
                            <th>Parentesco</th>
                            <th>Teléfono</th>
                            <th>Correo</th>
                            <th>Principal</th>
                          </tr>
                        </thead>

                        <tbody>
                          {informacionAlumno.apoderados.map((apoderado) => (
                            <tr key={apoderado.id}>
                              <td>
                                <strong>{apoderado.nombre || '-'}</strong>
                              </td>

                              <td>{apoderado.rut || '-'}</td>
                              <td>{apoderado.parentesco || '-'}</td>
                              <td>{apoderado.telefono || '-'}</td>
                              <td>{apoderado.correo || '-'}</td>

                              <td>
                                {apoderado.esApoderadoPrincipal ? 'Sí' : 'No'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div>👨‍👩‍👧</div>
                      <h3>Sin apoderados registrados</h3>
                      <p>No hay apoderados asociados a este alumno.</p>
                    </div>
                  )}
                </div>

                <div className="information-section">
                  <h3>Condición especial / observaciones relevantes</h3>

                  <div className="info-box">
                    <span>Antecedentes registrados en la matrícula</span>

                    <strong>
                      {informacionAlumno.observacionesRelevantes ||
                        'No registra información especial.'}
                    </strong>
                  </div>
                </div>

              </>
            )}

          </section>
        )}

        {pestana === 'informacion' && (
          <section className="curso-panel">

            <div className="panel-header">
              <div>
                <h2>Información del curso</h2>
                <p>Información general y asignaturas.</p>
              </div>
            </div>

            <div className="info-grid">

              <div className="info-box">
                <span>Curso</span>
                <strong>{curso?.nombre || '-'}</strong>
              </div>

              <div className="info-box">
                <span>Año</span>
                <strong>{curso?.anio || '-'}</strong>
              </div>

              <div className="info-box">
                <span>Jornada</span>
                <strong>{curso?.jornada || '-'}</strong>
              </div>

              <div className="info-box">
                <span>Código nivel</span>
                <strong>{curso?.codigoNivel || '-'}</strong>
              </div>

              <div className="info-box">
                <span>Profesor jefe</span>
                <strong>{curso?.esProfesorJefe ? 'Sí' : 'No'}</strong>
              </div>

              <div className="info-box">
                <span>Alumnos</span>
                <strong>{alumnos.length}</strong>
              </div>

            </div>

            <div className="information-section">
              <h3>Mis asignaturas</h3>

              <div className="asignaturas-list">

                {asignaturas.map((asignatura) => (
                  <div
                    className="asignatura-item"
                    key={asignatura.id}
                  >
                    <strong>{asignatura.nombre}</strong>

                    {asignatura.codigo && (
                      <span>{asignatura.codigo}</span>
                    )}
                  </div>
                ))}

              </div>
            </div>

            {curso?.esProfesorJefe && (
              <div className="information-section horario-section">

                <h3>🗓️ Horario de clases del curso</h3>

                <p className="horario-descripcion">
                  Horario completo de las clases de este curso.
                </p>

                {horario.length === 0 ? (
                  <div className="empty-state">
                    <div>🗓️</div>
                    <h3>No hay horario registrado</h3>
                    <p>
                      No existen clases registradas para este curso.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="curso-table">
                      <thead>
                        <tr>
                          <th>Día</th>
                          <th>Hora</th>
                          <th>Asignatura</th>
                          <th>Profesor</th>
                        </tr>
                      </thead>

                      <tbody>
                        {horario.map((clase) => (
                          <tr key={clase.id}>
                            <td>
                              <strong>
                                {obtenerNombreDia(clase.diaSemana)}
                              </strong>
                            </td>

                            <td>
                              {formatearHora(clase.horaInicio)}
                              {' - '}
                              {formatearHora(clase.horaFin)}
                            </td>

                            <td>
                              <strong>{clase.asignatura || '-'}</strong>

                              {clase.codigoAsignatura && (
                                <small>{clase.codigoAsignatura}</small>
                              )}
                            </td>

                            <td>{clase.docente || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            )}

          </section>
        )}

        {pestana === 'jefatura' && curso?.esProfesorJefe && (
          <section className="curso-panel">
            <div className="panel-header">
              <div>
                <h2>⭐ Panel de Jefatura ·  Situación Curso</h2>
                <p>
                  Puedes revisar calificaciones y rendimiento en modo lectura.
                </p>
              </div>
            </div>

            {!asignaturaNotas ? (
              <div>
                <p style={{ marginBottom: '15px', fontWeight: 'bold', color: '#33272c' }}>
                  Selecciona una asignatura para supervisar sus registros:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' }}>
                  {asignaturas
                    .filter((a) => {
                      const esPropia = a.puedeEditar !== undefined ? Boolean(a.puedeEditar) : (a.esPropia !== undefined ? Boolean(a.esPropia) : true);
                      return !esPropia;
                    })
                    .map((asig) => (
                      <div
                        key={asig.id}
                        onClick={() => {
                          setAsignaturaNotas(asig.id);
                          setPeriodoNotas('1');
                        }}
                        style={{
                          background: '#fff',
                          border: '1px solid #e2d7db',
                          borderLeft: '5px solid #800020',
                          borderRadius: '12px',
                          padding: '18px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <h3 style={{ margin: '0 0 6px 0', color: '#800020', fontSize: '16px' }}>
                          {asig.nombre}
                        </h3>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          Clic para ver notas y promedios
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setAsignaturaNotas('');
                      setNotas([]);
                    }}
                  >
                    ← Volver a la lista de asignaturas de Jefatura
                  </button>

                  <div className="form-group" style={{ margin: 0 }}>
                    <select
                      value={periodoNotas}
                      onChange={(e) => setPeriodoNotas(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d0d7de' }}
                    >
                      <option value="1">1° Semestre</option>
                      <option value="2">2° Semestre</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    borderLeft: '4px solid #991b1b',
                    color: '#991b1b',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🔒</span>
                  <div>
                    <strong>Modo Supervisión (Profesor Jefe):</strong> Estás visualizando las calificaciones de una asignatura ajena. Las notas se muestran estrictamente en formato de lectura y no pueden ser alteradas.
                  </div>
                </div>

                {cargandoNotas ? (
                  <div className="loading-state">Cargando calificaciones...</div>
                ) : evaluacionesAgrupadas.length === 0 ? (
                  <div className="empty-state">
                    <div>📝</div>
                    <h3>Sin evaluaciones registradas</h3>
                    <p>El docente a cargo aún no ha ingresado calificaciones en este período.</p>
                  </div>
                ) : (
                  <div className="table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
                    <table className="curso-table">
                      <thead>
                        <tr>
                          <th style={{ minWidth: '230px', position: 'sticky', left: 0, zIndex: 2, background: '#f4f6f9' }}>
                            Alumno
                          </th>
                          {evaluacionesAgrupadas.map((evaluacion) => (
                            <th key={evaluacion.clave} style={{ minWidth: '130px', textAlign: 'center' }}>
                              <div><strong>{evaluacion.tipoEvaluacion}</strong></div>
                              <small>{evaluacion.porcentaje}%</small>
                              <div><small>{formatearFecha(evaluacion.fecha)}</small></div>
                            </th>
                          ))}
                          <th style={{ minWidth: '130px', textAlign: 'center' }}>Promedio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnosOrdenados.map((alumno) => {
                          const resultado = calcularPromedioAlumno(alumno.id);

                          return (
                            <tr key={alumno.id}>
                              <td style={{ position: 'sticky', left: 0, zIndex: 1, background: '#fff' }}>
                                <strong>{alumno.nombre}</strong>
                                {alumno.rut && <div><small>{alumno.rut}</small></div>}
                              </td>

                              {evaluacionesAgrupadas.map((evaluacion) => {
                                const registro = evaluacion.notas[alumno.id];
                                const valorNota = registro?.nota;

                                return (
                                  <td key={evaluacion.clave} style={{ textAlign: 'center' }}>
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        minWidth: '45px',
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        backgroundColor: valorNota !== undefined && valorNota !== null ? '#f8fafc' : 'transparent',
                                        border: valorNota !== undefined && valorNota !== null ? '1px solid #e2e8f0' : 'none',
                                        fontWeight: '600',
                                        color: valorNota !== undefined && valorNota !== null && Number(valorNota) < 4 ? '#dc2626' : '#1e293b'
                                      }}
                                    >
                                      {valorNota !== undefined && valorNota !== null ? Number(valorNota).toFixed(1) : '—'}
                                    </span>
                                  </td>
                                );
                              })}

                              <td style={{ textAlign: 'center' }}>
                                {resultado ? (
                                  <strong className={resultado.promedio >= 4 ? 'nota-aprobada' : 'nota-reprobada'} style={{ fontSize: '15px' }}>
                                    {resultado.promedio.toFixed(1)}
                                  </strong>
                                ) : (
                                  <span>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}

function obtenerFechaActual() {
  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, '0');

  const dia = String(
    fecha.getDate()
  ).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

function obtenerHeaders() {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken');

  return token
    ? {
      Authorization: `Bearer ${token}`
    }
    : {};
}

async function leerRespuesta(response) {
  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.mensaje ||
      'Ocurrió un error en la solicitud.'
    );
  }

  return data;
}

function formatearFecha(fecha) {
  if (!fecha) return '-';

  const partes = String(fecha).split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return fecha;
}

function textoTipoAnotacion(tipo) {
  switch (String(tipo || '').toUpperCase()) {
    case 'POSITIVA':
      return '✓ Positiva';

    case 'NEGATIVA':
      return '⚠ Negativa';

    case 'OBSERVACION':
      return 'ℹ Observación';

    default:
      return tipo || 'Observación';
  }
}
