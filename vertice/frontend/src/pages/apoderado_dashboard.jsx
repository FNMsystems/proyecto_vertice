import React, { useEffect, useState } from 'react';
import logoColegio from "../img/logo_Institucional.png";
import fondoColegio from "../img/home_fondo.jpeg";
import "./apoderado_dashboard.css";
import { fetchConAuth } from "../services/apiService.js";
import { QRCodeSVG } from "qrcode.react";
import CambiarPassword from '../components/CambiarPassword.jsx';

function ApoderadoDashboard({ apoderadoRut }) {
  const [apoderado, setApoderado] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [tab, setTab] = useState('notas');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [motivo, setMotivo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [enviandoJustificativo, setEnviandoJustificativo] = useState(false);

  const [personasRetiro, setPersonasRetiro] = useState([]);
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

      const lista = Array.isArray(personas)
        ? personas
        : [];

      setPersonasRetiro(lista);

      if (lista.length > 0) {
        setPersonaRetiroSeleccionada(lista[0].id);
      }
    } catch (err) {
      console.error(
        'Error cargando personas autorizadas:',
        err
      );

      setError(
        err.message ||
        'No se pudieron cargar las personas autorizadas.'
      );
    } finally {
      setCargandoQR(false);
    }
  };

  const handleSubirJustificativo = async () => {
    try {
      if (!alumnoSeleccionado?.id) {
        throw new Error(
          'No hay un alumno seleccionado.'
        );
      }

      if (!fechaInicio) {
        throw new Error(
          'Debe seleccionar la fecha de inicio.'
        );
      }

      if (!motivo.trim()) {
        throw new Error(
          'Debe ingresar el motivo del justificativo.'
        );
      }

      if (fechaFin && fechaFin < fechaInicio) {
        throw new Error(
          'La fecha de término no puede ser anterior a la fecha de inicio.'
        );
      }

      setEnviandoJustificativo(true);
      setError('');

      const formData = new FormData();

      formData.append(
        'fechaInicio',
        fechaInicio
      );

      formData.append(
        'fechaFin',
        fechaFin || ''
      );

      formData.append(
        'motivo',
        motivo.trim()
      );

      if (archivo) {
        formData.append(
          'archivo',
          archivo
        );
      }

      await fetchConAuth(
        `/api/apoderados/alumno/${alumnoSeleccionado.id}/justificativo`,
        {
          method: 'POST',
          body: formData
        }
      );

      setMotivo('');
      setFechaInicio('');
      setFechaFin('');
      setArchivo(null);

      const inputArchivo =
        document.getElementById(
          'archivo-justificativo'
        );

      if (inputArchivo) {
        inputArchivo.value = '';
      }

      alert(
        'Justificativo enviado correctamente.'
      );
    } catch (err) {
      console.error(
        'Error enviando justificativo:',
        err
      );

      setError(
        err.message ||
        'No se pudo enviar el justificativo.'
      );
    } finally {
      setEnviandoJustificativo(false);
    }
  };

  const generarQRRetiro = async () => {
    try {
      if (!alumnoSeleccionado?.id) {
        throw new Error(
          'No hay un alumno seleccionado.'
        );
      }

      if (!personaRetiroSeleccionada) {
        throw new Error(
          'Seleccione la persona que realizará el retiro.'
        );
      }

      if (!motivoRetiro.trim()) {
        throw new Error(
          'Ingrese el motivo del retiro.'
        );
      }

      setGenerandoQR(true);
      setError('');
      setSolicitudQR(null);

      const data = await fetchConAuth(
        '/api/inspectoria/generar-qr',
        {
          method: 'POST',
          body: JSON.stringify({
            alumnoId: alumnoSeleccionado.id,
            personaAutorizadaId:
              personaRetiroSeleccionada,
            motivo: motivoRetiro.trim(),
            observacion:
              observacionRetiro.trim() || null
          })
        }
      );

      setSolicitudQR(data);
    } catch (err) {
      console.error(
        'Error generando QR:',
        err
      );

      setError(
        err.message ||
        'No se pudo generar el código QR.'
      );
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
            </nav>

            <div className="tab-content">
              {tab === 'notas' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <h3 style={{ margin: 0 }}>
                      Notas y Asignaturas
                    </h3>

                    <button
                      type="button"
                      className="btn-action"
                      onClick={() => {
                        const ventanaImpresion = window.open('', '_blank');
                        ventanaImpresion.document.write(`
                          <html>
                            <head>
                              <title>Concentrado de Notas Oficial - ${alumnoSeleccionado.nombreCompleto}</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
                                .header { text-align: center; border-bottom: 3px solid #800020; padding-bottom: 20px; margin-bottom: 30px; }
                                .header h2 { color: #17365d; font-size: 18px; margin: 0; letter-spacing: 1px; }
                                .header h1 { color: #800020; font-size: 24px; margin: 8px 0; }
                                .info-container { background: #f8fafc; border: 1px solid #cbd5e1; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; }
                                .info-container div span { color: #64748b; }
                                h3.seccion-titulo { color: #17365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 30px; font-size: 16px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
                                th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13px; }
                                th { background: #17365d; color: white; font-weight: 700; }
                                .rojo { color: #991b1b; font-weight: bold; }
                                .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                                @media print {
                                  body { padding: 20px; }
                                  button { display: none; }
                                }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h2>COLEGIO ORDEN DE SAN JORGE</h2>
                                <h1>CONCENTRADO DE CALIFICACIONES OFICIAL</h1>
                              </div>

                              <div class="info-container">
                                <div><span>Estudiante:</span> <strong>${alumnoSeleccionado.nombreCompleto}</strong></div>
                                <div><span>RUT:</span> <strong>${alumnoSeleccionado.rut}</strong></div>
                                <div><span>Curso:</span> <strong>${alumnoSeleccionado.curso || 'Sin curso'}</strong></div>
                                <div><span>Profesor/a Jefe:</span> <strong>${alumnoSeleccionado.profesorJefe || 'No registrado'}</strong></div>
                              </div>

                              <!-- PRIMER SEMESTRE -->
                              <h3 class="seccion-titulo">I Semestre</h3>
                              <table>
                                <thead>
                                  <tr>
                                    <th style="width: 35%;">Asignatura</th>
                                    <th>Calificaciones Parciales</th>
                                    <th style="width: 15%; text-align: center;">Promedio</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${alumnoSeleccionado.asignaturas.map(a => `
                                    <tr>
                                      <td><strong>${a.nombre}</strong></td>
                                      <td>${Array.isArray(a.notasSemestre1) && a.notasSemestre1.length > 0 ? a.notasSemestre1.join(' · ') : (Array.isArray(a.notas) ? a.notas.slice(0, Math.ceil(a.notas.length / 2)).join(' · ') : 'Sin notas')}</td>
                                      <td style="text-align: center;"><strong>${a.promedioSemestre1 || a.promedio || '-'}</strong></td>
                                    </tr>
                                  `).join('')}
                                </tbody>
                              </table>

                              <!-- SEGUNDO SEMESTRE -->
                              <h3 class="seccion-titulo">II Semestre</h3>
                              <table>
                                <thead>
                                  <tr>
                                    <th style="width: 35%;">Asignatura</th>
                                    <th>Calificaciones Parciales</th>
                                    <th style="width: 15%; text-align: center;">Promedio</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${alumnoSeleccionado.asignaturas.map(a => `
                                    <tr>
                                      <td><strong>${a.nombre}</strong></td>
                                      <td>${Array.isArray(a.notasSemestre2) && a.notasSemestre2.length > 0 ? a.notasSemestre2.join(' · ') : (Array.isArray(a.notas) ? a.notas.slice(Math.ceil(a.notas.length / 2)).join(' · ') : 'Sin notas')}</td>
                                      <td style="text-align: center;"><strong>${a.promedioSemestre2 || '-'}</strong></td>
                                    </tr>
                                  `).join('')}
                                </tbody>
                              </table>

                              <div style="text-align: center; margin-top: 30px;">
                                <button onclick="window.print()" style="background: #800020; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer;">
                                  Guardar como PDF
                                </button>
                              </div>

                              <div class="footer">
                                <p>Documento oficial emitido por el Portal del Apoderado - Colegio Orden de San Jorge</p>
                              </div>
                            </body>
                          </html>
                        `);
                        ventanaImpresion.document.close();
                      }}
                    >
                      Concentrado de Notas
                    </button>
                  </div>

                  {alumnoSeleccionado.asignaturas?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h4 style={{ color: '#17365d', margin: '0 0 15px 0', fontSize: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                          Primer Semestre
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {alumnoSeleccionado.asignaturas.map((a) => {
                            
                            const notasS1 = Array.isArray(a.notasSemestre1) ? a.notasSemestre1 : (Array.isArray(a.notas) ? a.notas.slice(0, Math.ceil(a.notas.length / 2)) : []);
                            const promS1 = a.promedioSemestre1 || (notasS1.length > 0 ? a.promedio : '-');
                            const promNum = parseFloat(promS1);
                            const esReprobado = !isNaN(promNum) && promNum < 4.0;

                            return (
                              <div key={a.asignatura_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #edf2f7', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                  <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px', display: 'block', marginBottom: '4px' }}>{a.nombre}</span>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {notasS1.length > 0 ? notasS1.map((n, i) => (
                                      <span key={i} style={{ background: parseFloat(n) < 4 ? '#fee2e2' : '#ffffff', color: parseFloat(n) < 4 ? '#991b1b' : '#334155', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                                        {n}
                                      </span>
                                    )) : <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sin notas</span>}
                                  </div>
                                </div>
                                <div style={{ background: esReprobado ? '#fff5f5' : '#f0fdf4', color: esReprobado ? '#9b2c2c' : '#166534', border: `1px solid ${esReprobado ? '#feb2b2' : '#bbf7d0'}`, padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                                  Prom: {promS1}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h4 style={{ color: '#17365d', margin: '0 0 15px 0', fontSize: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                          Segundo Semestre
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {alumnoSeleccionado.asignaturas.map((a) => {
                            const notasS2 = Array.isArray(a.notasSemestre2) ? a.notasSemestre2 : (Array.isArray(a.notas) ? a.notas.slice(Math.ceil(a.notas.length / 2)) : []);
                            const promS2 = a.promedioSemestre2 || '-';
                            const promNum = parseFloat(promS2);
                            const esReprobado = !isNaN(promNum) && promNum < 4.0;

                            return (
                              <div key={a.asignatura_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #edf2f7', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                  <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px', display: 'block', marginBottom: '4px' }}>{a.nombre}</span>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {notasS2.length > 0 ? notasS2.map((n, i) => (
                                      <span key={i} style={{ background: parseFloat(n) < 4 ? '#fee2e2' : '#ffffff', color: parseFloat(n) < 4 ? '#991b1b' : '#334155', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                                        {n}
                                      </span>
                                    )) : <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sin notas en este período</span>}
                                  </div>
                                </div>
                                <div style={{ background: promS2 === '-' ? '#f1f5f9' : (esReprobado ? '#fff5f5' : '#f0fdf4'), color: promS2 === '-' ? '#64748b' : (esReprobado ? '#9b2c2c' : '#166534'), border: `1px solid ${promS2 === '-' ? '#cbd5e1' : (esReprobado ? '#feb2b2' : '#bbf7d0')}`, padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                                  Prom: {promS2}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <p>No hay notas registradas.</p>
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
                                {a.fecha || '-'}
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
                  <h3>
                    Asistencia
                  </h3>

                  <p className="asistencia-resumen">
                    <strong>
                      Porcentaje de Asistencia Anual:
                    </strong>{' '}
                    {alumnoSeleccionado.asistenciaPorcentaje !==
                      null
                      ? `${alumnoSeleccionado.asistenciaPorcentaje}%`
                      : 'Sin datos'}
                  </p>

                  {alumnoSeleccionado.asistencia?.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Estado</th>
                          <th>Observación</th>
                        </tr>
                      </thead>

                      <tbody>
                        {alumnoSeleccionado.asistencia.map(
                          (a, i) => (
                            <tr key={i}>
                              <td>
                                {a.fecha || '-'}
                              </td>

                              <td>
                                {a.estado || '-'}
                              </td>

                              <td>
                                {a.observacion || '-'}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <p>
                      No hay registros de asistencia.
                    </p>
                  )}
                </div>
              )}

              {tab === 'justificativo' && (
                <div>
                  <h3>
                    Subir Justificativo
                  </h3>

                  <p>
                    Ingrese los datos del justificativo
                    y adjunte el certificado correspondiente
                    en formato PDF.
                  </p>

                  <div className="form-justificativo">
                    <div className="form-group">
                      <label>
                        Fecha de inicio:
                      </label>

                      <input
                        type="date"
                        className="form-input"
                        value={fechaInicio}
                        onChange={(e) =>
                          setFechaInicio(
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Fecha de término:
                      </label>

                      <input
                        type="date"
                        className="form-input"
                        value={fechaFin}
                        onChange={(e) =>
                          setFechaFin(
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Motivo de la inasistencia:
                      </label>

                      <textarea
                        className="form-input"
                        rows="4"
                        value={motivo}
                        onChange={(e) =>
                          setMotivo(
                            e.target.value
                          )
                        }
                        placeholder="Ingrese el motivo de la inasistencia"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Adjuntar certificado PDF:
                      </label>

                      <input
                        id="archivo-justificativo"
                        type="file"
                        className="form-input"
                        accept="application/pdf,.pdf"
                        onChange={(e) =>
                          setArchivo(
                            e.target.files?.[0] ||
                            null
                          )
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="btn-action"
                      onClick={
                        handleSubirJustificativo
                      }
                      disabled={
                        enviandoJustificativo
                      }
                    >
                      {enviandoJustificativo
                        ? 'Enviando...'
                        : 'Enviar Justificativo'}
                    </button>
                  </div>
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
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default ApoderadoDashboard;