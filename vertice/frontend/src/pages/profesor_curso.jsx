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

const CURSOS_PRIMER_BASICO_IDS = [
  '11000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000002'
];

const esCursoGeneralista = (cursoInfo) => {
  return (
    String(cursoInfo?.codigoNivel || '').trim() === '010' ||
    CURSOS_PRIMER_BASICO_IDS.includes(String(cursoInfo?.id || ''))
  );
};

export default function ProfesorCurso() {

  const navigate = useNavigate();
  const { cursoId } = useParams();
  const [mesAsistencia, setMesAsistencia] = useState(obtenerMesActual());
  const [curso, setCurso] = useState(null);
  const [asignaturas, setAsignaturas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [horario, setHorario] = useState([]);
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState('');
  const [informacionAlumno, setInformacionAlumno] = useState(null);
  const [cargandoInformacionAlumno, setCargandoInformacionAlumno] = useState(false);
  const [asignaturaAsistencia, setAsignaturaAsistencia] = useState('');
  const [estadisticasMesCurso, setEstadisticasMesCurso] = useState(null);
  const [pestana, setPestana] = useState('alumnos');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [porcentajeGeneralCurso, setPorcentajeGeneralCurso] = useState(0);
  const [mesSeleccionadoActivo, setMesSeleccionadoActivo] = useState(true);
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
      setHorario(data.horario || []);

      const idsPropios = new Set();
      const nombresPropios = new Set();

      if (dashboardData?.cursos) {
        const cursoEnDashboard = dashboardData.cursos.find(
          (c) => String(c.id) === String(cursoId)
        );
        if (cursoEnDashboard?.asignaturas) {
          cursoEnDashboard.asignaturas.forEach((asig) => {
            if (asig.puedeGestionar !== false) {
              if (asig.id) idsPropios.add(String(asig.id));
              if (asig.nombre) nombresPropios.add(asig.nombre.trim().toLowerCase());
            }
          });
        }
      }

      const generalista = esCursoGeneralista(cursoInfo);

      const asignaturasMarcadas = todasAsignaturasCurso.map((asig) => {
        const idStr = String(asig.id);
        const nombreStr = (asig.nombre || '').trim().toLowerCase();

        let esPropia = true;
        if (cursoInfo?.esProfesorJefe) {
          if (generalista) {
            esPropia = true;
          } else if (asig.puedeGestionar !== undefined) {
            esPropia = Boolean(asig.puedeGestionar);
          } else {
            esPropia = idsPropios.has(idStr) || nombresPropios.has(nombreStr);
          }
        }

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
      const data = await fetchConAuth(`/api/docentes/me/alumnos/${alumnoId}/informacion`);
      setInformacionAlumno(data.alumno || null);
    } catch (error) {
      console.error('Error cargando información del alumno:', error);
      setInformacionAlumno(null);
      alert(error.message || 'No se pudo cargar la información del alumno.');
    } finally {
      setCargandoInformacionAlumno(false);
    }
  };

  useEffect(() => {
    if ((pestana === 'notas' || pestana === 'jefatura') && cursoId && asignaturaNotas) {
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
      alert(error.message || 'No se pudieron cargar las notas.');
    } finally {
      setCargandoNotas(false);
    }
  };

  const obtenerNombreMes = (ym) => {
    if (!ym || !String(ym).includes('-')) return '';
    const [, mesNum] = String(ym).split('-');
    const nombres = {
      '01': 'Enero',
      '02': 'Febrero',
      '03': 'Marzo',
      '04': 'Abril',
      '05': 'Mayo',
      '06': 'Junio',
      '07': 'Julio',
      '08': 'Agosto',
      '09': 'Septiembre',
      '10': 'Octubre',
      '11': 'Noviembre',
      '12': 'Diciembre'
    };
    return nombres[mesNum] || '';
  };

  const mesesDisponibles = useMemo(() => {
    const anioActual = (fechaAsistencia || obtenerFechaActual()).slice(0, 4);
    return [
      { value: `${anioActual}-03`, label: 'Marzo' },
      { value: `${anioActual}-04`, label: 'Abril' },
      { value: `${anioActual}-05`, label: 'Mayo' },
      { value: `${anioActual}-06`, label: 'Junio' },
      { value: `${anioActual}-07`, label: 'Julio' },
      { value: `${anioActual}-08`, label: 'Agosto' },
      { value: `${anioActual}-09`, label: 'Septiembre' },
      { value: `${anioActual}-10`, label: 'Octubre' },
      { value: `${anioActual}-11`, label: 'Noviembre' },
      { value: `${anioActual}-12`, label: 'Diciembre' }
    ];
  }, [fechaAsistencia]);

  const evaluacionesAgrupadas = useMemo(() => {
    const agrupadas = new Map();
    const notasFiltradas = notas.filter((nota) => {
      if (String(nota.periodo) !== String(periodoNotas)) return false;
      if (asignaturaNotas && String(nota.asignaturaId) !== String(asignaturaNotas)) return false;
      return true;
    });

    notasFiltradas.forEach((nota) => {
      const fecha = nota.fecha ? String(nota.fecha).slice(0, 10) : '';
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

    return Array.from(agrupadas.values()).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  }, [notas, periodoNotas, asignaturaNotas]);

  const resumenLogroJefatura = useMemo(() => {
    const clasificarNota = (valor) => {
      const n = Number(valor);
      if (!Number.isFinite(n) || n < 1 || n > 7) return null;
      if (n < 4.0) return 'NO_LOGRADO';
      if (n < 6.0) return 'MEDIANAMENTE_LOGRADO';
      return 'LOGRADO';
    };

    let noLogrado = 0;
    let medianamenteLogrado = 0;
    let logrado = 0;
    const alumnosNoLogradosMap = new Map();

    alumnosOrdenados.forEach((alumno) => {
      const resultadoPromedio = calcularPromedioAlumno(alumno.id);
      const notasAlumno = [];

      evaluacionesAgrupadas.forEach((evaluacion) => {
        const registro = evaluacion.notas[alumno.id];
        if (registro?.nota !== null && registro?.nota !== undefined && registro?.nota !== '') {
          const numNota = Number(registro.nota);
          if (Number.isFinite(numNota)) {
            notasAlumno.push({
              evaluacion: evaluacion.tipoEvaluacion,
              nota: numNota
            });
            const cat = clasificarNota(numNota);
            if (cat === 'NO_LOGRADO') noLogrado += 1;
            else if (cat === 'MEDIANAMENTE_LOGRADO') medianamenteLogrado += 1;
            else if (cat === 'LOGRADO') logrado += 1;
          }
        }
      });

      const promedioNum = resultadoPromedio ? Number(resultadoPromedio.promedio) : null;
      const notasBajas = notasAlumno.filter((item) => item.nota < 4.0);
      const promedioEnNoLogrado = promedioNum !== null && promedioNum < 4.0;

      if (promedioEnNoLogrado || notasBajas.length > 0) {
        alumnosNoLogradosMap.set(alumno.id, {
          id: alumno.id,
          nombre: alumno.nombre,
          rut: alumno.rut,
          promedio: promedioNum,
          notasBajas
        });
      }
    });

    const totalCalificaciones = noLogrado + medianamenteLogrado + logrado;
    const pctNoLogrado = totalCalificaciones > 0 ? ((noLogrado / totalCalificaciones) * 100).toFixed(1) : '0.0';
    const pctMedianamente = totalCalificaciones > 0 ? ((medianamenteLogrado / totalCalificaciones) * 100).toFixed(1) : '0.0';
    const pctLogrado = totalCalificaciones > 0 ? ((logrado / totalCalificaciones) * 100).toFixed(1) : '0.0';

    return {
      noLogrado,
      medianamenteLogrado,
      logrado,
      totalCalificaciones,
      pctNoLogrado,
      pctMedianamente,
      pctLogrado,
      alumnosNoLogrados: Array.from(alumnosNoLogradosMap.values())
    };
  }, [alumnosOrdenados, evaluacionesAgrupadas, edicionesNotas]);

  const { asignaturasPropias, asignaturasJefatura } = useMemo(() => {
    const propias = [];
    const jefatura = [];
    asignaturas.forEach((asig) => {
      if (asig.esPropia) propias.push(asig);
      else jefatura.push(asig);
    });
    return { asignaturasPropias: propias, asignaturasJefatura: jefatura };
  }, [asignaturas]);

  const asignaturaJefaturaActual = useMemo(() => {
    if (!asignaturaNotas) return null;
    return asignaturas.find((a) => String(a.id) === String(asignaturaNotas)) || null;
  }, [asignaturaNotas, asignaturas]);

  const puedeEditarAsignaturaActual = useMemo(() => {
    if (!asignaturaNotas) return false;
    const encontrada = asignaturas.find((a) => String(a.id) === String(asignaturaNotas));
    return encontrada ? Boolean(encontrada.esPropia) : false;
  }, [asignaturaNotas, asignaturas]);

  const alumnosOrdenados = useMemo(() => {
    return [...alumnos].sort((a, b) =>
      String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' })
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
      const valorNota = valorEditado !== undefined ? valorEditado : registro?.nota;

      if (valorNota !== null && valorNota !== undefined && valorNota !== '') {
        const nota = Number(valorNota);
        const porcentaje = Number(evaluacion.porcentaje || 0);
        if (Number.isFinite(nota) && nota >= 1 && nota <= 7 && porcentaje > 0) {
          sumaPonderada += nota * porcentaje;
          porcentajeIngresado += porcentaje;
        }
      }
    });

    if (porcentajeIngresado === 0) return null;

    return {
      promedio: sumaPonderada / porcentajeIngresado,
      porcentajeIngresado,
      porcentajePendiente: Math.max(0, 100 - porcentajeIngresado),
      definitivo: porcentajeIngresado >= 99.9999
    };
  };

  const cambiarNotaGrilla = (claveEvaluacion, alumnoId, valor) => {
    const claveCelda = `${claveEvaluacion}_${alumnoId}`;
    setEdicionesNotas((actual) => ({ ...actual, [claveCelda]: valor }));
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
      const nota = valorEditado !== undefined ? valorEditado : (registroExistente?.nota ?? null);

      return {
        alumnoId: alumno.id,
        nota: nota === '' || nota === null || nota === undefined ? null : Number(nota)
      };
    });

    const invalidas = listaAlumnos.filter(
      (alumno) => alumno.nota !== null && (!Number.isFinite(alumno.nota) || alumno.nota < 1 || alumno.nota > 7)
    );

    if (invalidas.length > 0) {
      alert('Hay notas inválidas. Deben estar entre 1,0 y 7,0.');
      return false;
    }

    try {
      setGuardandoEvaluacion(true);
      const data = await fetchConAuth('/api/notas/masivas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      alert(error.message || 'No fue posible guardar la evaluación.');
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
    if (
      !Number.isFinite(porcentaje) ||
      porcentaje <= 0 ||
      porcentaje > 100
    ) {
      alert('La ponderación debe ser mayor que 0 y no superar el 100%.');
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

  useEffect(() => {
    if (pestana === 'asistencia' && cursoId && fechaAsistencia) {
      cargarAsistencia();
    }
  }, [pestana, cursoId, fechaAsistencia]);

  const cargarAsistencia = async () => {
    try {
      setCargandoAsistencia(true);
      const url = `/api/docentes/me/cursos/${cursoId}/asistencia?fecha=${encodeURIComponent(fechaAsistencia)}&mes=${encodeURIComponent(mesAsistencia)}`;
      const data = await fetchConAuth(url);
      setAsistencia(data.alumnos || []);
      setEstadisticasMesCurso(data.estadisticasMes || null);
      setPorcentajeGeneralCurso(
        data.porcentajeGeneralCurso !== undefined ? Number(data.porcentajeGeneralCurso) : 0
      );
    } catch (error) {
      console.error('Error cargando asistencia:', error);
      alert(error.message || 'No se pudo cargar la asistencia.');
    } finally {
      setCargandoAsistencia(false);
    }
  };

  useEffect(() => {
    if (pestana === 'asistencia' && cursoId && fechaAsistencia) {
      cargarAsistencia();
    }
  }, [pestana, cursoId, fechaAsistencia, mesAsistencia]);

  const guardarEstadoAsistencia = async (alumnoId, estado, observacion = '') => {
    try {
      await guardarAsistenciaCurso(cursoId, fechaAsistencia, alumnoId, estado, observacion || '');

      setAsistencia((actual) => {
        const copia = [...actual];
        const indice = copia.findIndex((item) => item.id === alumnoId || item.alumnoId === alumnoId);
        if (indice >= 0) {
          copia[indice] = { ...copia[indice], estado, observacion: observacion || '' };
        }
        return copia;
      });

      const url = `/api/docentes/me/cursos/${cursoId}/asistencia?fecha=${encodeURIComponent(fechaAsistencia)}&mes=${encodeURIComponent(mesAsistencia)}`;
      const dataActualizada = await fetchConAuth(url);
      if (dataActualizada?.alumnos) setAsistencia(dataActualizada.alumnos);
      if (dataActualizada?.estadisticasMes) setEstadisticasMesCurso(dataActualizada.estadisticasMes);
      if (dataActualizada?.porcentajeGeneralCurso !== undefined) {
        setPorcentajeGeneralCurso(Number(dataActualizada.porcentajeGeneralCurso));
      }
    } catch (error) {
      console.error('Error guardando asistencia:', error);
      alert(error.message || 'No se pudo guardar la asistencia.');
    }
  };

  const obtenerEstadoAlumno = (alumnoId) => {
    const registro = asistencia.find((item) => item.alumnoId === alumnoId || item.id === alumnoId);
    return registro?.estado || null;
  };

  const estadisticasAsistencia = useMemo(() => {
    return {
      presentes: asistencia.filter((item) => item.estado === 'PRESENTE').length,
      ausentes: asistencia.filter((item) => item.estado === 'AUSENTE').length,
      atrasados: asistencia.filter((item) => item.estado === 'ATRASADO').length,
      justificados: asistencia.filter((item) => item.estado === 'JUSTIFICADO').length
    };
  }, [asistencia]);

  useEffect(() => {
    if ((pestana === 'anotaciones' || pestana === 'jefatura') && cursoId) {
      cargarAnotaciones();
    }
  }, [pestana, cursoId]);

  const cargarAnotaciones = async () => {
    try {
      setCargandoAnotaciones(true);
      const data = await fetchConAuth(`/api/anotaciones/curso/${cursoId}`);
      setAnotaciones(data.anotaciones || []);
    } catch (error) {
      console.error('Error cargando anotaciones:', error);
      alert(error.message || 'No se pudieron cargar las anotaciones.');
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

      const data = await fetchConAuth('/api/anotaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumnoId: anotacionForm.alumnoId,
          cursoId,
          tipo: anotacionForm.tipo,
          titulo: anotacionForm.titulo || null,
          descripcion: anotacionForm.descripcion,
          fecha: anotacionForm.fecha || null
        })
      });

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
      alert(error.message || 'No se pudo registrar la anotación.');
    }
  };

  const eliminarAnotacion = async (anotacionId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta anotación?')) return;
    try {
      const data = await fetchConAuth(`/api/anotaciones/${anotacionId}`, { method: 'DELETE' });
      alert(data.mensaje || 'Anotación eliminada correctamente.');
      await cargarAnotaciones();
    } catch (error) {
      console.error('Error eliminando anotación:', error);
      alert(error.message || 'No se pudo eliminar la anotación.');
    }
  };

  const volver = () => navigate('/profesores_dashboard');
  const cerrarSesion = () => { logoutService(); navigate('/'); };

  const bloquesHorarios = useMemo(() => {
    const horasSet = new Set();
    horario.forEach((clase) => {
      if (clase.horaInicio && clase.horaFin) {
        horasSet.add(`${formatearHora(clase.horaInicio)} - ${formatearHora(clase.horaFin)}`);
      }
    });
    return Array.from(horasSet).sort();
  }, [horario]);

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
          <button className="btn-primary" onClick={volver}>Volver a mis cursos</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profesor-curso-container">
      <header className="profesor-curso-header">
        <div className="header-course-info">
          <button className="back-button" onClick={volver}>← Mis cursos</button>
          <div>
            <h1>{curso?.nombre}</h1>
            <p>Panel del curso · {curso?.anio}</p>
          </div>
        </div>
        <button className="logout-button" onClick={cerrarSesion}>Cerrar sesión</button>
      </header>

      <main className="profesor-curso-content">
        <section className="curso-resumen">
          <div className="resumen-item">
            <span className="resumen-icon">👥</span>
            <div><strong>{alumnos.length}</strong><span>Alumnos</span></div>
          </div>
          <div className="resumen-item">
            <span className="resumen-icon">📚</span>
            <div><strong>{asignaturas.length}</strong><span>Asignaturas</span></div>
          </div>
          <div className="resumen-item">
            <span className="resumen-icon">📝</span>
            <div><strong>{notas.length}</strong><span>Notas cargadas</span></div>
          </div>
          <div className="resumen-item">
            <span className="resumen-icon">📋</span>
            <div><strong>{anotaciones.length}</strong><span>Anotaciones</span></div>
          </div>
        </section>

        <nav className="curso-tabs">
          <button className={pestana === 'alumnos' ? 'curso-tab active' : 'curso-tab'} onClick={() => setPestana('alumnos')}>👥 Alumnos</button>
          <button className={pestana === 'notas' ? 'curso-tab active' : 'curso-tab'} onClick={() => setPestana('notas')}>📝 Notas</button>
          <button className={pestana === 'asistencia' ? 'curso-tab active' : 'curso-tab'} onClick={() => setPestana('asistencia')}>📅 Asistencia</button>
          <button className={pestana === 'anotaciones' ? 'curso-tab active' : 'curso-tab'} onClick={() => setPestana('anotaciones')}>📋 Anotaciones</button>
          <button className={pestana === 'informacion-alumno' ? 'curso-tab active' : 'curso-tab'} onClick={() => setPestana('informacion-alumno')}>👤 Información del alumno</button>
          <button className={pestana === 'informacion' ? 'curso-tab active' : 'curso-tab'} onClick={() => setPestana('informacion')}>ℹ️ Información</button>
          {curso?.esProfesorJefe && asignaturasJefatura.length > 0 && (
            <button className={pestana === 'jefatura' ? 'curso-tab active' : 'curso-tab'} onClick={() => { setPestana('jefatura'); setAsignaturaNotas(''); }}>⭐ Jefatura (Solo Lectura)</button>
          )}
        </nav>

        {pestana === 'alumnos' && (
          <section className="curso-panel">
            <div className="panel-header">
              <div><h2>👥 Alumnos</h2><p>Estudiantes matriculados en este curso.</p></div>
              <span className="count-badge">{alumnos.length}</span>
            </div>
            {alumnos.length === 0 ? (
              <div className="empty-state"><div>👥</div><h3>No hay alumnos</h3></div>
            ) : (
              <div className="table-wrapper">
                <table className="curso-table">
                  <thead><tr><th>#</th><th>Alumno</th><th>RUT</th><th>Sexo</th><th>Información</th></tr></thead>
                  <tbody>
                    {alumnos.map((alumno, index) => (
                      <tr key={alumno.id}>
                        <td>{index + 1}</td>
                        <td><strong>{alumno.nombre}</strong></td>
                        <td>{alumno.rut || '-'}</td>
                        <td>{alumno.sexo || '-'}</td>
                        <td>
                          <button type="button" className="btn-primary" onClick={() => { setAlumnoSeleccionadoId(alumno.id); setPestana('informacion-alumno'); }}>Ver información</button>
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
              <div><h2>Libro de clases · Notas</h2><p>Registra evaluaciones y calificaciones de tus asignaturas.</p></div>
              {asignaturaNotas && puedeEditarAsignaturaActual && (
                <button className="btn-primary" disabled={guardandoEvaluacion} onClick={() => setMostrarNuevaEvaluacion(!mostrarNuevaEvaluacion)}>
                  {mostrarNuevaEvaluacion ? '✕ Cerrar' : '+ Nueva evaluación'}
                </button>
              )}
            </div>
            <div className="filter-row" style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'end', marginBottom: '20px' }}>
              <div className="form-group">
                <label>Asignatura</label>
                <select value={asignaturaNotas} onChange={(e) => { setAsignaturaNotas(e.target.value); setEdicionesNotas({}); setMostrarNuevaEvaluacion(false); }}>
                  <option value="">Seleccionar asignatura</option>
                  {asignaturasPropias.map((asignatura) => (
                    <option key={asignatura.id} value={asignatura.id}>{asignatura.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Período académico</label>
                <select value={periodoNotas} onChange={(e) => { setPeriodoNotas(e.target.value); setEdicionesNotas({}); setMostrarNuevaEvaluacion(false); }}>
                  <option value="1">1° Semestre / Período</option>
                  <option value="2">2° Semestre / Período</option>
                </select>
              </div>
            </div>

            {asignaturaNotas && (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div className="info-box"><span>Ponderación registrada</span><strong>{porcentajePeriodo.toFixed(2)}%</strong></div>
                <div className="info-box"><span>Ponderación disponible</span><strong>{Math.max(0, 100 - porcentajePeriodo).toFixed(2)}%</strong></div>
                <div className="info-box"><span>Evaluaciones</span><strong>{evaluacionesAgrupadas.length}</strong></div>
              </div>
            )}

            {mostrarNuevaEvaluacion && puedeEditarAsignaturaActual && (
              <form className="form-card" onSubmit={crearNuevaEvaluacion} style={{ marginBottom: '20px' }}>
                <h3>Crear evaluación para todo el curso</h3>
                <p>Se creará una columna para todos los alumnos. Podrás ingresar las calificaciones después.</p>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre de la evaluación</label>
                    <input type="text" maxLength="100" placeholder="Ej: Prueba unidad 1" value={nuevaEvaluacion.tipoEvaluacion} onChange={(e) => setNuevaEvaluacion({ ...nuevaEvaluacion, tipoEvaluacion: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Ponderación (%)</label>
                    <input type="number" min="0.01" max="100" step="0.01" placeholder="Ej: 30" value={nuevaEvaluacion.porcentaje} onChange={(e) => setNuevaEvaluacion({ ...nuevaEvaluacion, porcentaje: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Fecha de evaluación</label>
                    <input type="date" value={nuevaEvaluacion.fecha} onChange={(e) => setNuevaEvaluacion({ ...nuevaEvaluacion, fecha: e.target.value })} required />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Observación (opcional)</label>
                    <textarea rows="2" value={nuevaEvaluacion.observacion} onChange={(e) => setNuevaEvaluacion({ ...nuevaEvaluacion, observacion: e.target.value })} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setMostrarNuevaEvaluacion(false)} disabled={guardandoEvaluacion}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={guardandoEvaluacion}>{guardandoEvaluacion ? 'Guardando...' : 'Crear evaluación'}</button>
                </div>
              </form>
            )}

            {!asignaturaNotas ? (
              <div className="empty-state"><div>📚</div><h3>Selecciona una asignatura</h3></div>
            ) : cargandoNotas ? (
              <div className="loading-state">Cargando notas...</div>
            ) : evaluacionesAgrupadas.length === 0 ? (
              <div className="empty-state"><div>📝</div><h3>No hay evaluaciones registradas</h3><p>Utiliza el botón «Nueva evaluación» para crear la primera columna.</p></div>
            ) : (
              <div className="table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="curso-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '230px', position: 'sticky', left: 0, zIndex: 2, background: '#f4f6f9' }}>Alumno</th>
                      {evaluacionesAgrupadas.map((evaluacion) => (
                        <th key={evaluacion.clave} style={{ minWidth: '145px', textAlign: 'center' }}>
                          <div><strong>{evaluacion.tipoEvaluacion}</strong></div>
                          <small>{evaluacion.porcentaje}%</small>
                          <div><small>{formatearFecha(evaluacion.fecha)}</small></div>
                        </th>
                      ))}
                      <th style={{ minWidth: '150px', textAlign: 'center' }}>Promedio</th>
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
                            const claveCelda = `${evaluacion.clave}_${alumno.id}`;
                            const valorNota = edicionesNotas[claveCelda] !== undefined ? edicionesNotas[claveCelda] : (registro?.nota ?? '');
                            return (
                              <td key={evaluacion.clave} style={{ textAlign: 'center' }}>
                                <input
                                  type="number" min="1" max="7" step="0.1" placeholder="—"
                                  value={valorNota}
                                  disabled={guardandoEvaluacion || !puedeEditarAsignaturaActual}
                                  onChange={(e) => cambiarNotaGrilla(evaluacion.clave, alumno.id, e.target.value)}
                                  style={{ width: '75px', padding: '7px', textAlign: 'center', border: '1px solid #d0d7de', borderRadius: '6px' }}
                                />
                              </td>
                            );
                          })}
                          <td style={{ textAlign: 'center' }}>
                            {resultado ? (
                              <div>
                                <strong className={resultado.promedio >= 4 ? 'nota-aprobada' : 'nota-reprobada'} style={{ fontSize: '16px' }}>
                                  {resultado.promedio.toFixed(1)}
                                </strong>
                              </div>
                            ) : <span>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {puedeEditarAsignaturaActual && (
                  <>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '15px 0' }}>
                      {evaluacionesAgrupadas.map((evaluacion) => (
                        <button
                          key={evaluacion.clave}
                          type="button"
                          className="btn-primary"
                          disabled={guardandoEvaluacion}
                          onClick={() => guardarEvaluacionMasiva(evaluacion)}
                        >
                          {guardandoEvaluacion ? 'Guardando...' : `Guardar: ${evaluacion.tipoEvaluacion}`}
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      Las notas modificadas se guardan al presionar el botón de la evaluación correspondiente.
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
                <h2>📅 Control y Registro de Asistencia</h2>
                <p>Pasa la asistencia diaria del curso y revisa el porcentaje general y mensual.</p>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #800020 0%, #5a0016 100%)', color: '#fff', padding: '22px 26px', borderRadius: '14px', marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: '0 4px 12px rgba(128, 0, 32, 0.15)' }}>
              <div>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.2px', opacity: 0.85, fontWeight: '600' }}>
                  Porcentaje general del curso: {porcentajeGeneralCurso.toFixed(1)}%
                </span>
                <h3 style={{ margin: '6px 0 0 0', fontSize: '25px', fontWeight: '700' }}>
                  {mesSeleccionadoActivo && estadisticasMesCurso
                    ? `Porcentaje de ${obtenerNombreMes(mesAsistencia)}: ${Number(estadisticasMesCurso.porcentajeCurso || 0).toFixed(1)}%`
                    : `Porcentaje general del curso: ${porcentajeGeneralCurso.toFixed(1)}%`}
                </h3>
              </div>

              {mesSeleccionadoActivo && estadisticasMesCurso && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(255,255,255,0.14)', padding: '12px 18px', borderRadius: '10px', textAlign: 'center', minWidth: '85px' }}>
                    <strong style={{ display: 'block', fontSize: '20px' }}>{estadisticasMesCurso.presentes}</strong>
                    <span style={{ fontSize: '12px', opacity: 0.9 }}>Presentes</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.14)', padding: '12px 18px', borderRadius: '10px', textAlign: 'center', minWidth: '85px' }}>
                    <strong style={{ display: 'block', fontSize: '20px' }}>{estadisticasMesCurso.ausentes}</strong>
                    <span style={{ fontSize: '12px', opacity: 0.9 }}>Ausentes</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.14)', padding: '12px 18px', borderRadius: '10px', textAlign: 'center', minWidth: '85px' }}>
                    <strong style={{ display: 'block', fontSize: '20px' }}>{estadisticasMesCurso.atrasados}</strong>
                    <span style={{ fontSize: '12px', opacity: 0.9 }}>Atrasados</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.14)', padding: '12px 18px', borderRadius: '10px', textAlign: 'center', minWidth: '85px' }}>
                    <strong style={{ display: 'block', fontSize: '20px' }}>{estadisticasMesCurso.justificados}</strong>
                    <span style={{ fontSize: '12px', opacity: 0.9 }}>Justificados</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '25px', background: '#f8fafc', padding: '18px 22px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div className="form-group" style={{ margin: 0, maxWidth: '280px' }}>
                <label style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>📅 Fecha para pasar lista (Día)</label>
                <input
                  type="date"
                  value={fechaAsistencia}
                  onChange={(e) => {
                    const nuevaFecha = e.target.value;
                    setFechaAsistencia(nuevaFecha);
                    if (nuevaFecha) {
                      setMesAsistencia(nuevaFecha.slice(0, 7));
                      setMesSeleccionadoActivo(true);
                    }
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: '600', color: '#334155', marginBottom: '8px', display: 'block' }}>
                  Seleccionar mes:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {mesesDisponibles.map((m) => {
                    const activo = mesSeleccionadoActivo && mesAsistencia === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => {
                          setMesAsistencia(m.value);
                          setMesSeleccionadoActivo(true);
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: activo ? '2px solid #450a18' : '1px solid #800020',
                          backgroundColor: activo ? '#5a0016' : '#dc2626',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: activo ? '0 0 0 2px rgba(220, 38, 38, 0.35)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {cargandoAsistencia ? (
              <div className="loading-state">Cargando lista de asistencia...</div>
            ) : (
              <div className="table-wrapper">
                <table className="curso-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Alumno y RUT</th>
                      <th style={{ textAlign: 'center', width: '160px' }}>% Asistencia Total</th>
                      <th style={{ textAlign: 'center' }}>Pasar asistencia (Día: {formatearFecha(fechaAsistencia)})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.map((alumno, index) => {
                      const registroAsistencia = asistencia.find(
                        (item) => String(item.id || item.alumnoId) === String(alumno.id)
                      );
                      const estado = registroAsistencia?.estado || null;
                      const porcentajeAlumno = registroAsistencia?.porcentajeAsistencia !== undefined
                        ? Number(registroAsistencia.porcentajeAsistencia)
                        : 0.0;

                      return (
                        <tr key={alumno.id}>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{alumno.nombre}</strong>
                            {alumno.rut && <div><small style={{ color: '#64748b' }}>{alumno.rut}</small></div>}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              minWidth: '72px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: porcentajeAlumno >= 85 ? '#dcfce7' : porcentajeAlumno >= 75 ? '#fef9c3' : '#fee2e2',
                              color: porcentajeAlumno >= 85 ? '#166534' : porcentajeAlumno >= 75 ? '#854d0e' : '#991b1b',
                              fontWeight: '700',
                              fontSize: '14px'
                            }}>
                              {porcentajeAlumno.toFixed(1)}%
                            </span>
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => guardarEstadoAsistencia(alumno.id, 'PRESENTE')}
                                style={{
                                  padding: '7px 13px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: '1px solid #16a34a',
                                  background: estado === 'PRESENTE' ? '#16a34a' : '#f0fdf4',
                                  color: estado === 'PRESENTE' ? '#fff' : '#16a34a',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                ✓ Presente
                              </button>

                              <button
                                type="button"
                                onClick={() => guardarEstadoAsistencia(alumno.id, 'AUSENTE')}
                                style={{
                                  padding: '7px 13px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: '1px solid #dc2626',
                                  background: estado === 'AUSENTE' ? '#dc2626' : '#fef2f2',
                                  color: estado === 'AUSENTE' ? '#fff' : '#dc2626',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                ✕ Ausente
                              </button>

                              <button
                                type="button"
                                onClick={() => guardarEstadoAsistencia(alumno.id, 'ATRASADO')}
                                style={{
                                  padding: '7px 13px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: '1px solid #d97706',
                                  background: estado === 'ATRASADO' ? '#d97706' : '#fffbeb',
                                  color: estado === 'ATRASADO' ? '#fff' : '#d97706',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                ⏰ Atrasado
                              </button>

                              <button
                                type="button"
                                onClick={() => guardarEstadoAsistencia(alumno.id, 'JUSTIFICADO')}
                                style={{
                                  padding: '7px 13px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: '1px solid #2563eb',
                                  background: estado === 'JUSTIFICADO' ? '#2563eb' : '#eff6ff',
                                  color: estado === 'JUSTIFICADO' ? '#fff' : '#2563eb',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                📄 Justificado
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {pestana === 'anotaciones' && (
          <section className="curso-panel">
            <div className="panel-header">
              <div><h2>📋 Anotaciones</h2><p>Registra observaciones sobre tus alumnos.</p></div>
              <button className="btn-primary" onClick={() => setMostrarFormularioAnotacion(!mostrarFormularioAnotacion)}>
                {mostrarFormularioAnotacion ? '✕ Cerrar' : '+ Nueva anotación'}
              </button>
            </div>
            {mostrarFormularioAnotacion && (
              <form className="form-card" onSubmit={crearAnotacion}>
                <h3>Nueva anotación</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Alumno</label>
                    <select value={anotacionForm.alumnoId} onChange={(e) => setAnotacionForm({ ...anotacionForm, alumnoId: e.target.value })} required>
                      <option value="">Seleccionar alumno</option>
                      {alumnos.map((alumno) => (<option key={alumno.id} value={alumno.id}>{alumno.nombre}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo</label>
                    <select value={anotacionForm.tipo} onChange={(e) => setAnotacionForm({ ...anotacionForm, tipo: e.target.value })}>
                      <option value="POSITIVA">Positiva</option>
                      <option value="NEGATIVA">Negativa</option>
                      <option value="OBSERVACION">Observación</option>
                    </select>
                  </div>
                  <div className="form-group form-group-full">
                    <label>Título</label>
                    <input type="text" placeholder="Ej: Participación destacada" value={anotacionForm.titulo} onChange={(e) => setAnotacionForm({ ...anotacionForm, titulo: e.target.value })} />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Descripción</label>
                    <textarea rows="4" placeholder="Escribe la anotación..." value={anotacionForm.descripcion} onChange={(e) => setAnotacionForm({ ...anotacionForm, descripcion: e.target.value })} required />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setMostrarFormularioAnotacion(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary">Guardar anotación</button>
                </div>
              </form>
            )}
            {cargandoAnotaciones ? <div className="loading-state">Cargando anotaciones...</div> : anotaciones.length === 0 ? (
              <div className="empty-state"><div>📋</div><h3>No hay anotaciones</h3></div>
            ) : (
              <div className="anotaciones-list">
                {anotaciones.map((anotacion) => (
                  <article className={`anotacion-card ${anotacion.tipo?.toLowerCase() || ''}`} key={anotacion.id}>
                    <div className="anotacion-top">
                      <div>
                        <span className={`anotacion-tipo ${anotacion.tipo?.toLowerCase() || ''}`}>{textoTipoAnotacion(anotacion.tipo)}</span>
                        <h3>{anotacion.titulo || 'Sin título'}</h3>
                      </div>
                      <button className="btn-delete" onClick={() => eliminarAnotacion(anotacion.id)}>🗑️</button>
                    </div>
                    <p>{anotacion.descripcion}</p>
                    <div className="anotacion-footer"><strong>{anotacion.alumno}</strong><span>{formatearFecha(anotacion.fecha)}</span></div>
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
                <h2>👤 Ficha Completa del Alumno</h2>
                <p>Antecedentes académicos, familiares, de salud y socioeconómicos registrados en matrícula.</p>
              </div>
            </div>

            <div className="form-card" style={{ marginBottom: '20px' }}>
              <div className="form-group form-group-full" style={{ margin: 0 }}>
                <label>Seleccionar alumno</label>
                <select value={alumnoSeleccionadoId} onChange={(e) => { setAlumnoSeleccionadoId(e.target.value); if (!e.target.value) setInformacionAlumno(null); }}>
                  <option value="">Seleccionar alumno</option>
                  {alumnos.map((alumno) => (
                    <option key={alumno.id} value={alumno.id}>{alumno.nombre} {alumno.rut ? `· ${alumno.rut}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {cargandoInformacionAlumno && <div className="loading-state">Cargando información...</div>}

            {!cargandoInformacionAlumno && !informacionAlumno && (
              <div className="empty-state">
                <div>👤</div>
                <h3>Selecciona un alumno</h3>
                <p>Selecciona un estudiante para consultar su ficha completa.</p>
              </div>
            )}

            {!cargandoInformacionAlumno && informacionAlumno && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div className="information-section" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2d7db' }}>
                  <h3 style={{ color: '#800020', borderBottom: '2px solid #f4f2f3', paddingBottom: '8px', marginBottom: '15px' }}>📋 1. Datos Personales y Académicos</h3>
                  <div className="info-grid">
                    <div className="info-box"><span>Nombre completo</span><strong>{informacionAlumno.nombre || '-'}</strong></div>
                    <div className="info-box"><span>RUT</span><strong>{informacionAlumno.rut || '-'}</strong></div>
                    <div className="info-box"><span>Fecha de nacimiento</span><strong>{formatearFecha(informacionAlumno.fechaNacimiento)}</strong></div>
                    <div className="info-box"><span>Sexo</span><strong>{informacionAlumno.sexo || '-'}</strong></div>
                    <div className="info-box"><span>Procedencia escolar</span><strong>{informacionAlumno.procedenciaEscolar || 'No especificada'}</strong></div>
                    <div className="info-box"><span>¿Ha repetido curso?</span><strong>{informacionAlumno.haRepetido ? 'Sí' : 'No'}</strong></div>
                    <div className="info-box"><span>Pueblo indígena</span><strong>{informacionAlumno.pertenecePuebloIndigena ? 'Sí' : 'No'}</strong></div>
                    <div className="info-box"><span>Clases de Religión</span><strong>{informacionAlumno.optaReligion ? `Sí (${informacionAlumno.credoReligioso || 'No especificado'})` : 'No'}</strong></div>
                  </div>
                </div>

                <div className="information-section" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2d7db' }}>
                  <h3 style={{ color: '#800020', borderBottom: '2px solid #f4f2f3', paddingBottom: '8px', marginBottom: '15px' }}>👨‍👩‍👧 2. Apoderados y Contacto</h3>
                  {informacionAlumno.apoderados?.length ? (
                    <div className="table-wrapper">
                      <table className="curso-table">
                        <thead>
                          <tr><th>Nombre</th><th>RUT</th><th>Parentesco</th><th>Teléfono</th><th>Correo</th><th>Dirección / Comuna</th><th>Principal</th></tr>
                        </thead>
                        <tbody>
                          {informacionAlumno.apoderados.map((apoderado) => (
                            <tr key={apoderado.id}>
                              <td><strong>{apoderado.nombre || '-'}</strong></td>
                              <td>{apoderado.rut || '-'}</td>
                              <td>{apoderado.parentesco || '-'}</td>
                              <td>{apoderado.telefono || '-'}</td>
                              <td>{apoderado.correo || '-'}</td>
                              <td>{apoderado.direccion ? `${apoderado.direccion}, ${apoderado.comuna || ''}` : '-'}</td>
                              <td>{apoderado.esApoderadoPrincipal ? 'Sí' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state"><p>Sin apoderados registrados.</p></div>
                  )}
                </div>

                <div className="information-section" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2d7db' }}>
                  <h3 style={{ color: '#800020', borderBottom: '2px solid #f4f2f3', paddingBottom: '8px', marginBottom: '15px' }}>🏥 3. Salud y Previsión</h3>
                  <div className="info-grid">
                    <div className="info-box"><span>Sistema de salud (Isapre / Fonasa)</span><strong>{informacionAlumno.sistema_salud || 'No especificado'}</strong></div>
                    <div className="info-box"><span>Atención en Centro de Salud</span><strong>{informacionAlumno.seAtiendeCentroSalud ? `Sí (${informacionAlumno.nombreCentroSalud || 'Sin nombre'})` : 'No'}</strong></div>
                    <div className="info-box" style={{ gridColumn: '1 / -1' }}>
                      <span>Observaciones de salud / Antecedentes relevantes</span>
                      <strong>{informacionAlumno.observacionesRelevantes || 'No registra información especial.'}</strong>
                    </div>
                  </div>
                </div>

                <div className="information-section" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2d7db' }}>
                  <h3 style={{ color: '#800020', borderBottom: '2px solid #f4f2f3', paddingBottom: '8px', marginBottom: '15px' }}>🏡 4. Hogar y Situación Socioeconómica</h3>
                  <div className="info-grid">
                    <div className="info-box"><span>Con quién vive</span><strong>{informacionAlumno.conQuienVive || '-'}</strong></div>
                    <div className="info-box"><span>Tipo de vivienda</span><strong>{informacionAlumno.vivienda || '-'}</strong></div>
                    <div className="info-box"><span>Registro Social de Hogares (%)</span><strong>{informacionAlumno.porcentajeRegistroSocial || 'No informado'}%</strong></div>
                    <div className="info-box"><span>Programa social</span><strong>{informacionAlumno.perteneceProgramaSocial ? 'Sí' : 'No'}</strong></div>
                    <div className="info-box"><span>Personas en el hogar</span><strong>{informacionAlumno.numeroPersonasHogar ?? '-'}</strong></div>
                    <div className="info-box"><span>Personas trabajando</span><strong>{informacionAlumno.personasTrabajandoHogar ?? '-'}</strong></div>
                    <div className="info-box"><span>Ingreso mensual aprox.</span><strong>{informacionAlumno.ingreso_mensual_hogar ? `$${Number(informacionAlumno.ingreso_mensual_hogar).toLocaleString('es-CL')}` : 'No informado'}</strong></div>
                    <div className="info-box"><span>Habitaciones en el hogar</span><strong>{informacionAlumno.numeroHabitaciones ?? '-'}</strong></div>
                    <div className="info-box"><span>Servicios básicos</span><strong>{`Agua: ${informacionAlumno.tieneAgua ? 'Sí' : 'No'} | Luz: ${informacionAlumno.tieneElectricidad ? 'Sí' : 'No'} | Alcantarillado: ${informacionAlumno.tieneAlcantarillado ? 'Sí' : 'No'}`}</strong></div>
                  </div>
                </div>

                <div className="information-section" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2d7db' }}>
                  <h3 style={{ color: '#800020', borderBottom: '2px solid #f4f2f3', paddingBottom: '8px', marginBottom: '15px' }}>📝 5. Autorizaciones y Matrícula</h3>
                  <div className="info-grid">
                    <div className="info-box"><span>¿Autorizado para salir solo?</span><strong>{informacionAlumno.autorizadoSalirSolo ? 'Sí' : 'No'}</strong></div>
                    <div className="info-box"><span>Estado de matrícula</span><strong>{informacionAlumno.estadoMatricula || 'ACTIVA'}</strong></div>
                    <div className="info-box" style={{ gridColumn: '1 / -1' }}>
                      <span>Observaciones generales de matrícula</span>
                      <strong>{informacionAlumno.observacionesMatricula || 'Sin observaciones.'}</strong>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </section>
        )}

        {pestana === 'informacion' && (
          <section className="curso-panel">
            <div className="panel-header"><div><h2>Información del curso</h2><p>Información general y asignaturas.</p></div></div>
            <div className="info-grid">
              <div className="info-box"><span>Curso</span><strong>{curso?.nombre || '-'}</strong></div>
              <div className="info-box"><span>Año</span><strong>{curso?.anio || '-'}</strong></div>
              <div className="info-box"><span>Jornada</span><strong>{curso?.jornada || '-'}</strong></div>
              <div className="info-box"><span>Profesor jefe</span><strong>{curso?.esProfesorJefe ? 'Sí' : 'No'}</strong></div>
            </div>

            <div className="information-section horario-section">
              <h3>🗓️ Horario de clases del curso</h3>
              {horario.length === 0 ? (
                <div className="empty-state"><div>🗓️</div><h3>No hay horario registrado</h3></div>
              ) : (
                <div className="table-wrapper">
                  <table className="curso-table" style={{ textAlign: 'center' }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#f4f6f9', minWidth: '130px' }}>Hora / Día</th>
                        {[1, 2, 3, 4, 5].map((dia) => (
                          <th key={dia}>{obtenerNombreDia(dia)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bloquesHorarios.map((bloque) => (
                        <tr key={bloque}>
                          <td style={{ background: '#f8fafc', fontWeight: 'bold' }}>{bloque}</td>
                          {[1, 2, 3, 4, 5].map((dia) => {
                            const claseEncontrada = horario.find(
                              (c) => Number(c.diaSemana) === dia && `${formatearHora(c.horaInicio)} - ${formatearHora(c.horaFin)}` === bloque
                            );
                            return (
                              <td key={dia} style={{ verticalAlign: 'middle', padding: '10px' }}>
                                {claseEncontrada ? (
                                  <div style={{ background: '#fdf2f4', borderLeft: '3px solid #800020', padding: '6px', borderRadius: '4px' }}>
                                    <strong>{claseEncontrada.asignatura}</strong>
                                    <div style={{ fontSize: '11px', color: '#666' }}>{claseEncontrada.docente || 'Sin profesor'}</div>
                                  </div>
                                ) : (
                                  <span style={{ color: '#ccc' }}>—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {pestana === 'jefatura' && curso?.esProfesorJefe && asignaturasJefatura.length > 0 && (
          <section className="curso-panel">
            <div className="panel-header">
              <div>
                <h2>⭐ Panel de Jefatura · Situación Curso</h2>
                <p>Supervisa las calificaciones, anotaciones y docentes a cargo de las demás asignaturas.</p>
              </div>
            </div>

            {!asignaturaNotas ? (
              <div>
                <p style={{ marginBottom: '15px', fontWeight: 'bold', color: '#33272c' }}>
                  Selecciona una asignatura para supervisar:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px' }}>
                  {asignaturasJefatura.map((asig) => (
                    <div
                      key={asig.id}
                      onClick={() => { setAsignaturaNotas(asig.id); setPeriodoNotas('1'); }}
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
                      <h3 style={{ margin: '0 0 6px 0', color: '#800020', fontSize: '16px' }}>{asig.nombre}</h3>
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#333' }}>
                        👤 <strong>{asig.docente || 'Sin profesor asignado'}</strong>
                      </p>
                      <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>✉️ {asig.correoDocente || 'Sin correo'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setAsignaturaNotas(''); setNotas([]); }}>
                    ← Volver a la lista de asignaturas de Jefatura
                  </button>
                  <div className="form-group" style={{ margin: 0 }}>
                    <select value={periodoNotas} onChange={(e) => setPeriodoNotas(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d0d7de' }}>
                      <option value="1">1° Semestre</option>
                      <option value="2">2° Semestre</option>
                    </select>
                  </div>
                </div>

                {asignaturaJefaturaActual && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>📚 {asignaturaJefaturaActual.nombre}</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                        Profesor a cargo: <strong>{asignaturaJefaturaActual.docente || 'No asignado'}</strong>
                      </p>
                    </div>
                    <div>
                      <a href={`mailto:${asignaturaJefaturaActual.correoDocente}`} style={{ fontSize: '13px', color: '#800020', textDecoration: 'none', fontWeight: 'bold' }}>
                        ✉️ {asignaturaJefaturaActual.correoDocente || 'Sin correo registrado'}
                      </a>
                    </div>
                  </div>
                )}

                <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #991b1b', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>🔒</span>
                  <div><strong>Modo Supervisión (Profesor Jefe):</strong> Visualización en formato exclusivo de lectura.</div>
                </div>

                {cargandoNotas ? (
                  <div className="loading-state">Cargando calificaciones...</div>
                ) : evaluacionesAgrupadas.length === 0 ? (
                  <div className="empty-state">
                    <div>📝</div>
                    <h3>Sin evaluaciones registradas</h3>
                    <p>El docente a cargo aún no ha ingresado calificaciones en este período para esta asignatura.</p>
                  </div>
                ) : (
                  <div className="table-wrapper" style={{ overflowX: 'auto', width: '100%', marginBottom: '30px' }}>
                    <table className="curso-table">
                      <thead>
                        <tr>
                          <th style={{ minWidth: '230px', position: 'sticky', left: 0, zIndex: 2, background: '#f4f6f9' }}>Alumno</th>
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
                                    <span style={{ display: 'inline-block', minWidth: '45px', padding: '5px 10px', borderRadius: '6px', backgroundColor: valorNota ? '#f8fafc' : 'transparent', fontWeight: '600', color: valorNota && Number(valorNota) < 4 ? '#dc2626' : '#1e293b' }}>
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
                                ) : <span>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {evaluacionesAgrupadas.length > 0 && (
                  <div style={{ marginTop: '24px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#fff', border: '1px solid #e2d7db', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: 0, color: '#33272c' }}>📊 Nivel de Logro de la Asignatura</h3>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                            No logrado: 1,0–3,9 · Medianamente logrado: 4,0–5,9 · Logrado: 6,0–7,0
                          </p>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px' }}>
                          {resumenLogroJefatura.totalCalificaciones} calificaciones evaluadas
                        </span>
                      </div>

                      <div style={{ width: '100%', height: '26px', borderRadius: '999px', overflow: 'hidden', display: 'flex', background: '#f1f5f9', marginBottom: '18px' }}>
                        <div
                          title={`Logrado (6.0 - 7.0): ${resumenLogroJefatura.pctLogrado}%`}
                          style={{ width: `${resumenLogroJefatura.pctLogrado}%`, backgroundColor: '#16a34a', transition: 'width 0.3s ease' }}
                        />
                        <div
                          title={`Medianamente logrado (4.0 - 5.9): ${resumenLogroJefatura.pctMedianamente}%`}
                          style={{ width: `${resumenLogroJefatura.pctMedianamente}%`, backgroundColor: '#d97706', transition: 'width 0.3s ease' }}
                        />
                        <div
                          title={`No logrado (1.0 - 3.9): ${resumenLogroJefatura.pctNoLogrado}%`}
                          style={{ width: `${resumenLogroJefatura.pctNoLogrado}%`, backgroundColor: '#dc2626', transition: 'width 0.3s ease' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '700', color: '#991b1b', fontSize: '13px' }}>No logrado (1.0–3.9)</span>
                            <strong style={{ color: '#dc2626', fontSize: '16px' }}>{resumenLogroJefatura.pctNoLogrado}%</strong>
                          </div>
                          <div style={{ width: '100%', height: '10px', background: '#fee2e2', borderRadius: '6px', overflow: 'hidden', marginBottom: '6px' }}>
                            <div style={{ width: `${resumenLogroJefatura.pctNoLogrado}%`, height: '100%', background: '#dc2626' }} />
                          </div>
                          <small style={{ color: '#7f1d1d' }}>{resumenLogroJefatura.noLogrado} calificaciones</small>
                        </div>

                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '700', color: '#92400e', fontSize: '13px' }}>Medianamente logrado (4.0–5.9)</span>
                            <strong style={{ color: '#d97706', fontSize: '16px' }}>{resumenLogroJefatura.pctMedianamente}%</strong>
                          </div>
                          <div style={{ width: '100%', height: '10px', background: '#fef3c7', borderRadius: '6px', overflow: 'hidden', marginBottom: '6px' }}>
                            <div style={{ width: `${resumenLogroJefatura.pctMedianamente}%`, height: '100%', background: '#d97706' }} />
                          </div>
                          <small style={{ color: '#78350f' }}>{resumenLogroJefatura.medianamenteLogrado} calificaciones</small>
                        </div>

                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '700', color: '#166534', fontSize: '13px' }}>Logrado (6.0–7.0)</span>
                            <strong style={{ color: '#16a34a', fontSize: '16px' }}>{resumenLogroJefatura.pctLogrado}%</strong>
                          </div>
                          <div style={{ width: '100%', height: '10px', background: '#dcfce7', borderRadius: '6px', overflow: 'hidden', marginBottom: '6px' }}>
                            <div style={{ width: `${resumenLogroJefatura.pctLogrado}%`, height: '100%', background: '#16a34a' }} />
                          </div>
                          <small style={{ color: '#14532d' }}>{resumenLogroJefatura.logrado} calificaciones</small>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #fecaca', borderLeft: '5px solid #dc2626', borderRadius: '12px', padding: '20px' }}>
                      <h3 style={{ margin: '0 0 6px 0', color: '#991b1b' }}>
                        ⚠️ Alumnos en No Logrado ({resumenLogroJefatura.alumnosNoLogrados.length})
                      </h3>
                      <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#64748b' }}>
                        Estudiantes con promedio o calificaciones en el rango <strong>1,0 a 3,9</strong> en esta asignatura.
                      </p>

                      {resumenLogroJefatura.alumnosNoLogrados.length === 0 ? (
                        <div style={{ background: '#f0fdf4', color: '#166534', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}>
                          ✓ No hay alumnos en rango No Logrado en esta asignatura.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                          {resumenLogroJefatura.alumnosNoLogrados.map((est) => (
                            <div key={est.id} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px' }}>
                              <strong style={{ display: 'block', color: '#7f1d1d', fontSize: '14px' }}>{est.nombre}</strong>
                              {est.rut && <small style={{ color: '#991b1b', display: 'block', marginBottom: '8px' }}>{est.rut}</small>}
                              {est.promedio !== null && (
                                <div style={{ fontSize: '13px', marginBottom: '6px', color: '#450a0a' }}>
                                  Promedio período: <strong style={{ color: est.promedio < 4 ? '#dc2626' : '#1e293b' }}>{est.promedio.toFixed(1)}</strong>
                                </div>
                              )}
                              {est.notasBajas.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                  {est.notasBajas.map((nb, idx) => (
                                    <span key={idx} style={{ background: '#dc2626', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                                      {nb.evaluacion}: {nb.nota.toFixed(1)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '30px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#33272c' }}>📋 Anotaciones registradas en el curso</h3>
                  {anotaciones.length === 0 ? (
                    <div className="empty-state"><div>📋</div><h3>Sin anotaciones</h3></div>
                  ) : (
                    <div className="anotaciones-list">
                      {anotaciones.map((anotacion) => (
                        <article className={`anotacion-card ${anotacion.tipo?.toLowerCase() || ''}`} key={anotacion.id}>
                          <div className="anotacion-top">
                            <div>
                              <span className={`anotacion-tipo ${anotacion.tipo?.toLowerCase() || ''}`}>{textoTipoAnotacion(anotacion.tipo)}</span>
                              <h3>{anotacion.titulo || 'Sin título'}</h3>
                            </div>
                          </div>
                          <p>{anotacion.descripcion}</p>
                          <div className="anotacion-footer"><strong>{anotacion.alumno}</strong><span>{formatearFecha(anotacion.fecha)}</span></div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
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
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function obtenerMesActual() {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${anio}-${mes}`;
}

function formatearFecha(fecha) {
  if (!fecha) return '-';
  if (String(fecha).includes('T')) {
    const soloFecha = String(fecha).split('T')[0];
    const partes = soloFecha.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  }
  const partes = String(fecha).split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fecha;
}

function obtenerNombreDia(dia) {
  const dias = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
  return dias[dia] || `Día ${dia}`;
}

function formatearHora(hora) {
  if (!hora) return '-';
  return String(hora).slice(0, 5);
}

function textoTipoAnotacion(tipo) {
  switch (String(tipo || '').toUpperCase()) {
    case 'POSITIVA': return '✓ Positiva';
    case 'NEGATIVA': return '⚠ Negativa';
    case 'OBSERVACION': return 'ℹ Observación';
    default: return tipo || 'Observación';
  }
}
