import React, { useEffect, useState } from 'react';
import logoColegio from "../img/logo_Institucional.png";
import fondoColegio from "../img/home_fondo.jpeg";
import "./apoderado_dashboard.css";
import { fetchConAuth } from "../services/apiService.js";
import { QRCodeSVG } from "qrcode.react";
import CambiarPassword from '../components/CambiarPassword.jsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function ApoderadoDashboard({ apoderadoRut }) {
  const [apoderado, setApoderado] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [tab, setTab] = useState('notas');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [docenteModal, setDocenteModal] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [correoCopiado, setCorreoCopiado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [enviandoJustificativo, setEnviandoJustificativo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [tipoMotivo, setTipoMotivo] = useState('Enfermedad / Motivo Médico');

  const [personasRetiro, setPersonasRetiro] = useState([]);
  const [mesAsistenciaFiltro, setMesAsistenciaFiltro] = useState('TODOS');
  const [personaRetiroSeleccionada, setPersonaRetiroSeleccionada] = useState('');
  const [motivoRetiro, setMotivoRetiro] = useState('');
  const [observacionRetiro, setObservacionRetiro] = useState('');
  const [solicitudQR, setSolicitudQR] = useState(null);
  const [cargandoQR, setCargandoQR] = useState(false);
  const [generandoQR, setGenerandoQR] = useState(false);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rut');
    localStorage.removeItem('apoderadoRut');
    localStorage.removeItem('user');
    localStorage.removeItem('usuarioActual');
    window.location.href = '/';
  };

  const obtenerRut = () => {
    if (apoderadoRut) {
      return apoderadoRut;
    }

    const usuario = localStorage.getItem('usuario');

    if (usuario) {
      try {
        const objeto = JSON.parse(usuario);

        if (objeto?.rut) {
          return objeto.rut;
        }
      } catch {
        return null;
      }
    }

    const rut = localStorage.getItem('rut');

    if (rut) {
      return rut;
    }

    const apoderadoRutStorage =
      localStorage.getItem('apoderadoRut');

    if (apoderadoRutStorage) {
      return apoderadoRutStorage;
    }

    return null;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError('');

        const rut = obtenerRut();

        if (!rut) {
          throw new Error(
            'No se encontró el RUT del apoderado. Inicie sesión nuevamente.'
          );
        }

        const usuario = localStorage.getItem('usuario');

        let usuarioActual = null;

        if (usuario) {
          try {
            usuarioActual = JSON.parse(usuario);
          } catch {
            usuarioActual = null;
          }
        }

        if (
          usuarioActual?.rol &&
          String(usuarioActual.rol).trim().toUpperCase() !== 'APODERADO'
        ) {
          throw new Error(
            'La sesión actual no corresponde a un apoderado.'
          );
        }

        const dataAlumnos = await fetchConAuth(
          '/api/apoderados/me/alumnos'
        );

        const alumnosFormateados = Array.isArray(dataAlumnos)
          ? dataAlumnos.map((alumno) => ({
            ...alumno,
            nombre: alumno.nombres,
            apellido: [
              alumno.apellido_paterno,
              alumno.apellido_materno
            ]
              .filter(Boolean)
              .join(' '),
            nombreCompleto: [
              alumno.nombres,
              alumno.apellido_paterno,
              alumno.apellido_materno
            ]
              .filter(Boolean)
              .join(' '),
            asignaturas: [],
            anotaciones: [],
            asistencia: [],
            comunicaciones: [],
            pie: null,
            asistenciaPorcentaje: null,
            riesgoRepitencia: null
          }))
          : [];

        setAlumnos(alumnosFormateados);

        const apoderadoData = {
          nombre_completo:
            usuarioActual?.nombre || 'Apoderado',
          rut: usuarioActual?.rut || rut,
          correo: usuarioActual?.email || null
        };

        setApoderado(apoderadoData);
      } catch (err) {
        console.error(
          'Error cargando dashboard del apoderado:',
          err
        );

        setError(
          err.message ||
          'No se pudo cargar la información.'
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [apoderadoRut]);

  const seleccionarAlumno = async (alumno) => {
    try {
      setError('');
      setAlumnoSeleccionado(null);
      setSolicitudQR(null);
      setPersonasRetiro([]);
      setPersonaRetiroSeleccionada('');
      setMotivoRetiro('');
      setObservacionRetiro('');

      const data = await fetchConAuth(
        `/api/apoderados/alumno/${alumno.id}/detalle`
      );

      const alumnoCompleto = {
        ...alumno,
        ...data,
        nombre: alumno.nombres,
        apellido: [
          alumno.apellido_paterno,
          alumno.apellido_materno
        ]
          .filter(Boolean)
          .join(' '),
        nombreCompleto: [
          alumno.nombres,
          alumno.apellido_paterno,
          alumno.apellido_materno
        ]
          .filter(Boolean)
          .join(' ')
      };

      setAlumnoSeleccionado(alumnoCompleto);
      setTab('notas');
    } catch (err) {
      console.error(
        'Error cargando detalle del alumno:',
        err
      );

      setError(
        err.message ||
        'No se pudo cargar la información del alumno.'
      );
    }
  };

  const volverAlumnos = () => {
    setAlumnoSeleccionado(null);
    setTab('notas');
    setError('');
    setSolicitudQR(null);
    setPersonasRetiro([]);
    setPersonaRetiroSeleccionada('');
    setMotivoRetiro('');
    setObservacionRetiro('');
  };

  const cargarPersonasRetiro = async () => {
    if (!alumnoSeleccionado?.id) {
      return;
    }

    try {
      setCargandoQR(true);
      setError('');

      const personas = await fetchConAuth(
        `/api/apoderados/alumno/${alumnoSeleccionado.id}/personas-retiro`
      );

      const listaTerceros = Array.isArray(personas) ? personas : [];

      const listaFinal = [...listaTerceros];

      if (apoderado) {
        const yaExiste = listaFinal.some(
          (p) =>
            (p.rut && apoderado.rut && p.rut === apoderado.rut) ||
            (p.nombre_completo &&
              apoderado.nombre_completo &&
              p.nombre_completo.toLowerCase().trim() ===
              apoderado.nombre_completo.toLowerCase().trim())
        );

        if (!yaExiste) {
          listaFinal.unshift({
            id: 'APODERADO_TITULAR',
            nombre_completo: apoderado.nombre_completo,
            parentesco: alumnoSeleccionado.parentesco || 'Apoderado/a Titular',
            rut: apoderado.rut,
            esTitular: true
          });
        }
      }

      setPersonasRetiro(listaFinal);

      if (listaFinal.length > 0) {
        setPersonaRetiroSeleccionada(listaFinal[0].id);
      }
    } catch (err) {
      console.error('Error cargando personas autorizadas:', err);
      setError(err.message || 'No se pudieron cargar las personas autorizadas.');
    } finally {
      setCargandoQR(false);
    }
  };

  const handleSubirJustificativo = async (motivoRecibido) => {
    try {
      if (!alumnoSeleccionado?.id) {
        throw new Error('No hay un alumno seleccionado.');
      }

      if (!fechaInicio) {
        throw new Error('Debe seleccionar la fecha de inicio.');
      }

      const motivoFinal = typeof motivoRecibido === 'string'
        ? motivoRecibido
        : (tipoMotivo === 'Otro' ? motivo.trim() : tipoMotivo);
      if (tipoMotivo === 'Otro' && !motivoFinal) {
        throw new Error('Debe especificar el motivo de la inasistencia en el cuadro de texto.');
      }

      if (fechaFin && fechaFin < fechaInicio) {
        throw new Error('La fecha de término no puede ser anterior a la fecha de inicio.');
      }

      setEnviandoJustificativo(true);
      setError('');

      const formData = new FormData();
      formData.append('fechaInicio', fechaInicio);
      formData.append('fechaFin', fechaFin || '');
      formData.append('motivo', motivoFinal);

      if (archivo) {
        formData.append('archivo', archivo);
      }

      await fetchConAuth(
        `/api/apoderados/alumno/${alumnoSeleccionado.id}/justificativo`,
        {
          method: 'POST',
          body: formData
        }
      );

      setTipoMotivo('Enfermedad / Motivo Médico');
      setMotivo('');
      setFechaInicio('');
      setFechaFin('');
      setArchivo(null);

      const inputArchivo = document.getElementById('archivo-justificativo');
      if (inputArchivo) {
        inputArchivo.value = '';
      }

      alert('Justificativo enviado correctamente.');
    } catch (err) {
      console.error('Error enviando justificativo:', err);
      setError(err.message || 'No se pudo enviar el justificativo.');
    } finally {
      setEnviandoJustificativo(false);
    }
  };

  const generarQRRetiro = async () => {
    try {
      if (!alumnoSeleccionado?.id) {
        throw new Error('No hay un alumno seleccionado.');
      }

      if (!personaRetiroSeleccionada) {
        throw new Error('Seleccione la persona que realizará el retiro.');
      }

      if (!motivoRetiro.trim()) {
        throw new Error('Ingrese el motivo del retiro.');
      }

      setGenerandoQR(true);
      setError('');
      setSolicitudQR(null);

      const esApoderadoTitular = personaRetiroSeleccionada === 'APODERADO_TITULAR';

      const data = await fetchConAuth('/api/inspectoria/generar-qr', {
        method: 'POST',
        body: JSON.stringify({
          alumnoId: alumnoSeleccionado.id,
          personaAutorizadaId: esApoderadoTitular ? null : personaRetiroSeleccionada,
          retiraApoderado: esApoderadoTitular,
          motivo: motivoRetiro.trim(),
          observacion: observacionRetiro.trim() || null
        })
      });

      setSolicitudQR(data);
    } catch (err) {
      console.error('Error generando QR:', err);
      setError(err.message || 'No se pudo generar el código QR.');
    } finally {
      setGenerandoQR(false);
    }
  };

  const backgroundStyle = {
    backgroundImage: `
      linear-gradient(
        rgba(0, 0, 0, 0.52),
        rgba(0, 0, 0, 0.52)
      ),
      url(${fondoColegio})
    `
  };

  if (cargando) {
    return (
      <main
        className="apoderado-page"
        style={backgroundStyle}
      >
        <section className="apoderado-card">
          <header className="apoderado-header">
            <img
              className="apoderado-header__logo"
              src={logoColegio}
              alt="Colegio Orden de San Jorge"
            />

            <h1 className="apoderado-header__title">
              Portal del Apoderado
            </h1>
            <div className="apoderado-header-acciones">
              <CambiarPassword />

              <button
                type="button"
                className="btn-cerrar-sesion"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </div>
          </header>

          <p style={{ textAlign: 'center' }}>
            Cargando información...
          </p>
        </section>
      </main>
    );
  }

  if (
    error &&
    !alumnoSeleccionado &&
    alumnos.length === 0
  ) {
    return (
      <main
        className="apoderado-page"
        style={backgroundStyle}
      >
        <section className="apoderado-card">
          <header className="apoderado-header">
            <img
              className="apoderado-header__logo"
              src={logoColegio}
              alt="Colegio Orden de San Jorge"
            />

            <h1 className="apoderado-header__title">
              Portal del Apoderado
            </h1>
            <div className="apoderado-header-acciones">
              <CambiarPassword />

              <button
                type="button"
                className="btn-cerrar-sesion"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </div>

            <div className="apoderado-header__divider" />

            {apoderado && (
              <p>
                {apoderado.nombre_completo}
                {' · '}
                RUT: {apoderado.rut}
              </p>
            )}
          </header>

          <div className="alert-repitencia">
            <strong>Error</strong>
            <br />
            {error}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className="apoderado-page"
      style={backgroundStyle}
    >
      <section className="apoderado-card">
        <header className="apoderado-header">
          <img
            className="apoderado-header__logo"
            src={logoColegio}
            alt="Colegio Orden de San Jorge"
          />

          <h1 className="apoderado-header__title">
            Portal del Apoderado
          </h1>

          <div className="apoderado-header-acciones">
            <CambiarPassword />

            <button
              type="button"
              className="btn-cerrar-sesion"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </div>

          <div className="apoderado-header__divider" />

          {apoderado && (
            <p>
              {apoderado.nombre_completo}
              {' · '}
              RUT: {apoderado.rut}
            </p>
          )}
        </header>

        {error && (
          <div className="alert-repitencia">
            <strong>Información</strong>
            <br />
            {error}
          </div>
        )}

        {!alumnoSeleccionado ? (
          <div>
            <p
              style={{
                textAlign: 'center',
                color: '#555',
                marginBottom: '20px'
              }}
            >
              Seleccione el estudiante para ver su
              información académica y de asistencia:
            </p>

            {alumnos.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#666'
                }}
              >
                No hay alumnos asociados a este apoderado.
              </p>
            ) : (
              <div className="alumnos-grid">
                {alumnos.map((alumno) => (
                  <div
                    key={alumno.id}
                    className="alumno-card"
                    onClick={() =>
                      seleccionarAlumno(alumno)
                    }
                  >
                    <h3 className="alumno-card__nombre">
                      {alumno.nombreCompleto}
                    </h3>

                    <p className="alumno-card__info">
                      <strong>Curso:</strong>{' '}
                      {alumno.curso || 'Sin curso'}
                    </p>

                    <p className="alumno-card__info">
                      <strong>RUT:</strong>{' '}
                      {alumno.rut}
                    </p>

                    {alumno.parentesco && (
                      <p className="alumno-card__info">
                        <strong>Parentesco:</strong>{' '}
                        {alumno.parentesco}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <button
              className="btn-back-link"
              onClick={volverAlumnos}
            >
              ← Volver a la lista de alumnos
            </button>

            <h2>
              {alumnoSeleccionado.nombreCompleto}
              {' - '}
              <small>
                {alumnoSeleccionado.curso || 'Sin curso'}
              </small>
            </h2>

            <div className="alumno-resumen">
              <span>
                <strong>RUT:</strong>{' '}
                {alumnoSeleccionado.rut}
              </span>

              <span>
                <strong>Curso:</strong>{' '}
                {alumnoSeleccionado.curso || 'Sin curso'}
              </span>

              {alumnoSeleccionado.jornada && (
                <span>
                  <strong>Jornada:</strong>{' '}
                  {alumnoSeleccionado.jornada}
                </span>
              )}
            </div>

            {alumnoSeleccionado.riesgoRepitencia && (
              <div className="alert-repitencia">
                <strong>
                  Alerta Académica / Asistencia:
                </strong>{' '}
                {alumnoSeleccionado.riesgoRepitencia}
              </div>
            )}

            <nav className="tabs-navigation">
              <button
                className={`tab-btn ${tab === 'notas' ? 'active' : ''
                  }`}
                onClick={() => setTab('notas')}
              >
                Notas y Asignaturas
              </button>

              <button
                className={`tab-btn ${tab === 'anotaciones' ? 'active' : ''
                  }`}
                onClick={() => setTab('anotaciones')}
              >
                Anotaciones
              </button>

              <button
                className={`tab-btn ${tab === 'asistencia' ? 'active' : ''
                  }`}
                onClick={() => setTab('asistencia')}
              >
                Asistencia
              </button>

              <button
                className={`tab-btn ${tab === 'justificativo' ? 'active' : ''
                  }`}
                onClick={() => setTab('justificativo')}
              >
                Subir Justificativo
              </button>

              <button
                className={`tab-btn ${tab === 'qr' ? 'active' : ''
                  }`}
                onClick={() => {
                  setTab('qr');
                  cargarPersonasRetiro();
                }}
              >
                Generar QR Retiro
              </button>

              <button
                className={`tab-btn ${tab === 'certificados' ? 'active' : ''
                  }`}
                onClick={() =>
                  setTab('certificados')
                }
              >
                Certificados
              </button>

              <button
                className={`tab-btn ${tab === 'comunicaciones'
                  ? 'active'
                  : ''
                  }`}
                onClick={() =>
                  setTab('comunicaciones')
                }
              >
                Comunicaciones
              </button>

              <button
                className={`tab-btn ${tab === 'pie' ? 'active' : ''
                  }`}
                onClick={() => setTab('pie')}
              >
                Apoyo Multidisciplinario
              </button>

              <button
                className={`tab-btn ${tab === 'docentes' ? 'active' : ''}`}
                onClick={() => setTab('docentes')}
              >
                Docentes
              </button>
            </nav>

            <div className="tab-content">
              {tab === 'notas' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <h3 style={{ margin: 0, color: '#800020' }}>
                      Notas y Asignaturas (I y II Semestre)
                    </h3>

                    <button
                      type="button"
                      className="btn-action"
                      onClick={() => {
                        const doc = new jsPDF('portrait', 'mm', 'a4');

                        const colorPrimario = [128, 0, 32];
                        const colorTexto = [51, 39, 44];
                        const colorGrisClaro = [248, 243, 245];

                        try {
                          doc.addImage(logoColegio, 'PNG', 14, 12, 16, 16);
                        } catch (e) {
                          console.warn("No se pudo cargar el logo en el PDF", e);
                        }

                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(13);
                        doc.setTextColor(...colorPrimario);
                        doc.text("COLEGIO ORDEN DE SAN JORGE", 35, 18);

                        doc.setFontSize(10);
                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(...colorTexto);
                        doc.text("CONCENTRADO DE CALIFICACIONES OFICIAL", 35, 24);

                        doc.setDrawColor(...colorPrimario);
                        doc.setLineWidth(0.8);
                        doc.line(14, 32, 196, 32);

                        doc.setFillColor(...colorGrisClaro);
                        doc.roundedRect(14, 38, 182, 22, 2, 2, 'F');

                        doc.setFontSize(10);
                        doc.setFont("helvetica", "bold");
                        doc.text(`Estudiante:`, 18, 46);
                        doc.setFont("helvetica", "normal");
                        doc.text(`${alumnoSeleccionado.nombreCompleto}`, 42, 46);

                        doc.setFont("helvetica", "bold");
                        doc.text(`RUT:`, 125, 46);
                        doc.setFont("helvetica", "normal");
                        doc.text(`${alumnoSeleccionado.rut}`, 135, 46);

                        doc.setFont("helvetica", "bold");
                        doc.text(`Curso:`, 18, 54);
                        doc.setFont("helvetica", "normal");
                        doc.text(`${alumnoSeleccionado.curso || 'Sin curso'}`, 32, 54);

                        doc.setFont("helvetica", "bold");
                        doc.text(`Profesor/a Jefe:`, 125, 54);
                        doc.setFont("helvetica", "normal");
                        doc.text(`${alumnoSeleccionado.profesorJefe || 'No registrado'}`, 152, 54);

                        let y = 66;
                        const x = 14;
                        const anchoTotal = 182;

                        doc.setFillColor(...colorPrimario);
                        doc.rect(x, y, anchoTotal, 10, 'F');
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(8);
                        doc.setTextColor(255, 255, 255);

                        doc.text("Asignatura", x + 2, y + 6);
                        doc.text("Primer Semestre (Parciales / Prom)", x + 50, y + 6);
                        doc.text("Segundo Semestre (Parciales / Prom)", x + 112, y + 6);
                        doc.text("Final", x + 168, y + 6);
                        y += 10;

                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(8);

                        if (Array.isArray(alumnoSeleccionado.asignaturas)) {
                          alumnoSeleccionado.asignaturas.forEach((a, index) => {
                            if (y > 270) {
                              doc.addPage();
                              y = 20;
                            }

                            const s1 = Array.isArray(a.notasSemestre1) ? a.notasSemestre1.join(' · ') : (Array.isArray(a.notas) ? a.notas.slice(0, Math.ceil(a.notas.length / 2)).join(' · ') : '-');
                            const p1 = a.promedioSemestre1 || (a.notas?.length > 0 ? a.promedio : '-');
                            const s2 = Array.isArray(a.notasSemestre2) ? a.notasSemestre2.join(' · ') : (Array.isArray(a.notas) ? a.notas.slice(Math.ceil(a.notas.length / 2)).join(' · ') : '-');
                            const p2 = a.promedioSemestre2 || '-';
                            const pf = a.promedio || '-';

                            if (index % 2 === 0) {
                              doc.setFillColor(252, 249, 250);
                              doc.rect(x, y, anchoTotal, 8, 'F');
                            }

                            doc.setDrawColor(226, 215, 219);
                            doc.rect(x, y, anchoTotal, 8);

                            doc.setTextColor(...colorTexto);
                            doc.setFont("helvetica", "bold");
                            doc.text(String(a.nombre || ''), x + 2, y + 5);

                            doc.setFont("helvetica", "normal");
                            doc.text(String(s1 || '-'), x + 50, y + 5, { maxWidth: 45 });
                            doc.setFont("helvetica", "bold");
                            doc.text(String(p1), x + 100, y + 5);

                            doc.setFont("helvetica", "normal");
                            doc.text(String(s2 || '-'), x + 112, y + 5, { maxWidth: 45 });
                            doc.setFont("helvetica", "bold");
                            doc.text(String(p2), x + 160, y + 5);

                            doc.setTextColor(...colorPrimario);
                            doc.text(String(pf), x + 171, y + 5);

                            y += 8;
                          });
                        }

                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(8);
                        doc.setTextColor(100, 100, 100);
                        doc.text("Documento oficial emitido por el Portal del Apoderado - Colegio Orden de San Jorge", 14, doc.internal.pageSize.height - 10);

                        doc.save(`Concentrado_Notas_${alumnoSeleccionado.nombreCompleto.replace(/\s+/g, '_')}.pdf`);
                      }}
                    >
                      Descargar Concentrado Notas
                    </button>
                  </div>

                  {alumnoSeleccionado.asignaturas?.length > 0 ? (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th rowSpan="2" style={{ verticalAlign: 'middle', background: '#800020', color: '#fff' }}>Asignatura</th>
                            <th colSpan="2" style={{ textAlign: 'center', background: '#800020', color: '#fff' }}>Primer Semestre</th>
                            <th colSpan="2" style={{ textAlign: 'center', background: '#800020', color: '#fff' }}>Segundo Semestre</th>
                            <th rowSpan="2" style={{ verticalAlign: 'middle', textAlign: 'center', background: '#800020', color: '#fff' }}>Promedio Final</th>
                          </tr>
                          <tr>
                            <th style={{ background: '#f8f3f5', color: '#800020' }}>Notas Parciales</th>
                            <th style={{ background: '#f8f3f5', color: '#800020', textAlign: 'center' }}>Prom.</th>
                            <th style={{ background: '#f8f3f5', color: '#800020' }}>Notas Parciales</th>
                            <th style={{ background: '#f8f3f5', color: '#800020', textAlign: 'center' }}>Prom.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alumnoSeleccionado.asignaturas.map((a) => {
                            const s1 = Array.isArray(a.notasSemestre1) ? a.notasSemestre1 : (Array.isArray(a.notas) ? a.notas.slice(0, Math.ceil(a.notas.length / 2)) : []);
                            const s2 = Array.isArray(a.notasSemestre2) ? a.notasSemestre2 : (Array.isArray(a.notas) ? a.notas.slice(Math.ceil(a.notas.length / 2)) : []);
                            const p1 = a.promedioSemestre1 || (s1.length > 0 ? a.promedio : '-');
                            const p2 = a.promedioSemestre2 || '-';
                            const pf = a.promedio || '-';

                            return (
                              <tr key={a.asignatura_id || a.id}>
                                <td>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCopiado(false);
                                      setDocenteModal({
                                        asignatura: a.nombre,
                                        docente: a.docente_nombre || 'Docente no registrado',
                                        correo: a.docente_correo || 'correo@ordendesanjorge.cl'
                                      });
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#800020',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: 0
                                    }}
                                  >
                                    {a.nombre} <span style={{ fontSize: '12px', opacity: 0.8 }}>ℹ️</span>
                                  </button>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                    {s1.length > 0 ? s1.map((n, i) => (
                                      <span key={i} style={{ background: parseFloat(n) < 4 ? '#fee2e2' : '#fff', color: parseFloat(n) < 4 ? '#991b1b' : '#33272c', border: '1px solid #e2d7db', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                                        {n}
                                      </span>
                                    )) : <span style={{ fontSize: '12px', color: '#958a8f' }}>-</span>}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#800020' }}>{p1}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                    {s2.length > 0 ? s2.map((n, i) => (
                                      <span key={i} style={{ background: parseFloat(n) < 4 ? '#fee2e2' : '#fff', color: parseFloat(n) < 4 ? '#991b1b' : '#33272c', border: '1px solid #e2d7db', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                                        {n}
                                      </span>
                                    )) : <span style={{ fontSize: '12px', color: '#958a8f' }}>-</span>}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#800020' }}>{p2}</td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold', background: '#f8f3f5', color: '#800020' }}>{pf}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p>No hay notas registradas.</p>
                  )}

                  {docenteModal && (
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.55)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 99999,
                        padding: '20px'
                      }}
                      onClick={() => setDocenteModal(null)}
                    >
                      <div
                        style={{
                          background: '#ffffff',
                          width: '100%',
                          maxWidth: '440px',
                          borderRadius: '20px',
                          padding: '28px 30px',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                          position: 'relative',
                          borderTop: '8px solid #800020',
                          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Cabecera con Logo y Título */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                          {logoColegio && (
                            <img
                              src={logoColegio}
                              alt="Logo Colegio Orden de San Jorge"
                              style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                            />
                          )}
                          <div>
                            <h3 style={{ margin: 0, color: '#800020', fontSize: '18px', fontWeight: '700' }}>
                              Información del Docente
                            </h3>
                            <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                              Colegio Orden de San Jorge
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                          <div style={{ background: '#fcf8f9', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f0e6e8' }}>
                            <span style={{ display: 'block', fontSize: '11px', color: '#800020', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '3px' }}>
                              ASIGNATURA
                            </span>
                            <strong style={{ fontSize: '15px', color: '#2c2c2c' }}>
                              {docenteModal.asignatura}
                            </strong>
                          </div>

                          <div style={{ background: '#fcf8f9', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f0e6e8' }}>
                            <span style={{ display: 'block', fontSize: '11px', color: '#800020', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '3px' }}>
                              DOCENTE A CARGO
                            </span>
                            <strong style={{ fontSize: '15px', color: '#2c2c2c' }}>
                              {docenteModal.docente}
                            </strong>
                          </div>

                          <div style={{ background: '#fcf8f9', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f0e6e8' }}>
                            <span style={{ display: 'block', fontSize: '11px', color: '#800020', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '6px' }}>
                              CORREO ELECTRÓNICO INSTITUCIONAL
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                              <a
                                href={`mailto:${docenteModal.correo}`}
                                style={{
                                  color: '#800020',
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  textDecoration: 'none',
                                  wordBreak: 'break-all'
                                }}
                              >
                                {docenteModal.correo}
                              </a>

                              <button
                                type="button"
                                onClick={() => {
                                  if (docenteModal.correo) {
                                    navigator.clipboard.writeText(docenteModal.correo);
                                    setCopiado(true);
                                    setTimeout(() => setCopiado(false), 2000);
                                  }
                                }}
                                style={{
                                  background: copiado ? '#2e7d32' : '#800020',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '7px 12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {copiado ? '✓ Copiado' : '📋 Copiar'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDocenteModal(null)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: '#800020',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(128, 0, 32, 0.2)',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => (e.target.style.background = '#600018')}
                          onMouseLeave={(e) => (e.target.style.background = '#800020')}
                        >
                          Entendido
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'anotaciones' && (
                <div>
                  <h3>
                    Anotaciones
                  </h3>

                  {alumnoSeleccionado.anotaciones?.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Título</th>
                          <th>Descripción</th>
                          <th>Docente</th>
                        </tr>
                      </thead>

                      <tbody>
                        {alumnoSeleccionado.anotaciones.map(
                          (a) => (
                            <tr key={a.id}>
                              <td>
                                {a.fecha ? (() => {
                                  const [anio, mes, dia] = a.fecha.split('T')[0].split('-');
                                  return anio && mes && dia ? `${dia}/${mes}/${anio}` : a.fecha;
                                })() : '-'}
                              </td>

                              <td>
                                {a.tipo || '-'}
                              </td>

                              <td>
                                {a.titulo || '-'}
                              </td>

                              <td>
                                {a.descripcion || '-'}
                              </td>

                              <td>
                                {[
                                  a.docente_nombres,
                                  a.docente_apellido_paterno,
                                  a.docente_apellido_materno
                                ]
                                  .filter(Boolean)
                                  .join(' ') || '-'}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <p>
                      No hay anotaciones registradas.
                    </p>
                  )}
                </div>
              )}

              {tab === 'asistencia' && (
                <div>
                  <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', color: '#800020' }}>
                        Registro de Asistencia
                      </h3>
                      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        Consulta la asistencia detallada por mes de <strong>{alumnoSeleccionado.nombreCompleto}</strong>.
                      </p>
                    </div>

                    <div style={{ background: '#f8f3f5', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2d7db', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#800020', fontWeight: 'bold' }}>ASISTENCIA ANUAL</span>
                      <strong style={{ fontSize: '20px', color: '#800020' }}>
                        {alumnoSeleccionado.asistenciaPorcentaje !== null ? `${alumnoSeleccionado.asistenciaPorcentaje}%` : '100%'}
                      </strong>
                    </div>
                  </div>

                  {(() => {
                    const listaAsistencia = Array.isArray(alumnoSeleccionado.asistencia) ? alumnoSeleccionado.asistencia : [];

                    const nombresMeses = [
                      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                    ];

                    const asistenciaFiltrada = listaAsistencia.filter((item) => {
                      if (mesAsistenciaFiltro === 'TODOS') return true;
                      if (!item.fecha) return false;
                      const partes = item.fecha.split('T')[0].split('-');
                      if (partes.length >= 2) {
                        const mesNumero = parseInt(partes[1], 10);
                        return mesNumero === parseInt(mesAsistenciaFiltro, 10);
                      }
                      return false;
                    });

                    const totales = {
                      presente: asistenciaFiltrada.filter(a => String(a.estado).toUpperCase() === 'PRESENTE').length,
                      ausente: asistenciaFiltrada.filter(a => String(a.estado).toUpperCase() === 'AUSENTE').length,
                      atrasado: asistenciaFiltrada.filter(a => String(a.estado).toUpperCase() === 'ATRASADO').length,
                      justificado: asistenciaFiltrada.filter(a => String(a.estado).toUpperCase() === 'JUSTIFICADO').length,
                    };

                    return (
                      <div>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
                          <button
                            type="button"
                            onClick={() => setMesAsistenciaFiltro('TODOS')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '20px',
                              border: '1px solid #800020',
                              background: mesAsistenciaFiltro === 'TODOS' ? '#800020' : '#fff',
                              color: mesAsistenciaFiltro === 'TODOS' ? '#fff' : '#800020',
                              fontWeight: '600',
                              fontSize: '13px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Todo el Año
                          </button>

                          {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((numMes) => (
                            <button
                              key={numMes}
                              type="button"
                              onClick={() => setMesAsistenciaFiltro(String(numMes))}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '20px',
                                border: '1px solid #e2d7db',
                                background: mesAsistenciaFiltro === String(numMes) ? '#800020' : '#fcf8f9',
                                color: mesAsistenciaFiltro === String(numMes) ? '#fff' : '#33272c',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {nombresMeses[numMes - 1]}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#065f46', fontWeight: 'bold', display: 'block' }}>PRESENTES</span>
                            <strong style={{ fontSize: '18px', color: '#047857' }}>{totales.presente}</strong>
                          </div>
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 'bold', display: 'block' }}>AUSENTES</span>
                            <strong style={{ fontSize: '18px', color: '#dc2626' }}>{totales.ausente}</strong>
                          </div>
                          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 'bold', display: 'block' }}>ATRASOS</span>
                            <strong style={{ fontSize: '18px', color: '#d97706' }}>{totales.atrasado}</strong>
                          </div>
                          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: 'bold', display: 'block' }}>JUSTIFICADOS</span>
                            <strong style={{ fontSize: '18px', color: '#2563eb' }}>{totales.justificado}</strong>
                          </div>
                        </div>

                        {asistenciaFiltrada.length > 0 ? (
                          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th style={{ background: '#800020', color: '#fff' }}>Fecha</th>
                                  <th style={{ background: '#800020', color: '#fff', textAlign: 'center' }}>Estado</th>
                                  <th style={{ background: '#800020', color: '#fff' }}>Observación / Motivo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {asistenciaFiltrada.map((a, i) => {
                                  const fechaFormateada = a.fecha ? (() => {
                                    const [anio, mes, dia] = a.fecha.split('T')[0].split('-');
                                    return anio && mes && dia ? `${dia}/${mes}/${anio}` : a.fecha;
                                  })() : '-';

                                  const estadoUpper = String(a.estado || '').toUpperCase();

                                  let badgeStyle = { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };

                                  if (estadoUpper === 'PRESENTE') {
                                    badgeStyle = { background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' };
                                  } else if (estadoUpper === 'AUSENTE') {
                                    badgeStyle = { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
                                  } else if (estadoUpper === 'ATRASADO') {
                                    badgeStyle = { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
                                  } else if (estadoUpper === 'JUSTIFICADO') {
                                    badgeStyle = { background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' };
                                  }

                                  return (
                                    <tr key={i}>
                                      <td style={{ fontWeight: '600', color: '#33272c' }}>
                                        {fechaFormateada}
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        <span style={{ ...badgeStyle, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>
                                          {a.estado || '-'}
                                        </span>
                                      </td>
                                      <td style={{ color: '#555', fontSize: '13px' }}>
                                        {a.observacion || '-'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ background: '#fcf8f9', border: '1px solid #f0e6e8', borderRadius: '14px', padding: '30px', textAlign: 'center', color: '#666' }}>
                            No hay registros de asistencia para el mes seleccionado.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {tab === 'justificativo' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 4px 0', color: '#800020' }}>
                      Subir Justificativo de Inasistencia
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      Selecciona el motivo de la inasistencia y adjunta el certificado médico o documento respaldatorio en formato PDF para <strong>{alumnoSeleccionado.nombreCompleto}</strong>.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const motivoFinal = tipoMotivo === 'Otro' ? motivo.trim() : tipoMotivo;

                      if (tipoMotivo === 'Otro' && !motivoFinal) {
                        alert('Por favor, especifica el motivo en el cuadro de texto.');
                        return;
                      }

                      handleSubirJustificativo(motivoFinal);
                    }}
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '24px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px',
                      maxWidth: '600px'
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#33272c', marginBottom: '6px' }}>
                          Fecha de Inicio *
                        </label>
                        <input
                          type="date"
                          className="form-input"
                          value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                          required
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2d7db' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#33272c', marginBottom: '6px' }}>
                          Fecha de Término
                        </label>
                        <input
                          type="date"
                          className="form-input"
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2d7db' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#33272c', marginBottom: '6px' }}>
                        Motivo de la Inasistencia *
                      </label>
                      <select
                        className="form-input"
                        value={tipoMotivo}
                        onChange={(e) => {
                          const nuevoValor = e.target.value;
                          setTipoMotivo(nuevoValor);
                          if (nuevoValor !== 'Otro') {
                            setMotivo('');
                          }
                        }}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2d7db', background: '#fff' }}
                      >
                        <option value="Enfermedad / Motivo Médico">Enfermedad / Motivo Médico (Requiere certificado)</option>
                        <option value="Trámite Familiar o Personal de Fuerza Mayor">Trámite Familiar o Personal de Fuerza Mayor</option>
                        <option value="Desafectación por Competencia Deportiva / Artística">Desafectación por Competencia Deportiva / Artística</option>
                        <option value="Duelo Familiar">Duelo Familiar</option>
                        <option value="Otro">Otro (Especificar)</option>
                      </select>
                    </div>

                    {tipoMotivo === 'Otro' && (
                      <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#800020', marginBottom: '6px' }}>
                          Especifique el motivo detalladamente *
                        </label>
                        <textarea
                          className="form-input"
                          rows="3"
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          placeholder="Escriba aquí el motivo de la inasistencia..."
                          required
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #800020' }}
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#33272c', marginBottom: '6px' }}>
                        Adjuntar Certificado / Documento (PDF) *
                      </label>
                      <input
                        id="archivo-justificativo"
                        type="file"
                        className="form-input"
                        accept="application/pdf,.pdf"
                        onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                        required
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2d7db', background: '#fcf8f9' }}
                      />
                      <small style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>
                        El documento debe ser legible y estar en formato PDF.
                      </small>
                    </div>

                    <button
                      type="submit"
                      className="btn-action"
                      disabled={enviandoJustificativo}
                      style={{
                        padding: '12px',
                        background: '#800020',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background 0.2s'
                      }}
                    >
                      {enviandoJustificativo ? 'Enviando justificativo...' : 'Enviar Justificativo Oficial'}
                    </button>
                  </form>
                </div>
              )}

              {tab === 'qr' && (
                <div className="qr-container">
                  <h3>
                    Generar QR de Retiro
                  </h3>

                  <p>
                    Seleccione la persona autorizada
                    que realizará el retiro del alumno.
                  </p>

                  {cargandoQR ? (
                    <p>
                      Cargando personas autorizadas...
                    </p>
                  ) : personasRetiro.length === 0 ? (
                    <div className="empty-box">
                      <strong>
                        No existen personas autorizadas.
                      </strong>

                      <p>
                        El apoderado debe estar registrado
                        como persona autorizada para poder
                        generar una solicitud de retiro.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>
                          Persona que realizará el retiro:
                        </label>

                        <select
                          className="form-input"
                          value={
                            personaRetiroSeleccionada
                          }
                          onChange={(e) =>
                            setPersonaRetiroSeleccionada(
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            Seleccione una persona
                          </option>

                          {personasRetiro.map(
                            (persona) => (
                              <option
                                key={persona.id}
                                value={persona.id}
                              >
                                {persona.nombre_completo}
                                {persona.parentesco
                                  ? ` - ${persona.parentesco}`
                                  : ''}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>
                          Motivo del retiro:
                        </label>

                        <input
                          type="text"
                          className="form-input"
                          value={motivoRetiro}
                          onChange={(e) =>
                            setMotivoRetiro(
                              e.target.value
                            )
                          }
                          placeholder="Ej: Retiro por trámite médico"
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          Observación:
                        </label>

                        <textarea
                          rows="3"
                          className="form-input"
                          value={observacionRetiro}
                          onChange={(e) =>
                            setObservacionRetiro(
                              e.target.value
                            )
                          }
                          placeholder="Observación adicional"
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-action"
                        onClick={
                          generarQRRetiro
                        }
                        disabled={generandoQR}
                      >
                        {generandoQR
                          ? 'Generando...'
                          : 'Generar Código QR'}
                      </button>

                      {solicitudQR?.solicitud
                        ?.codigo_qr && (
                          <div className="qr-generado">
                            <h4>
                              Código QR generado
                            </h4>

                            <div className="qr-code-box">
                              <QRCodeSVG
                                value={
                                  solicitudQR
                                    .solicitud
                                    .codigo_qr
                                }
                                size={240}
                                level="H"
                                includeMargin={true}
                              />
                            </div>

                            <p>
                              <strong>
                                Alumno:
                              </strong>{' '}
                              {
                                solicitudQR.alumno
                                  ?.nombre
                              }
                            </p>

                            <p>
                              <strong>
                                Curso:
                              </strong>{' '}
                              {
                                solicitudQR.curso
                                  ?.curso_nombre
                              }
                            </p>

                            <p>
                              <strong>
                                Persona autorizada:
                              </strong>{' '}
                              {
                                solicitudQR
                                  .personaAutorizada
                                  ?.nombre_completo
                              }
                            </p>

                            <p className="qr-expiracion">
                              <strong>
                                Válido hasta:
                              </strong>{' '}
                              {solicitudQR.solicitud
                                ?.fecha_expiracion
                                ? new Date(
                                  solicitudQR
                                    .solicitud
                                    .fecha_expiracion
                                ).toLocaleString(
                                  'es-CL'
                                )
                                : '-'}
                            </p>

                            <p className="qr-ayuda">
                              Este código debe ser presentado
                              en Inspectoría. La generación del
                              QR no reemplaza la verificación
                              de identidad y autorización.
                            </p>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}

              {tab === 'certificados' && (
                <div>
                  <h3>
                    Descarga de Certificados Oficiales
                  </h3>

                  <div className="acciones-certificados">
                    <button
                      className="btn-action"
                      type="button"
                      disabled
                    >
                      Certificado Alumno Regular
                    </button>

                    <button
                      className="btn-action"
                      type="button"
                      disabled
                    >
                      Certificado de Matrícula
                    </button>
                  </div>
                </div>
              )}

              {tab === 'comunicaciones' && (
                <div>
                  <h3>
                    Comunicaciones
                  </h3>

                  {alumnoSeleccionado.comunicaciones?.length > 0 ? (
                    alumnoSeleccionado.comunicaciones.map(
                      (c, i) => (
                        <div
                          key={i}
                          className="comunicacion-item"
                        >
                          <h4>
                            {c.titulo} ({c.tipo})
                          </h4>

                          <small>
                            De: {c.remitente} - {c.fecha}
                          </small>

                          <p>
                            {c.contenido}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <p>
                      No hay comunicaciones registradas.
                    </p>
                  )}
                </div>
              )}

              {tab === 'pie' && (
                <div>
                  <h3>
                    Apoyo Multidisciplinario
                  </h3>

                  <p>
                    No hay información de apoyo
                    multidisciplinario registrada actualmente.
                  </p>
                </div>
              )}

              {tab === 'docentes' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#800020' }}>
                      Información Docentes

                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      Profesores que imparten clases actualmente a <strong>{alumnoSeleccionado.nombreCompleto}</strong> ({alumnoSeleccionado.curso || 'Sin curso'}).
                    </p>
                  </div>

                  {(() => {

                    const asignaturasConDocente = Array.isArray(alumnoSeleccionado.asignaturas)
                      ? alumnoSeleccionado.asignaturas.filter(
                        (a) => a.docente_nombre && a.docente_nombre.trim() !== '' && a.docente_nombre !== 'Docente no registrado'
                      )
                      : [];

                    if (asignaturasConDocente.length === 0) {
                      return (
                        <div style={{ background: '#fcf8f9', border: '1px solid #f0e6e8', borderRadius: '14px', padding: '24px', textAlign: 'center', color: '#666' }}>
                          No hay docentes asignados registrados para las asignaturas de este estudiante.
                        </div>
                      );
                    }

                    const mapaDocentes = new Map();
                    asignaturasConDocente.forEach((asig) => {
                      const key = asig.docente_correo || asig.docente_nombre;
                      if (!mapaDocentes.has(key)) {
                        mapaDocentes.set(key, {
                          nombre: asig.docente_nombre,
                          correo: asig.docente_correo || 'Correo no registrado',
                          asignaturas: [asig.nombre]
                        });
                      } else {
                        const existente = mapaDocentes.get(key);
                        if (!existente.asignaturas.includes(asig.nombre)) {
                          existente.asignaturas.push(asig.nombre);
                        }
                      }
                    });

                    const listaDocentes = Array.from(mapaDocentes.values());

                    return (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                          gap: '18px'
                        }}
                      >
                        {listaDocentes.map((docente, idx) => {
                          const estaCopiado = correoCopiado === docente.correo;

                          return (
                            <div
                              key={idx}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #e2d7db',
                                borderTop: '5px solid #800020',
                                borderRadius: '14px',
                                padding: '20px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '14px'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                  {docente.asignaturas.map((ramo, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        background: '#f8f3f5',
                                        color: '#800020',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        padding: '3px 9px',
                                        borderRadius: '6px',
                                        border: '1px solid #e6d5da'
                                      }}
                                    >
                                      {ramo}
                                    </span>
                                  ))}
                                </div>

                                <h4 style={{ margin: '0 0 4px 0', color: '#2c2c2c', fontSize: '16px', fontWeight: '700' }}>
                                  {docente.nombre}
                                </h4>
                                <span style={{ fontSize: '12px', color: '#777078' }}>
                                  Docente de Asignatura
                                </span>
                              </div>

                              <div
                                style={{
                                  background: '#fcf8f9',
                                  padding: '10px 12px',
                                  borderRadius: '10px',
                                  border: '1px solid #f0e6e8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px'
                                }}
                              >
                                <a
                                  href={`mailto:${docente.correo}`}
                                  style={{
                                    color: '#800020',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={docente.correo}
                                >
                                  {docente.correo}
                                </a>

                                {docente.correo !== 'Correo no registrado' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(docente.correo);
                                      setCorreoCopiado(docente.correo);
                                      setTimeout(() => setCorreoCopiado(null), 2000);
                                    }}
                                    style={{
                                      background: estaCopiado ? '#2e7d32' : '#800020',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '7px',
                                      padding: '6px 10px',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      transition: 'background 0.2s ease'
                                    }}
                                  >
                                    {estaCopiado ? '✓ Copiado' : 'Copiar'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default ApoderadoDashboard;