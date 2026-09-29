import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  logoutService,
  getUsuarioActual
} from '../services/authService.js';
import {
  validarRetiroQR,
  confirmarRetiro
} from '../services/inspectoriaService.js';
import {
  obtenerCursosInspector,
  obtenerAlumnosCurso,
  registrarRetraso
} from '../services/retrasoService.js';
import logoColegio from '../img/logo_institucional.png';
import fondoInstitucional from '../img/fondo_institucional.jpeg';
import './inspectoria_dashboard.css';

export default function InspectoriaDashboard() {
  const navigate = useNavigate();
  const usuario = getUsuarioActual();

  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);

  const [codigoQR, setCodigoQR] = useState('');
  const [retiro, setRetiro] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const [observacion, setObservacion] =
    useState('');

  const [scannerActivo, setScannerActivo] =
    useState(false);

  const [scannerDisponible, setScannerDisponible] =
    useState(true);

  const [confirmado, setConfirmado] =
    useState(false);

  const [cursos, setCursos] =
    useState([]);

  const [alumnos, setAlumnos] =
    useState([]);

  const [cursoSeleccionado, setCursoSeleccionado] =
    useState('');

  const [alumnoSeleccionado, setAlumnoSeleccionado] =
    useState('');

  const [fechaAtraso, setFechaAtraso] =
    useState('');

  const [horaLlegada, setHoraLlegada] =
    useState('');

  const [motivoAtraso, setMotivoAtraso] =
    useState('');

  const [observacionAtraso, setObservacionAtraso] =
    useState('');

  const [cargandoCursos, setCargandoCursos] =
    useState(false);

  const [cargandoAlumnos, setCargandoAlumnos] =
    useState(false);

  const [registrandoAtraso, setRegistrandoAtraso] =
    useState(false);

  const [mensajeAtraso, setMensajeAtraso] =
    useState('');

  const [errorAtraso, setErrorAtraso] =
    useState('');

  const handleLogout = () => {
    logoutService();
    navigate('/');
  };

  const limpiarMensajes = () => {
    setError('');
    setMensaje('');
  };

  const limpiarMensajesAtraso = () => {
    setErrorAtraso('');
    setMensajeAtraso('');
  };

  const cargarCursos = async () => {
    try {
      setCargandoCursos(true);
      limpiarMensajesAtraso();

      const resultado =
        await obtenerCursosInspector();

      setCursos(
        resultado?.cursos || []
      );
    } catch (error) {
      console.error(
        'Error cargando cursos:',
        error
      );

      setErrorAtraso(
        error.message ||
        'No se pudieron cargar los cursos.'
      );
    } finally {
      setCargandoCursos(false);
    }
  };

  const seleccionarCurso = async (
    cursoId
  ) => {
    setCursoSeleccionado(cursoId);
    setAlumnoSeleccionado('');
    setAlumnos([]);
    limpiarMensajesAtraso();

    if (!cursoId) {
      return;
    }

    try {
      setCargandoAlumnos(true);

      const resultado =
        await obtenerAlumnosCurso(
          cursoId
        );

      setAlumnos(
        resultado?.alumnos || []
      );
    } catch (error) {
      console.error(
        'Error cargando alumnos:',
        error
      );

      setErrorAtraso(
        error.message ||
        'No se pudieron cargar los alumnos.'
      );
    } finally {
      setCargandoAlumnos(false);
    }
  };

  const registrarAtrasoFormulario =
    async () => {
      limpiarMensajesAtraso();

      if (!cursoSeleccionado) {
        setErrorAtraso(
          'Debe seleccionar un curso.'
        );
        return;
      }

      if (!alumnoSeleccionado) {
        setErrorAtraso(
          'Debe seleccionar un alumno.'
        );
        return;
      }

      if (!fechaAtraso) {
        setErrorAtraso(
          'Debe indicar la fecha del atraso.'
        );
        return;
      }

      if (!horaLlegada) {
        setErrorAtraso(
          'Debe indicar la hora de llegada.'
        );
        return;
      }

      try {
        setRegistrandoAtraso(true);

        const resultado =
          await registrarRetraso({
            alumnoId:
              alumnoSeleccionado,
            cursoId:
              cursoSeleccionado,
            fecha:
              fechaAtraso,
            horaLlegada:
              horaLlegada,
            motivo:
              motivoAtraso.trim(),
            observacion:
              observacionAtraso.trim()
          });

        setMensajeAtraso(
          resultado?.mensaje ||
          'Atraso registrado correctamente.'
        );

        setAlumnoSeleccionado('');
        setMotivoAtraso('');
        setObservacionAtraso('');

        setHoraLlegada(
          new Date()
            .toLocaleTimeString(
              'es-CL',
              {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }
            )
        );
      } catch (error) {
        console.error(
          'Error registrando atraso:',
          error
        );

        setErrorAtraso(
          error.message ||
          'No se pudo registrar el atraso.'
        );
      } finally {
        setRegistrandoAtraso(false);
      }
    };

  const validarCodigo = async (
    codigo = codigoQR
  ) => {
    const codigoLimpio =
      String(codigo || '').trim();

    if (!codigoLimpio) {
      setError(
        'Debe ingresar o escanear un código QR.'
      );
      return;
    }

    try {
      setCargando(true);
      limpiarMensajes();
      detenerScanner();

      const resultado =
        await validarRetiroQR(
          codigoLimpio
        );

      setRetiro(resultado);
      setConfirmado(false);
      setObservacion('');
      setCodigoQR(codigoLimpio);

      setMensaje(
        'Código QR válido. Verifique físicamente la identidad de la persona antes de autorizar el retiro.'
      );
    } catch (error) {
      console.error(
        'Error validando QR:',
        error
      );

      setRetiro(null);

      setError(
        error.message ||
        'El código QR no es válido.'
      );
    } finally {
      setCargando(false);
    }
  };

  const confirmar = async () => {
    if (!retiro?.retiro?.id) {
      setError(
        'No existe una solicitud válida para confirmar.'
      );
      return;
    }

    if (!retiro?.alumno?.id) {
      setError(
        'No se encontró el alumno asociado al retiro.'
      );
      return;
    }

    if (!retiro?.alumno?.cursoId) {
      setError(
        'No se encontró el curso asociado al retiro.'
      );
      return;
    }

    const confirmarFisicamente =
      window.confirm(
        'Confirme que verificó físicamente la identidad de la persona autorizada y que los datos coinciden.'
      );

    if (!confirmarFisicamente) {
      return;
    }

    try {
      setConfirmando(true);
      limpiarMensajes();

      await confirmarRetiro({
        solicitudId:
          retiro.retiro.id,
        alumnoId:
          retiro.alumno.id,
        cursoId:
          retiro.alumno.cursoId,
        motivo:
          retiro.retiro.motivo,
        observacion:
          observacion.trim() ||
          retiro.retiro.observacion ||
          ''
      });

      setConfirmado(true);

      setMensaje(
        'Retiro autorizado y registrado correctamente. El código QR ya no puede volver a utilizarse.'
      );
    } catch (error) {
      console.error(
        'Error confirmando retiro:',
        error
      );

      setError(
        error.message ||
        'No se pudo confirmar el retiro.'
      );
    } finally {
      setConfirmando(false);
    }
  };

  const nuevoRetiro = () => {
    detenerScanner();

    setCodigoQR('');
    setRetiro(null);
    setObservacion('');
    setConfirmado(false);
    setError('');
    setMensaje('');
  };

  const iniciarScanner = async () => {
    try {
      limpiarMensajes();

      if (scannerRef.current) {
        return;
      }

      if (
        !scannerContainerRef.current
      ) {
        return;
      }

      const modulo =
        await import('html5-qrcode');

      const Html5Qrcode =
        modulo.Html5Qrcode;

      const scanner =
        new Html5Qrcode(
          'qr-reader'
        );

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: 'environment'
        },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250
          }
        },
        (decodedText) => {
          setCodigoQR(decodedText);
          validarCodigo(decodedText);
        },
        () => {}
      );

      setScannerActivo(true);
    } catch (error) {
      console.error(
        'Error iniciando scanner:',
        error
      );

      scannerRef.current = null;
      setScannerActivo(false);

      setScannerDisponible(false);

      setError(
        'No se pudo iniciar la cámara. Puede ingresar el código QR manualmente.'
      );
    }
  };

  const detenerScanner = async () => {
    if (!scannerRef.current) {
      setScannerActivo(false);
      return;
    }

    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (error) {
      console.error(
        'Error deteniendo scanner:',
        error
      );
    }

    scannerRef.current = null;
    setScannerActivo(false);
  };

  useEffect(() => {
    const hoy =
      new Date()
        .toISOString()
        .split('T')[0];

    const hora =
      new Date()
        .toLocaleTimeString(
          'es-CL',
          {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }
        );

    setFechaAtraso(hoy);
    setHoraLlegada(hora);

    cargarCursos();

    return () => {
      detenerScanner();
    };
  }, []);

  return (
    <div
      className="inspectoria-page"
      style={{
        backgroundImage: `url(${fondoInstitucional})`
      }}
    >
      <header className="inspectoria-header">
        <div className="inspectoria-brand">
          <img
            src={logoColegio}
            alt="Logo institucional"
            className="inspectoria-logo"
          />

          <div>
            <h1>
              Inspectoría
            </h1>

            <p>
              Control y autorización de retiros
            </p>
          </div>
        </div>

        <div className="inspectoria-user">
          <div className="inspectoria-user-info">
            <strong>
              {usuario?.nombre ||
                'Inspectoría'}
            </strong>

            <span>
              {usuario?.rut || ''}
            </span>
          </div>

          <button
            className="inspectoria-logout"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="inspectoria-main">
        <section className="inspectoria-card">
          <div className="inspectoria-card-header">
            <div>
              <h2>
                Validar retiro mediante QR
              </h2>

              <p>
                Escanee el código presentado
                por el apoderado o ingrese el
                código manualmente.
              </p>
            </div>

            <div className="security-badge">
              QR seguro
            </div>
          </div>

          <div className="inspectoria-content">
            {!retiro && (
              <>
                <div className="scanner-section">
                  <div className="scanner-title">
                    <h3>
                      Escáner QR
                    </h3>

                    <span>
                      El código debe estar vigente.
                    </span>
                  </div>

                  <div
                    id="qr-reader"
                    ref={scannerContainerRef}
                    className={
                      scannerActivo
                        ? 'qr-reader activo'
                        : 'qr-reader'
                    }
                  ></div>

                  <div className="scanner-actions">
                    {!scannerActivo ? (
                      scannerDisponible && (
                        <button
                          className="btn-inspectoria-primary"
                          onClick={
                            iniciarScanner
                          }
                        >
                          Activar cámara
                        </button>
                      )
                    ) : (
                      <button
                        className="btn-inspectoria-secondary"
                        onClick={
                          detenerScanner
                        }
                      >
                        Detener cámara
                      </button>
                    )}
                  </div>
                </div>

                <div className="separador">
                  <span>
                    O INGRESE EL CÓDIGO
                  </span>
                </div>

                <div className="manual-section">
                  <label>
                    Código QR
                  </label>

                  <input
                    type="text"
                    value={codigoQR}
                    onChange={(e) =>
                      setCodigoQR(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter'
                      ) {
                        validarCodigo();
                      }
                    }}
                    placeholder="Ingrese el código UUID del QR"
                  />

                  <button
                    className="btn-inspectoria-primary"
                    onClick={() =>
                      validarCodigo()
                    }
                    disabled={cargando}
                  >
                    {cargando
                      ? 'Validando...'
                      : 'Validar código'}
                  </button>
                </div>
              </>
            )}

            {mensaje && (
              <div className="inspectoria-alert success">
                {mensaje}
              </div>
            )}

            {error && (
              <div className="inspectoria-alert error">
                {error}
              </div>
            )}

            {retiro && (
              <div className="retiro-validado">
                <div className="retiro-status">
                  <div className="status-icon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Solicitud válida
                    </strong>

                    <span>
                      Verifique la identidad
                      antes de confirmar.
                    </span>
                  </div>
                </div>

                <div className="datos-grid">
                  <div className="datos-card">
                    <div className="datos-card-title">
                      Alumno
                    </div>

                    <div className="dato">
                      <span>
                        Nombre completo
                      </span>

                      <strong>
                        {
                          retiro.alumno
                            ?.nombre
                        }
                      </strong>
                    </div>

                    <div className="dato">
                      <span>
                        RUT
                      </span>

                      <strong>
                        {
                          retiro.alumno
                            ?.rut
                        }
                      </strong>
                    </div>

                    <div className="dato">
                      <span>
                        Curso
                      </span>

                      <strong>
                        {
                          retiro.alumno
                            ?.curso
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="datos-card">
                    <div className="datos-card-title">
                      Persona autorizada
                    </div>

                    <div className="dato">
                      <span>
                        Nombre completo
                      </span>

                      <strong>
                        {
                          retiro
                            .personaAutorizada
                            ?.nombre
                        }
                      </strong>
                    </div>

                    <div className="dato">
                      <span>
                        RUT
                      </span>

                      <strong>
                        {
                          retiro
                            .personaAutorizada
                            ?.rut
                        }
                      </strong>
                    </div>

                    <div className="dato">
                      <span>
                        Parentesco
                      </span>

                      <strong>
                        {
                          retiro
                            .personaAutorizada
                            ?.parentesco ||
                          '-'
                        }
                      </strong>
                    </div>

                    <div className="dato">
                      <span>
                        Teléfono
                      </span>

                      <strong>
                        {
                          retiro
                            .personaAutorizada
                            ?.telefono ||
                          '-'
                        }
                      </strong>
                    </div>

                    <div className="dato">
                      <span>
                        N.º autorización
                      </span>

                      <strong>
                        {
                          retiro
                            .personaAutorizada
                            ?.numeroAutorizacion ||
                          '-'
                        }
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="motivo-card">
                  <span>
                    Motivo del retiro
                  </span>

                  <strong>
                    {
                      retiro.retiro
                        ?.motivo
                    }
                  </strong>

                  {retiro.retiro
                    ?.observacion && (
                    <p>
                      {
                        retiro.retiro
                          .observacion
                      }
                    </p>
                  )}
                </div>

                {!confirmado && (
                  <div className="confirmacion-section">
                    <label>
                      Observación de Inspectoría
                    </label>

                    <textarea
                      value={observacion}
                      onChange={(e) =>
                        setObservacion(
                          e.target.value
                        )
                      }
                      rows="4"
                      placeholder="Registre aquí una observación si corresponde."
                    />

                    <div className="verificacion-box">
                      <strong>
                        Antes de confirmar
                      </strong>

                      <p>
                        Verifique presencialmente
                        que la persona que realiza
                        el retiro coincide con los
                        datos de la solicitud y con
                        la persona autorizada.
                      </p>
                    </div>

                    <button
                      className="btn-confirmar-retiro"
                      onClick={
                        confirmar
                      }
                      disabled={
                        confirmando
                      }
                    >
                      {confirmando
                        ? 'Registrando retiro...'
                        : 'Confirmar y autorizar retiro'}
                    </button>
                  </div>
                )}

                {confirmado && (
                  <div className="retiro-confirmado">
                    <div className="confirmado-icon">
                      ✓
                    </div>

                    <h3>
                      Retiro registrado
                    </h3>

                    <p>
                      El retiro fue autorizado
                      correctamente y el código
                      QR quedó inutilizado.
                    </p>

                    <button
                      className="btn-inspectoria-primary"
                      onClick={
                        nuevoRetiro
                      }
                    >
                      Validar otro retiro
                    </button>
                  </div>
                )}

                {!confirmado && (
                  <div className="retiro-actions">
                    <button
                      className="btn-inspectoria-secondary"
                      onClick={
                        nuevoRetiro
                      }
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}

            <section className="atraso-section">
              <div className="atraso-header">
                <div>
                  <h2>
                    Registrar atraso
                  </h2>

                  <p>
                    Seleccione el curso y luego
                    el alumno que llegó atrasado.
                  </p>
                </div>

                <div className="atraso-badge">
                  Inspectoría
                </div>
              </div>

              <div className="atraso-form">
                <div className="atraso-field">
                  <label>
                    Curso
                  </label>

                  <select
                    value={
                      cursoSeleccionado
                    }
                    onChange={(e) =>
                      seleccionarCurso(
                        e.target.value
                      )
                    }
                    disabled={
                      cargandoCursos
                    }
                  >
                    <option value="">
                      {cargandoCursos
                        ? 'Cargando cursos...'
                        : 'Seleccione un curso'}
                    </option>

                    {cursos.map(
                      (curso) => (
                        <option
                          key={
                            curso.id
                          }
                          value={
                            curso.id
                          }
                        >
                          {curso.nombre}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="atraso-field">
                  <label>
                    Alumno
                  </label>

                  <select
                    value={
                      alumnoSeleccionado
                    }
                    onChange={(e) =>
                      setAlumnoSeleccionado(
                        e.target.value
                      )
                    }
                    disabled={
                      !cursoSeleccionado ||
                      cargandoAlumnos
                    }
                  >
                    <option value="">
                      {!cursoSeleccionado
                        ? 'Primero seleccione un curso'
                        : cargandoAlumnos
                        ? 'Cargando alumnos...'
                        : alumnos.length === 0
                        ? 'No hay alumnos disponibles'
                        : 'Seleccione un alumno'}
                    </option>

                    {alumnos.map(
                      (alumno) => (
                        <option
                          key={
                            alumno.id
                          }
                          value={
                            alumno.id
                          }
                        >
                          {
                            alumno.nombre_completo
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="atraso-datos">
                  <div className="atraso-field">
                    <label>
                      Fecha
                    </label>

                    <input
                      type="date"
                      value={
                        fechaAtraso
                      }
                      onChange={(e) =>
                        setFechaAtraso(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="atraso-field">
                    <label>
                      Hora de llegada
                    </label>

                    <input
                      type="time"
                      value={
                        horaLlegada
                      }
                      onChange={(e) =>
                        setHoraLlegada(
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="atraso-field">
                  <label>
                    Motivo
                  </label>

                  <input
                    type="text"
                    value={
                      motivoAtraso
                    }
                    onChange={(e) =>
                      setMotivoAtraso(
                        e.target.value
                      )
                    }
                    placeholder="Ej.: Problemas de locomoción"
                  />
                </div>

                <div className="atraso-field">
                  <label>
                    Observación
                  </label>

                  <textarea
                    value={
                      observacionAtraso
                    }
                    onChange={(e) =>
                      setObservacionAtraso(
                        e.target.value
                      )
                    }
                    rows="4"
                    placeholder="Ingrese una observación si corresponde."
                  />
                </div>

                {mensajeAtraso && (
                  <div className="inspectoria-alert success">
                    {mensajeAtraso}
                  </div>
                )}

                {errorAtraso && (
                  <div className="inspectoria-alert error">
                    {errorAtraso}
                  </div>
                )}

                <button
                  type="button"
                  className="btn-registrar-atraso"
                  onClick={
                    registrarAtrasoFormulario
                  }
                  disabled={
                    registrandoAtraso
                  }
                >
                  {registrandoAtraso
                    ? 'Registrando atraso...'
                    : 'Registrar atraso'}
                </button>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}