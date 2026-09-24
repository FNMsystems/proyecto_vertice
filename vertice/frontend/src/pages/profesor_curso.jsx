import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  obtenerCursoDocente,
  obtenerAsistenciaCurso,
  guardarAsistenciaCurso
} from '../services/docenteService.js';

import {
  fetchConAuth
} from '../services/apiService.js';

import {
  logoutService
} from '../services/authService.js';

import './profesor_curso.css';

export default function ProfesorCurso() {

  const navigate = useNavigate();
  const { cursoId } = useParams();

  const [curso, setCurso] = useState(null);
  const [asignaturas, setAsignaturas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [horario, setHorario] = useState([]);
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState('');
  const [informacionAlumno, setInformacionAlumno] = useState(null);
  const [cargandoInformacionAlumno, setCargandoInformacionAlumno] = useState(false);

  const [pestana, setPestana] = useState('alumnos');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [notas, setNotas] = useState([]);
  const [asignaturaNotas, setAsignaturaNotas] = useState('');
  const [cargandoNotas, setCargandoNotas] = useState(false);

  const [mostrarFormularioNota, setMostrarFormularioNota] =
    useState(false);

  const [notaForm, setNotaForm] = useState({
    alumnoId: '',
    asignaturaId: '',
    periodo: '',
    tipoEvaluacion: '',
    nota: '',
    porcentaje: '',
    fecha: '',
    observacion: ''
  });


  const [fechaAsistencia, setFechaAsistencia] =
    useState(obtenerFechaActual());

  const [asistencia, setAsistencia] = useState([]);
  const [cargandoAsistencia, setCargandoAsistencia] =
    useState(false);


  const [anotaciones, setAnotaciones] = useState([]);
  const [cargandoAnotaciones, setCargandoAnotaciones] =
    useState(false);

  const [mostrarFormularioAnotacion, setMostrarFormularioAnotacion] =
    useState(false);

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

      const data =
        await obtenerCursoDocente(cursoId);

      setCurso(data.curso);
      setAsignaturas(data.asignaturas || []);
      setAlumnos(data.alumnos || []);

    } catch (error) {

      console.error(
        'Error cargando curso:',
        error
      );

      setError(
        error.message ||
        'No se pudo cargar el curso.'
      );

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
        `/docentes/me/alumnos/${alumnoId}/informacion`
      );

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

    if (
      pestana === 'notas' &&
      cursoId
    ) {
      cargarNotas();
    }

  }, [
    pestana,
    cursoId,
    asignaturaNotas
  ]);

  const cargarNotas = async () => {

    try {

      setCargandoNotas(true);

      let url =
        `/notas/curso/${cursoId}`;

      if (asignaturaNotas) {
        url +=
          `?asignaturaId=${encodeURIComponent(
            asignaturaNotas
          )}`;
      }

      const data =
        await fetchConAuth(url);

      setNotas(
        data.notas || []
      );

    } catch (error) {

      console.error(
        'Error cargando notas:',
        error
      );

      alert(
        error.message ||
        'No se pudieron cargar las notas.'
      );

    } finally {

      setCargandoNotas(false);

    }
  };

  const crearNota = async (event) => {

    event.preventDefault();

    try {

      if (!notaForm.alumnoId) {
        alert('Selecciona un alumno.');
        return;
      }

      if (!notaForm.asignaturaId) {
        alert('Selecciona una asignatura.');
        return;
      }

      if (
        notaForm.nota === '' ||
        notaForm.nota === null
      ) {
        alert('Ingresa la nota.');
        return;
      }

      const data =
        await fetchConAuth('/notas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            alumnoId: notaForm.alumnoId,
            cursoId,
            asignaturaId: notaForm.asignaturaId,
            periodo: notaForm.periodo || null,
            tipoEvaluacion:
              notaForm.tipoEvaluacion || null,
            nota: Number(notaForm.nota),
            porcentaje:
              notaForm.porcentaje === ''
                ? null
                : Number(notaForm.porcentaje),
            fecha:
              notaForm.fecha || null,
            observacion:
              notaForm.observacion || null
          })
        });

      alert(
        data.mensaje ||
        'Nota registrada correctamente.'
      );

      setNotaForm({
        alumnoId: '',
        asignaturaId: '',
        periodo: '',
        tipoEvaluacion: '',
        nota: '',
        porcentaje: '',
        fecha: '',
        observacion: ''
      });

      setMostrarFormularioNota(false);

      await cargarNotas();

    } catch (error) {

      console.error(
        'Error creando nota:',
        error
      );

      alert(
        error.message ||
        'No se pudo registrar la nota.'
      );
    }
  };

  const eliminarNota = async (notaId) => {

    const confirmar =
      window.confirm(
        '¿Seguro que deseas eliminar esta nota?'
      );

    if (!confirmar) return;

    try {

      const data =
        await fetchConAuth(
          `/notas/${notaId}`,
          {
            method: 'DELETE'
          }
        );

      alert(
        data.mensaje ||
        'Nota eliminada correctamente.'
      );

      await cargarNotas();

    } catch (error) {

      console.error(
        'Error eliminando nota:',
        error
      );

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

  }, [
    pestana,
    cursoId,
    fechaAsistencia
  ]);

  const cargarAsistencia = async () => {

    try {

      setCargandoAsistencia(true);

      const data = await obtenerAsistenciaCurso(
        cursoId,
        fechaAsistencia
      );

      setAsistencia(
        data.alumnos || []
      );

    } catch (error) {

      console.error(
        'Error cargando asistencia:',
        error
      );

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

      console.error(
        'Error guardando asistencia:',
        error
      );

      alert(
        error.message ||
        'No se pudo guardar la asistencia.'
      );
    }
  };

  const obtenerEstadoAlumno = (alumnoId) => {

    const registro =
      asistencia.find(
        (item) =>
          item.alumnoId === alumnoId
      );

    return registro?.estado || null;
  };

  useEffect(() => {

    if (
      pestana === 'anotaciones' &&
      cursoId
    ) {
      cargarAnotaciones();
    }

  }, [
    pestana,
    cursoId
  ]);

  const cargarAnotaciones = async () => {

    try {

      setCargandoAnotaciones(true);

      const data =
        await fetchConAuth(
          `/anotaciones/curso/${cursoId}`
        );

      setAnotaciones(
        data.anotaciones || []
      );

    } catch (error) {

      console.error(
        'Error cargando anotaciones:',
        error
      );

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

      const data =
        await fetchConAuth(
          '/anotaciones',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              alumnoId:
                anotacionForm.alumnoId,
              cursoId,
              tipo:
                anotacionForm.tipo,
              titulo:
                anotacionForm.titulo || null,
              descripcion:
                anotacionForm.descripcion,
              fecha:
                anotacionForm.fecha || null
            })
          }
        );

      alert(
        data.mensaje ||
        'Anotación registrada correctamente.'
      );

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

      console.error(
        'Error creando anotación:',
        error
      );

      alert(
        error.message ||
        'No se pudo registrar la anotación.'
      );
    }
  };

  const eliminarAnotacion = async (
    anotacionId
  ) => {

    const confirmar =
      window.confirm(
        '¿Seguro que deseas eliminar esta anotación?'
      );

    if (!confirmar) return;

    try {

      const data =
        await fetchConAuth(
          `/anotaciones/${anotacionId}`,
          {
            method: 'DELETE'
          }
        );

      alert(
        data.mensaje ||
        'Anotación eliminada correctamente.'
      );

      await cargarAnotaciones();

    } catch (error) {

      console.error(
        'Error eliminando anotación:',
        error
      );

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
    if (!hora) {
      return '-';
    }

    return String(hora).slice(0, 5);
  };

  const estadisticasAsistencia =
    useMemo(() => {

      return {
        presentes:
          asistencia.filter(
            (item) =>
              item.estado === 'PRESENTE'
          ).length,

        ausentes:
          asistencia.filter(
            (item) =>
              item.estado === 'AUSENTE'
          ).length,

        atrasados:
          asistencia.filter(
            (item) =>
              item.estado === 'ATRASADO'
          ).length,

        justificados:
          asistencia.filter(
            (item) =>
              item.estado === 'JUSTIFICADO'
          ).length
      };

    }, [asistencia]);



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

          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            No se pudo cargar el curso
          </h2>

          <p>
            {error}
          </p>

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

            <h1>
              {curso?.nombre}
            </h1>

            <p>
              Panel del curso · {curso?.anio}
            </p>

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

            <span className="resumen-icon">
              👥
            </span>

            <div>
              <strong>
                {alumnos.length}
              </strong>

              <span>
                Alumnos
              </span>
            </div>

          </div>

          <div className="resumen-item">

            <span className="resumen-icon">
              📚
            </span>

            <div>
              <strong>
                {asignaturas.length}
              </strong>

              <span>
                Asignaturas
              </span>
            </div>

          </div>

          <div className="resumen-item">

            <span className="resumen-icon">
              📝
            </span>

            <div>
              <strong>
                {notas.length}
              </strong>

              <span>
                Notas cargadas
              </span>
            </div>

          </div>

          <div className="resumen-item">

            <span className="resumen-icon">
              📋
            </span>

            <div>
              <strong>
                {anotaciones.length}
              </strong>

              <span>
                Anotaciones
              </span>
            </div>

          </div>

        </section>


        <nav className="curso-tabs">

          <button
            className={
              pestana === 'alumnos'
                ? 'curso-tab active'
                : 'curso-tab'
            }
            onClick={() =>
              setPestana('alumnos')
            }
          >
            👥 Alumnos
          </button>

          <button
            className={
              pestana === 'notas'
                ? 'curso-tab active'
                : 'curso-tab'
            }
            onClick={() =>
              setPestana('notas')
            }
          >
            📝 Notas
          </button>

          <button
            className={
              pestana === 'asistencia'
                ? 'curso-tab active'
                : 'curso-tab'
            }
            onClick={() =>
              setPestana('asistencia')
            }
          >
            📅 Asistencia
          </button>

          <button
            className={
              pestana === 'anotaciones'
                ? 'curso-tab active'
                : 'curso-tab'
            }
            onClick={() =>
              setPestana('anotaciones')
            }
          >
            📋 Anotaciones
          </button>

          <button
            className={
              pestana === 'informacion-alumno'
                ? 'curso-tab active'
                : 'curso-tab'
            }
            onClick={() =>
              setPestana('informacion-alumno')
            }
          >
            👤 Información del alumno
          </button>

          <button
            className={
              pestana === 'informacion'
                ? 'curso-tab active'
                : 'curso-tab'
            }
            onClick={() =>
              setPestana('informacion')
            }
          >
            ℹ️ Información
          </button>

        </nav>



        {pestana === 'alumnos' && (

          <section className="curso-panel">

            <div className="panel-header">

              <div>
                <h2>
                  👥 Alumnos
                </h2>

                <p>
                  Estudiantes matriculados en este curso.
                </p>
              </div>

              <span className="count-badge">
                {alumnos.length}
              </span>

            </div>


            {alumnos.length === 0 ? (

              <div className="empty-state">
                <div>👥</div>

                <h3>
                  No hay alumnos
                </h3>

                <p>
                  No existen estudiantes matriculados
                  en este curso.
                </p>
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

                    {alumnos.map(
                      (alumno, index) => (

                        <tr key={alumno.id}>

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            <strong>
                              {alumno.nombre}
                            </strong>
                          </td>

                          <td>
                            {alumno.rut || '-'}
                          </td>

                          <td>
                            {alumno.sexo || '-'}
                          </td>

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

                      )
                    )}

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
                <h2>
                  📝 Notas
                </h2>

                <p>
                  Gestiona las evaluaciones de tus asignaturas.
                </p>
              </div>

              <button
                className="btn-primary"
                onClick={() =>
                  setMostrarFormularioNota(
                    !mostrarFormularioNota
                  )
                }
              >
                {mostrarFormularioNota
                  ? '✕ Cerrar'
                  : '+ Nueva nota'}
              </button>

            </div>


            {mostrarFormularioNota && (

              <form
                className="form-card"
                onSubmit={crearNota}
              >

                <h3>
                  Registrar nota
                </h3>

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Alumno
                    </label>

                    <select
                      value={
                        notaForm.alumnoId
                      }
                      onChange={(e) =>
                        setNotaForm({
                          ...notaForm,
                          alumnoId:
                            e.target.value
                        })
                      }
                      required
                    >

                      <option value="">
                        Seleccionar alumno
                      </option>

                      {alumnos.map(
                        (alumno) => (

                          <option
                            key={alumno.id}
                            value={alumno.id}
                          >
                            {alumno.nombre}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  <div className="form-group">

                    <label>
                      Asignatura
                    </label>

                    <select
                      value={
                        notaForm.asignaturaId
                      }
                      onChange={(e) =>
                        setNotaForm({
                          ...notaForm,
                          asignaturaId:
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

                  </div>


                  <div className="form-group">

                    <label>
                      Período
                    </label>

                    <select
                      value={
                        notaForm.periodo
                      }
                      onChange={(e) =>
                        setNotaForm({
                          ...notaForm,
                          periodo:
                            e.target.value
                        })
                      }
                    >

                      <option value="">
                        Seleccionar
                      </option>

                      <option value="1">
                        1° Período
                      </option>

                      <option value="2">
                        2° Período
                      </option>

                    </select>

                  </div>


                  <div className="form-group">

                    <label>
                      Tipo de evaluación
                    </label>

                    <input
                      type="text"
                      placeholder="Ej: Prueba"
                      value={
                        notaForm.tipoEvaluacion
                      }
                      onChange={(e) =>
                        setNotaForm({
                          ...notaForm,
                          tipoEvaluacion:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Nota
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="7"
                      step="0.1"
                      placeholder="1.0 - 7.0"
                      value={
                        notaForm.nota
                      }
                      onChange={(e) =>
                        setNotaForm({
                          ...notaForm,
                          nota:
                            e.target.value
                        })
                      }
                      required
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Porcentaje
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="Ej: 30"
                      value={
                        notaForm.porcentaje
                      }
                      onChange={(e) =>
                        setNotaForm({
                          ...notaForm,
                          porcentaje:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Fecha
                    </label>

                    <input
                      type="date"
                      value={
                        notaForm.fecha
                      }
                      onChange={(e) =>
                        setNotaForm({
                          ...notaForm,
                          fecha:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  <div className="form-group form-group-full">

                    <label>
                      Observación
                    </label>

                    <textarea
                      rows="3"
                      value={
                        notaForm.observacion
                      }
                      onChange={(e) =>
                        setNotaForm({
                          ...notaForm,
                          observacion:
                            e.target.value
                        })
                      }
                    />

                  </div>

                </div>


                <div className="form-actions">

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setMostrarFormularioNota(
                        false
                      )
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Guardar nota
                  </button>

                </div>

              </form>

            )}


            <div className="filter-row">

              <div className="form-group">

                <label>
                  Filtrar por asignatura
                </label>

                <select
                  value={asignaturaNotas}
                  onChange={(e) =>
                    setAsignaturaNotas(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Todas las asignaturas
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

              </div>

            </div>


            {cargandoNotas ? (

              <div className="loading-state">
                Cargando notas...
              </div>

            ) : notas.length === 0 ? (

              <div className="empty-state">

                <div>📝</div>

                <h3>
                  No hay notas registradas
                </h3>

                <p>
                  Las notas que registres aparecerán aquí.
                </p>

              </div>

            ) : (

              <div className="table-wrapper">

                <table className="curso-table">

                  <thead>

                    <tr>
                      <th>Alumno</th>
                      <th>Asignatura</th>
                      <th>Período</th>
                      <th>Evaluación</th>
                      <th>Nota</th>
                      <th>Fecha</th>
                      <th></th>
                    </tr>

                  </thead>

                  <tbody>

                    {notas.map(
                      (nota) => (

                        <tr key={nota.id}>

                          <td>
                            <strong>
                              {nota.alumno}
                            </strong>
                          </td>

                          <td>
                            {nota.asignatura}
                          </td>

                          <td>
                            {nota.periodo || '-'}
                          </td>

                          <td>
                            {nota.tipoEvaluacion || '-'}
                          </td>

                          <td>

                            <span
                              className={
                                Number(nota.nota) >= 4
                                  ? 'nota-aprobada'
                                  : 'nota-reprobada'
                              }
                            >
                              {nota.nota}
                            </span>

                          </td>

                          <td>
                            {formatearFecha(
                              nota.fecha
                            )}
                          </td>

                          <td>

                            <button
                              className="btn-delete"
                              onClick={() =>
                                eliminarNota(
                                  nota.id
                                )
                              }
                            >
                              🗑️
                            </button>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        )}




        {pestana === 'asistencia' && (

          <section className="curso-panel">

            <div className="panel-header">

              <div>

                <h2>
                  📅 Asistencia
                </h2>

                <p>
                  Registra la asistencia de tus alumnos.
                </p>

              </div>

            </div>


            <div className="attendance-date">

              <div className="form-group">

                <label>
                  Fecha
                </label>

                <input
                  type="date"
                  value={
                    fechaAsistencia
                  }
                  onChange={(e) =>
                    setFechaAsistencia(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>


            <div className="attendance-stats">

              <div>
                <strong>
                  {estadisticasAsistencia.presentes}
                </strong>
                <span>
                  Presentes
                </span>
              </div>

              <div>
                <strong>
                  {estadisticasAsistencia.ausentes}
                </strong>
                <span>
                  Ausentes
                </span>
              </div>

              <div>
                <strong>
                  {estadisticasAsistencia.atrasados}
                </strong>
                <span>
                  Atrasados
                </span>
              </div>

              <div>
                <strong>
                  {estadisticasAsistencia.justificados}
                </strong>
                <span>
                  Justificados
                </span>
              </div>

            </div>


            {cargandoAsistencia ? (

              <div className="loading-state">
                Cargando asistencia...
              </div>

            ) : (

              <div className="attendance-list">

                {alumnos.map(
                  (alumno, index) => {

                    const estado =
                      obtenerEstadoAlumno(
                        alumno.id
                      );

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
                            <strong>
                              {alumno.nombre}
                            </strong>

                            <small>
                              {alumno.rut}
                            </small>
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
                              guardarEstadoAsistencia(
                                alumno.id,
                                'PRESENTE'
                              )
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
                              guardarEstadoAsistencia(
                                alumno.id,
                                'AUSENTE'
                              )
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
                              guardarEstadoAsistencia(
                                alumno.id,
                                'ATRASADO'
                              )
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
                              guardarEstadoAsistencia(
                                alumno.id,
                                'JUSTIFICADO'
                              )
                            }
                          >
                            📄 Justificado
                          </button>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </section>

        )}


        {pestana === 'anotaciones' && (

          <section className="curso-panel">

            <div className="panel-header">

              <div>

                <h2>
                  📋 Anotaciones
                </h2>

                <p>
                  Registra observaciones sobre tus alumnos.
                </p>

              </div>

              <button
                className="btn-primary"
                onClick={() =>
                  setMostrarFormularioAnotacion(
                    !mostrarFormularioAnotacion
                  )
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

                <h3>
                  Nueva anotación
                </h3>

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Alumno
                    </label>

                    <select
                      value={
                        anotacionForm.alumnoId
                      }
                      onChange={(e) =>
                        setAnotacionForm({
                          ...anotacionForm,
                          alumnoId:
                            e.target.value
                        })
                      }
                      required
                    >

                      <option value="">
                        Seleccionar alumno
                      </option>

                      {alumnos.map(
                        (alumno) => (

                          <option
                            key={alumno.id}
                            value={alumno.id}
                          >
                            {alumno.nombre}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  <div className="form-group">

                    <label>
                      Tipo
                    </label>

                    <select
                      value={
                        anotacionForm.tipo
                      }
                      onChange={(e) =>
                        setAnotacionForm({
                          ...anotacionForm,
                          tipo:
                            e.target.value
                        })
                      }
                    >

                      <option value="POSITIVA">
                        Positiva
                      </option>

                      <option value="NEGATIVA">
                        Negativa
                      </option>

                      <option value="OBSERVACION">
                        Observación
                      </option>

                    </select>

                  </div>


                  <div className="form-group form-group-full">

                    <label>
                      Título
                    </label>

                    <input
                      type="text"
                      placeholder="Ej: Participación destacada"
                      value={
                        anotacionForm.titulo
                      }
                      onChange={(e) =>
                        setAnotacionForm({
                          ...anotacionForm,
                          titulo:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  <div className="form-group form-group-full">

                    <label>
                      Descripción
                    </label>

                    <textarea
                      rows="4"
                      placeholder="Escribe la anotación..."
                      value={
                        anotacionForm.descripcion
                      }
                      onChange={(e) =>
                        setAnotacionForm({
                          ...anotacionForm,
                          descripcion:
                            e.target.value
                        })
                      }
                      required
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Fecha
                    </label>

                    <input
                      type="date"
                      value={
                        anotacionForm.fecha
                      }
                      onChange={(e) =>
                        setAnotacionForm({
                          ...anotacionForm,
                          fecha:
                            e.target.value
                        })
                      }
                    />

                  </div>

                </div>


                <div className="form-actions">

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setMostrarFormularioAnotacion(
                        false
                      )
                    }
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

                <h3>
                  No hay anotaciones
                </h3>

                <p>
                  Las anotaciones que registres aparecerán aquí.
                </p>

              </div>

            ) : (

              <div className="anotaciones-list">

                {anotaciones.map(
                  (anotacion) => (

                    <article
                      className={`anotacion-card ${anotacion.tipo?.toLowerCase() ||
                        ''
                        }`}
                      key={anotacion.id}
                    >

                      <div className="anotacion-top">

                        <div>

                          <span
                            className={`anotacion-tipo ${anotacion.tipo?.toLowerCase() ||
                              ''
                              }`}
                          >
                            {textoTipoAnotacion(
                              anotacion.tipo
                            )}
                          </span>

                          <h3>
                            {anotacion.titulo ||
                              'Sin título'}
                          </h3>

                        </div>

                        <button
                          className="btn-delete"
                          onClick={() =>
                            eliminarAnotacion(
                              anotacion.id
                            )
                          }
                        >
                          🗑️
                        </button>

                      </div>

                      <p>
                        {anotacion.descripcion}
                      </p>

                      <div className="anotacion-footer">

                        <strong>
                          {anotacion.alumno}
                        </strong>

                        <span>
                          {formatearFecha(
                            anotacion.fecha
                          )}
                        </span>

                      </div>

                    </article>

                  )
                )}

              </div>

            )}

          </section>

        )}




        {pestana === 'informacion-alumno' && (

          <section className="curso-panel">

            <div className="panel-header">
              <div>
                <h2>👤 Información del alumno</h2>
                <p>Consulta los datos personales, apoderados y antecedentes relevantes del estudiante.</p>
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
                    if (!id) setInformacionAlumno(null);
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
                <p>Selecciona un estudiante para consultar su información.</p>
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
                      <strong>{formatearFecha(informacionAlumno.fechaNacimiento)}</strong>
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
                              <td><strong>{apoderado.nombre || '-'}</strong></td>
                              <td>{apoderado.rut || '-'}</td>
                              <td>{apoderado.parentesco || '-'}</td>
                              <td>{apoderado.telefono || '-'}</td>
                              <td>{apoderado.correo || '-'}</td>
                              <td>{apoderado.esApoderadoPrincipal ? 'Sí' : 'No'}</td>
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
                      {informacionAlumno.observacionesRelevantes || 'No registra información especial.'}
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

                <h2>
                  Información del curso
                </h2>

                <p>
                  Información general y asignaturas.
                </p>

              </div>

            </div>


            <div className="info-grid">

              <div className="info-box">

                <span>
                  Curso
                </span>

                <strong>
                  {curso?.nombre || '-'}
                </strong>

              </div>


              <div className="info-box">

                <span>
                  Año
                </span>

                <strong>
                  {curso?.anio || '-'}
                </strong>

              </div>


              <div className="info-box">

                <span>
                  Jornada
                </span>

                <strong>
                  {curso?.jornada || '-'}
                </strong>

              </div>


              <div className="info-box">

                <span>
                  Código nivel
                </span>

                <strong>
                  {curso?.codigoNivel || '-'}
                </strong>

              </div>


              <div className="info-box">

                <span>
                  Profesor jefe
                </span>

                <strong>
                  {curso?.esProfesorJefe
                    ? 'Sí'
                    : 'No'}
                </strong>

              </div>


              <div className="info-box">

                <span>
                  Alumnos
                </span>

                <strong>
                  {alumnos.length}
                </strong>

              </div>

            </div>


            <div className="information-section">

              <h3>
                Mis asignaturas
              </h3>

              <div className="asignaturas-list">

                {asignaturas.map(
                  (asignatura) => (

                    <div
                      className="asignatura-item"
                      key={asignatura.id}
                    >

                      <strong>
                        {asignatura.nombre}
                      </strong>

                      {asignatura.codigo && (
                        <span>
                          {asignatura.codigo}
                        </span>
                      )}

                    </div>

                  )
                )}

              </div>

            </div>
            {curso?.esProfesorJefe && (

              <div className="information-section horario-section">

                <h3>
                  🗓️ Horario de clases del curso
                </h3>

                <p className="horario-descripcion">
                  Horario completo de las clases de este curso.
                </p>

                {horario.length === 0 ? (

                  <div className="empty-state">

                    <div>
                      🗓️
                    </div>

                    <h3>
                      No hay horario registrado
                    </h3>

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
                                {obtenerNombreDia(
                                  clase.diaSemana
                                )}
                              </strong>
                            </td>

                            <td>
                              {formatearHora(
                                clase.horaInicio
                              )}
                              {' - '}
                              {formatearHora(
                                clase.horaFin
                              )}
                            </td>

                            <td>

                              <strong>
                                {clase.asignatura || '-'}
                              </strong>

                              {clase.codigoAsignatura && (
                                <small>
                                  {clase.codigoAsignatura}
                                </small>
                              )}

                            </td>

                            <td>
                              {clase.docente || '-'}
                            </td>

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

      </main>

    </div>
  );
}


function obtenerFechaActual() {

  const fecha = new Date();

  const anio =
    fecha.getFullYear();

  const mes =
    String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

  const dia =
    String(
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
      Authorization:
        `Bearer ${token}`
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

  if (!fecha) {
    return '-';
  }

  const partes =
    String(fecha).split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return fecha;
}


function textoTipoAnotacion(tipo) {

  switch (
  String(tipo || '').toUpperCase()
  ) {

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