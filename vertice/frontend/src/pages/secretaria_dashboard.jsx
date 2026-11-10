import React, { useState, useEffect, useRef } from 'react';
import logoColegio from "../img/logo_Institucional.png";
import "./secretaria_dashboard.css";
import {
  fetchConAuth,
  fetchArchivoConAuth,
  API_URL
} from "../services/apiService.js";

const extraerLista = (respuesta, claves = []) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (!respuesta || typeof respuesta !== 'object') return [];
  for (const clave of claves) {
    if (Array.isArray(respuesta[clave])) return respuesta[clave];
  }
  if (respuesta.data && Array.isArray(respuesta.data)) return respuesta.data;
  if (respuesta.resultado && Array.isArray(respuesta.resultado)) return respuesta.resultado;
  return [];
};

function SecretariaDashboard() {
  const [tab, setTab] = useState('estudiantes');
  const [usuarioSecretaria, setUsuarioSecretaria] = useState('Lorena Morales');

  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [paseEncontrado, setPaseEncontrado] = useState(null);
  const [cargandoQR, setCargandoQR] = useState(false);
  const [errorQR, setErrorQR] = useState('');
  const [exitoQR, setExitoQR] = useState('');
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);
  const consultaQRActivaRef = useRef(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [mensajeCamara, setMensajeCamara] = useState('');

  const [cursoAtrasoId, setCursoAtrasoId] = useState('');
  const [alumnoAtrasoId, setAlumnoAtrasoId] = useState('');
  const [estudiantesAtrasoFiltrados, setEstudiantesAtrasoFiltrados] = useState([]);
  const [cargandoAlumnosAtraso, setCargandoAlumnosAtraso] = useState(false);
  const [fechaAtraso, setFechaAtraso] = useState(new Date().toISOString().split('T')[0]);
  const [horaLlegadaAtraso, setHoraLlegadaAtraso] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [motivoAtraso, setMotivoAtraso] = useState('');
  const [observacionAtraso, setObservacionAtraso] = useState('');
  const [guardandoAtraso, setGuardandoAtraso] = useState(false);

  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [cursoFiltroEstudiante, setCursoFiltroEstudiante] = useState('');
  const [listaRetiros, setListaRetiros] = useState([]);
  const [cargandoRetiros, setCargandoRetiros] = useState(false);
  const [fechaFiltroRetiro, setFechaFiltroRetiro] = useState('');
  const [cursoFiltroRetiro, setCursoFiltroRetiro] = useState('');
  const [busquedaRetiro, setBusquedaRetiro] = useState('');
  const [actualizandoJustificativo, setActualizandoJustificativo] = useState(null);
  const [pdfSeleccionado, setPdfSeleccionado] = useState(null);
  const [retiroInspector, setRetiroInspector] = useState(null);
  const [observacionConfirmacionRetiro, setObservacionConfirmacionRetiro] = useState('');
  const [confirmandoRetiro, setConfirmandoRetiro] = useState(false);
  const [retiroConfirmado, setRetiroConfirmado] = useState(false);
  const [listaEstudiantes, setListaEstudiantes] = useState([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

  const [listaJustificativos, setListaJustificativos] = useState([]);
  const [cargandoJustificativos, setCargandoJustificativos] = useState(false);
  const [errorJustificativos, setErrorJustificativos] = useState('');

  const [listaCursos, setListaCursos] = useState([]);
  const [pasoMatricula, setPasoMatricula] = useState(1);
  const [guardandoMatricula, setGuardandoMatricula] = useState(false);
  const [mensajeMatricula, setMensajeMatricula] = useState({ tipo: '', texto: '' });
  const [busquedaAlumnoMatricula, setBusquedaAlumnoMatricula] = useState('');
  const [mostrarDropdownAlumnos, setMostrarDropdownAlumnos] = useState(false);

  const [formMatricula, setFormMatricula] = useState({
    es_nuevo: false,
    alumno_id: '',
    nuevo_nombres: '',
    nuevo_apellido_paterno: '',
    nuevo_apellido_materno: '',
    nuevo_rut: '',
    curso_id: '',
    anio: 2027,
    ha_repetido: false,
    procedencia_escolar: 'CEOSJ',
    opta_religion: true,
    credo_religioso: 'CATÓLICA',
    pertenece_programa_social: false,
    pertenece_pueblo_indigena: false,
    se_atiende_centro_salud: true,
    nombre_centro_salud: '',
    observaciones_relevantes: '',
    porcentaje_registro_social: '0 AL 40%',
    vivienda: 'CASA PROPIA',
    numero_personas_hogar: 4,
    personas_trabajando_hogar: 1,
    ingreso_mensual_hogar: 500000,
    numero_habitaciones: 3,
    con_quien_vive: 'AMBOS PADRES',
    sistema_salud: 'FONASA',
    tiene_agua: true,
    tiene_electricidad: true,
    tiene_alcantarillado: true,
    autorizado_salir_solo: false,
    observaciones: ''
  });

  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario') || localStorage.getItem('usuarioActual');
    if (usuarioStr) {
      try {
        const u = JSON.parse(usuarioStr);
        setUsuarioSecretaria(u.nombre || u.nombres || 'Lorena Morales');
      } catch {
        setUsuarioSecretaria('Lorena Morales');
      }
    }
  }, []);

  useEffect(() => {
    if (tab === 'estudiantes') {
      obtenerEstudiantesBD();
      obtenerCursosBD();
    } else if (tab === 'justificativos') {
      obtenerJustificativosBD();
    } else if (tab === 'matricula') {
      obtenerEstudiantesBD();
      obtenerCursosBD();
    } else if (tab === 'qr') {
      obtenerCursosBD();
      obtenerRetirosBD();
    }
  }, [tab]);

  const obtenerEstudiantesBD = async () => {
    try {
      setCargandoEstudiantes(true);
      const res = await fetchConAuth('/api/secretaria/estudiantes');
      setListaEstudiantes(extraerLista(res, ['estudiantes', 'alumnos', 'data', 'resultado']));
    } catch (err) {
      console.error('Error al obtener estudiantes:', err);
      setListaEstudiantes([]);
    } finally {
      setCargandoEstudiantes(false);
    }
  };

  const obtenerCursosBD = async () => {
    try {
      const res = await fetchConAuth('/api/secretaria/cursos');
      setListaCursos(extraerLista(res, ['cursos', 'data', 'resultado']));
    } catch (err) {
      console.error('Error al obtener cursos:', err);
      setListaCursos([]);
    }
  };

  const obtenerRetirosBD = async () => {
    try {
      setCargandoRetiros(true);
      const res = await fetchConAuth('/api/secretaria/retiros-recientes');
      setListaRetiros(extraerLista(res, ['retiros', 'data', 'resultado']));
    } catch (err) {
      console.error('Error al obtener historial de retiros:', err);
      setListaRetiros([]);
      setErrorQR(err.message || 'No se pudo cargar el historial de retiros.');
    } finally {
      setCargandoRetiros(false);
    }
  };

  const cambiarEstadoJustificativo = async (item, estado) => {
    if (!item?.id) {
      alert('El justificativo no tiene un identificador válido.');
      return;
    }
    const estadoActual = String(item.estado || 'PENDIENTE').toUpperCase();
    if (estadoActual === 'APROBADO' || estadoActual === 'RECHAZADO') return;
    try {
      setActualizandoJustificativo(item.id);
      await fetchConAuth(`/api/secretaria/justificativos/${encodeURIComponent(item.id)}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado })
      });
      await obtenerJustificativosBD();
    } catch (err) {
      console.error('Error actualizando justificativo:', err);
      alert(err.message || 'No se pudo actualizar el justificativo.');
    } finally {
      setActualizandoJustificativo(null);
    }
  };

  const obtenerJustificativosBD = async () => {
    try {
      setCargandoJustificativos(true);
      setErrorJustificativos('');
      const res = await fetchConAuth('/api/secretaria/justificativos');
      setListaJustificativos(extraerLista(res, ['justificativos', 'solicitudes', 'data', 'resultado']));
    } catch (err) {
      console.error('Error al obtener justificativos:', err);
      setErrorJustificativos('No se pudieron cargar los justificativos.');
      setListaJustificativos([]);
    } finally {
      setCargandoJustificativos(false);
    }
  };

  const handleCursoAtrasoChange = async (e) => {
    const selectedCursoId = e.target.value;
    setCursoAtrasoId(selectedCursoId);
    setAlumnoAtrasoId('');
    setEstudiantesAtrasoFiltrados([]);

    if (!selectedCursoId) return;

    setCargandoAlumnosAtraso(true);
    try {
      const res = await fetchConAuth(`/api/secretaria/cursos/${encodeURIComponent(selectedCursoId)}/alumnos`);
      setEstudiantesAtrasoFiltrados(extraerLista(res, ['alumnos', 'estudiantes', 'data', 'resultado']));
    } catch (err) {
      console.error('Error al obtener alumnos del curso:', err);
      setEstudiantesAtrasoFiltrados([]);
    } finally {
      setCargandoAlumnosAtraso(false);
    }
  };

  const handleSubmitAtraso = async (e) => {
    e.preventDefault();
    if (!cursoAtrasoId || !alumnoAtrasoId) {
      alert('Por favor seleccione curso y estudiante.');
      return;
    }

    try {
      setGuardandoAtraso(true);
      const res = await fetchConAuth('/api/secretaria/atrasos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumno_id: alumnoAtrasoId,
          curso_id: cursoAtrasoId,
          fecha: fechaAtraso,
          hora_llegada: horaLlegadaAtraso,
          motivo: motivoAtraso || null,
          observacion: observacionAtraso || null
        })
      });

      if (res && (res.ok || res.id || res.message)) {
        alert('¡Atraso registrado exitosamente!');
        setAlumnoAtrasoId('');
        setMotivoAtraso('');
        setObservacionAtraso('');
      } else {
        throw new Error(res?.error || 'No se pudo guardar el atraso.');
      }
    } catch (err) {
      console.error("Error al registrar atraso:", err);
      alert(err.message || 'Error de conexión al registrar atraso.');
    } finally {
      setGuardandoAtraso(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const detenerCamaraQR = async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        if (typeof scanner.isScanning === 'function' ? scanner.isScanning() : true) {
          await scanner.stop();
        }
      } catch (error) {
        console.warn('No se pudo detener el escáner QR:', error);
      }
      try {
        await scanner.clear();
      } catch (error) {
        console.warn('No se pudo limpiar el escáner QR:', error);
      }
      scannerRef.current = null;
    }
    consultaQRActivaRef.current = false;
    setCamaraActiva(false);
  };

  const activarCamaraQR = async () => {
    setMensajeCamara('');
    setErrorQR('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setMensajeCamara('Este navegador no permite acceder a la cámara. Abra la aplicación mediante localhost o HTTPS.');
      return;
    }

    try {
      await detenerCamaraQR();
      const modulo = await import('html5-qrcode');
      const Html5Qrcode = modulo.Html5Qrcode;
      if (!Html5Qrcode) throw new Error('No se pudo cargar el lector QR.');

      if (!scannerContainerRef.current) {
        throw new Error('No se encontró el contenedor del lector QR.');
      }

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        async (decodedText) => {
          if (consultaQRActivaRef.current) return;
          consultaQRActivaRef.current = true;
          const codigo = String(decodedText || '').trim();
          if (!codigo) {
            consultaQRActivaRef.current = false;
            return;
          }
          setCodigoBusqueda(codigo);
          setMensajeCamara('Código detectado. Validando retiro...');
          await detenerCamaraQR();
          await handleConsultarQR(null, codigo);
        },
        () => { }
      );
      setCamaraActiva(true);
      setMensajeCamara('Cámara activa. Centre el código QR dentro del recuadro.');
    } catch (err) {
      console.error('Error activando cámara QR:', err);
      await detenerCamaraQR();
      setMensajeCamara(err?.name === 'NotAllowedError'
        ? 'Debe permitir el acceso a la cámara en el navegador para escanear el QR.'
        : (err?.message || 'No se pudo activar la cámara. Verifique que esté disponible y que la página use localhost o HTTPS.'));
    }
  };

  const handleConsultarQR = async (e, codigoLeido) => {
    e?.preventDefault();
    const codigo = String(codigoLeido ?? codigoBusqueda).trim();
    if (!codigo) {
      setErrorQR('Ingrese o escanee el código QR.');
      return;
    }

    try {
      setCargandoQR(true);
      setErrorQR('');
      setExitoQR('');
      setPaseEncontrado(null);

      const data = await fetchConAuth('/api/inspectoria/validar-qr', {
        method: 'POST',
        body: JSON.stringify({ codigoQR: codigo })
      });

      if (!data?.retiro || !data?.alumno) {
        throw new Error(data?.error || 'No se encontró una solicitud de retiro pendiente para este QR.');
      }
      setRetiroInspector(data);
      setRetiroConfirmado(false);
      setObservacionConfirmacionRetiro(data.retiro.observacion || '');
      setPaseEncontrado(null);
    } catch (err) {
      console.error('Error consultando QR:', err);
      setErrorQR(err.message || 'No se encontró un registro con ese ID.');
    } finally {
      setCargandoQR(false);
    }
  };

  const confirmarRetiroInspectoria = async () => {
    if (!retiroInspector?.retiro?.id || !retiroInspector?.alumno?.id || !retiroInspector?.alumno?.cursoId) {
      setErrorQR('Faltan datos de la solicitud para confirmar el retiro.');
      return;
    }
    try {
      setConfirmandoRetiro(true);
      setErrorQR('');
      await fetchConAuth('/api/inspectoria/confirmar-retiro', {
        method: 'POST',
        body: JSON.stringify({
          solicitudId: retiroInspector.retiro.id,
          alumnoId: retiroInspector.alumno.id,
          cursoId: retiroInspector.alumno.cursoId,
          motivo: retiroInspector.retiro.motivo,
          observacion: observacionConfirmacionRetiro
        })
      });
      setRetiroConfirmado(true);
      await obtenerRetirosBD();
    } catch (err) {
      setErrorQR(err.message || 'No se pudo confirmar el retiro.');
    } finally {
      setConfirmandoRetiro(false);
    }
  };

  const nuevoRetiroInspectoria = () => {
    setRetiroInspector(null);
    setRetiroConfirmado(false);
    setCodigoBusqueda('');
    setObservacionConfirmacionRetiro('');
    setErrorQR('');
    setExitoQR('');
  };

  useEffect(() => {
    if (tab !== 'qr') void detenerCamaraQR();
    return () => { void detenerCamaraQR(); };
  }, [tab]);

  const seleccionarAlumnoBuscador = (alumno) => {
    const nombreCompleto = alumno.nombre || `${alumno.nombres || ''} ${alumno.apellido_paterno || ''} ${alumno.apellido_materno || ''}`.trim();
    const rutTexto = alumno.rut || alumno.rut_alumno || '';

    setBusquedaAlumnoMatricula(`${nombreCompleto} (${rutTexto})`);
    setMostrarDropdownAlumnos(false);

    setFormMatricula((prev) => ({
      ...prev,
      alumno_id: alumno.id,
      sistema_salud: alumno.sistema_salud || prev.sistema_salud,
      nombre_centro_salud: alumno.nombre_centro_salud || prev.nombre_centro_salud,
      observaciones_relevantes: alumno.observaciones_relevantes || prev.observaciones_relevantes,
      vivienda: alumno.vivienda || prev.vivienda,
      porcentaje_registro_social: alumno.porcentaje_registro_social || prev.porcentaje_registro_social,
      con_quien_vive: alumno.con_quien_vive || prev.con_quien_vive,
      ingreso_mensual_hogar: alumno.ingreso_mensual_hogar || prev.ingreso_mensual_hogar,
      numero_personas_hogar: alumno.numero_personas_hogar || prev.numero_personas_hogar
    }));
  };

  const handleMatriculaChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'es_nuevo') {
      const esNuevoVal = value === 'true';
      setBusquedaAlumnoMatricula('');
      setMostrarDropdownAlumnos(false);

      setFormMatricula((prev) => ({
        ...prev,
        es_nuevo: esNuevoVal,
        alumno_id: esNuevoVal ? '' : prev.alumno_id
      }));
      return;
    }

    setFormMatricula((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGuardarMatricula = async (e) => {
    e.preventDefault();

    if (!formMatricula.curso_id) {
      setMensajeMatricula({ tipo: 'error', texto: 'Debes seleccionar un curso a matricular.' });
      return;
    }

    if (!formMatricula.es_nuevo && !formMatricula.alumno_id) {
      setMensajeMatricula({ tipo: 'error', texto: 'Debes seleccionar un estudiante de la lista.' });
      return;
    }

    if (formMatricula.es_nuevo && (!formMatricula.nuevo_nombres || !formMatricula.nuevo_apellido_paterno || !formMatricula.nuevo_rut)) {
      setMensajeMatricula({ tipo: 'error', texto: 'Debes completar los nombres, primer apellido y RUT del nuevo estudiante.' });
      return;
    }

    try {
      setGuardandoMatricula(true);
      setMensajeMatricula({ tipo: '', texto: '' });

      const res = await fetchConAuth('/api/secretaria/matriculas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formMatricula)
      });

      if (res && (res.ok || res.id || res.message)) {
        setMensajeMatricula({ tipo: 'exito', texto: '¡Matrícula registrada exitosamente en la Base de Datos!' });
        setPasoMatricula(1);
        setBusquedaAlumnoMatricula('');

        setFormMatricula({
          es_nuevo: false,
          alumno_id: '',
          nuevo_nombres: '',
          nuevo_apellido_paterno: '',
          nuevo_apellido_materno: '',
          nuevo_rut: '',
          curso_id: '',
          anio: 2027,
          ha_repetido: false,
          procedencia_escolar: 'CEOSJ',
          opta_religion: true,
          credo_religioso: 'CATÓLICA',
          pertenece_programa_social: false,
          pertenece_pueblo_indigena: false,
          se_atiende_centro_salud: true,
          nombre_centro_salud: '',
          observaciones_relevantes: '',
          porcentaje_registro_social: '0 AL 40%',
          vivienda: 'CASA PROPIA',
          numero_personas_hogar: 4,
          personas_trabajando_hogar: 1,
          ingreso_mensual_hogar: 500000,
          numero_habitaciones: 3,
          con_quien_vive: 'AMBOS PADRES',
          sistema_salud: 'FONASA',
          tiene_agua: true,
          tiene_electricidad: true,
          tiene_alcantarillado: true,
          autorizado_salir_solo: false,
          observaciones: ''
        });

        obtenerEstudiantesBD();
      } else {
        throw new Error(res?.error || 'No se pudo guardar la matrícula.');
      }
    } catch (err) {
      console.error("Error guardando matrícula:", err);
      setMensajeMatricula({ tipo: 'error', texto: err.message || 'Error al conectar con el servidor.' });
    } finally {
      setGuardandoMatricula(false);
    }
  };

  const limpiarTexto = (texto) => {
    if (!texto) return '';
    return texto.toString().toLowerCase().replace(/[\.\-\s]/g, '');
  };

  const terminoLimpio = limpiarTexto(busquedaEstudiante);

  const estudiantesFiltrados = listaEstudiantes.filter(item => {
    if (!terminoLimpio) return true;
    const rutAlumno = limpiarTexto(item.rut || item.rut_alumno || item.rut_estudiante);
    const rutApoderado = limpiarTexto(item.rutApoderado || item.rut_apoderado);
    const nombreAlumnoBD = item.nombre || `${item.nombres || ''} ${item.apellido_paterno || ''} ${item.apellido_materno || ''}`;
    const nombreAlumno = limpiarTexto(nombreAlumnoBD);
    const nombreApoderadoBD = item.apoderado || item.nombre_apoderado || item.nombre_completo;
    const nombreApoderado = limpiarTexto(nombreApoderadoBD);

    return (
      (rutAlumno.includes(terminoLimpio) ||
        rutApoderado.includes(terminoLimpio) ||
        nombreAlumno.includes(terminoLimpio) ||
        nombreApoderado.includes(terminoLimpio)) &&
      (!cursoFiltroEstudiante || String(item.curso || item.nombre_curso || '').trim() === cursoFiltroEstudiante)
    );
  });

  const toggleFicha = (item) => {
    if (estudianteSeleccionado?.id === item.id) {
      setEstudianteSeleccionado(null);
    } else {
      setEstudianteSeleccionado(item);
    }
  };

  return (
    <div className="sec-dashboard-bg">
      <div className="sec-dashboard-container">
        <header className="sec-header">
          <div className="sec-brand">
            {logoColegio && <img src={logoColegio} alt="Logo" className="sec-logo" />}
            <div>
              <h2>Colegio Orden de San Jorge</h2>
              <div className="sec-subtitle">Módulo de Secretaría</div>
            </div>
          </div>

          <div className="sec-user-info">
            <span>Secretario/a: <strong>{usuarioSecretaria}</strong></span>
            <button type="button" className="sec-btn-logout" onClick={cerrarSesion}>
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div className="sec-body">
          <aside className="sec-sidebar">
            <nav className="sec-nav">
              <button
                type="button"
                className={`sec-nav-btn ${tab === 'qr' ? 'active' : ''}`}
                onClick={() => {
                  setTab('qr');
                  setPaseEncontrado(null);
                  setErrorQR('');
                  setExitoQR('');
                }}
              >
                <span className="sec-icon">📙</span> Retiro por QR y Registro
              </button>
              <button
                type="button"
                className={`sec-nav-btn ${tab === 'matricula' ? 'active' : ''}`}
                onClick={() => setTab('matricula')}
              >
                <span className="sec-icon">📝</span> Proceso de Matrícula
              </button>
              <button
                type="button"
                className={`sec-nav-btn ${tab === 'estudiantes' ? 'active' : ''}`}
                onClick={() => setTab('estudiantes')}
              >
                <span className="sec-icon">🔍</span> Estudiantes y Apoderados
              </button>
              <button
                type="button"
                className={`sec-nav-btn ${tab === 'justificativos' ? 'active' : ''}`}
                onClick={() => setTab('justificativos')}
              >
                <span className="sec-icon">📑</span> Revisar Justificativos
              </button>
            </nav>
          </aside>

          <main className="sec-content">
            {tab === 'qr' && (
              <div className="sec-qr-container">
                <div className="sec-card-header-burgundy">
                  <div className="sec-card-topbar">
                    <div>
                      <h3>Historial de retiros</h3>
                      <p>Filtre por fecha y luego busque por estudiante o curso. No necesita consultar el identificador QR.</p>
                    </div>
                    <span className="sec-badge-tag">Historial</span>
                  </div>
                  <div className="sec-card-body">
                    <div className="sec-filter-row">
                      <div className="sec-form-group">
                        <label>Fecha del retiro</label>
                        <input className="sec-input-full" type="date" value={fechaFiltroRetiro} onChange={(e) => setFechaFiltroRetiro(e.target.value)} />
                      </div>
                      <div className="sec-form-group">
                        <label>Curso</label>
                        <select className="sec-input-full" value={cursoFiltroRetiro} onChange={(e) => setCursoFiltroRetiro(e.target.value)}>
                          <option value="">Todos los cursos</option>
                          {listaCursos.map((curso) => <option key={curso.id} value={curso.nombre}>{curso.nombre}</option>)}
                        </select>
                      </div>
                      <div className="sec-form-group">
                        <label>Estudiante</label>
                        <input className="sec-input-full" type="search" placeholder="Nombre o RUT" value={busquedaRetiro} onChange={(e) => setBusquedaRetiro(e.target.value)} />
                      </div>
                    </div>
                    {cargandoRetiros ? <p>Cargando historial de retiros...</p> : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="sec-table">
                          <thead><tr><th>Fecha</th><th>Estudiante</th><th>Curso</th><th>Motivo</th><th>Observación</th></tr></thead>
                          <tbody>
                            {listaRetiros.filter((r) => {
                              const fecha = String(r.fecha_retiro_iso || r.fecha_retiro || '').slice(0, 10);
                              const nombre = `${r.alumno_nombre || r.alumno_nombres || ''} ${r.alumno_paterno || ''}`.toLowerCase();
                              const rut = String(r.alumno_rut || '').toLowerCase();
                              const curso = String(r.curso_nombre || r.curso || '');
                              const termino = busquedaRetiro.trim().toLowerCase();
                              return (!fechaFiltroRetiro || fecha === fechaFiltroRetiro) &&
                                (!cursoFiltroRetiro || curso === cursoFiltroRetiro) &&
                                (!termino || nombre.includes(termino) || rut.includes(termino));
                            }).map((r) => (
                              <tr key={r.id}>
                                <td>{r.fecha_retiro_iso || r.fecha_retiro || '-'}</td>
                                <td>{r.alumno_nombre || `${r.alumno_nombres || ''} ${r.alumno_paterno || ''}`.trim() || '-'}</td>
                                <td>{r.curso_nombre || r.curso || '-'}</td>
                                <td>{r.motivo || '-'}</td>
                                <td>{r.observacion || '-'}</td>
                              </tr>
                            ))}
                            {!listaRetiros.some((r) => {
                              const fecha = String(r.fecha_retiro_iso || r.fecha_retiro || '').slice(0, 10);
                              const nombre = `${r.alumno_nombre || r.alumno_nombres || ''} ${r.alumno_paterno || ''}`.toLowerCase();
                              const rut = String(r.alumno_rut || '').toLowerCase();
                              const curso = String(r.curso_nombre || r.curso || '');
                              const termino = busquedaRetiro.trim().toLowerCase();
                              return (!fechaFiltroRetiro || fecha === fechaFiltroRetiro) && (!cursoFiltroRetiro || curso === cursoFiltroRetiro) && (!termino || nombre.includes(termino) || rut.includes(termino));
                            }) && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 18 }}>No hay retiros que coincidan con los filtros.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sec-card-header-burgundy">
                  <div className="sec-card-topbar">
                    <div>
                      <h3>Validar retiro mediante QR</h3>
                      <p>Escanee el código presentado por el apoderado o ingrese el código manualmente.</p>
                    </div>
                    <span className="sec-badge-tag">QR seguro</span>
                  </div>

                  <div className="sec-card-body" style={{ textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>Escáner QR</h4>
                    <p style={{ margin: '0 0 16px 0', color: '#777', fontSize: '0.85rem' }}>El código debe estar vigente.</p>

                    <div
                      id="qr-reader"
                      ref={scannerContainerRef}
                      className={camaraActiva ? 'sec-qr-reader activo' : 'sec-qr-reader'}
                      aria-label="Lector de código QR"
                    />
                    {!camaraActiva && (
                      <p className="sec-qr-camera-message" role="status">
                        {mensajeCamara || 'La cámara está apagada.'}
                      </p>
                    )}

                    <button
                      type="button"
                      className="sec-btn-outline"
                      onClick={camaraActiva ? detenerCamaraQR : activarCamaraQR}
                      disabled={cargandoQR}
                      style={{ backgroundColor: '#800020', color: '#fff', border: 'none', padding: '10px 24px', fontWeight: 'bold', marginBottom: '16px', cursor: 'pointer' }}
                    >
                      {camaraActiva ? 'Apagar cámara' : 'Activar cámara'}
                    </button>

                    {mensajeCamara && (
                      <p role="status" style={{ color: '#555', margin: '0 0 12px' }}>
                        {mensajeCamara}
                      </p>
                    )}

                    <div className="sec-divider-or">
                      <span>O INGRESE EL CÓDIGO</span>
                    </div>

                    <form onSubmit={handleConsultarQR} className="sec-form-group">
                      <label>Código QR</label>
                      <input
                        type="text"
                        className="sec-input-full"
                        placeholder="Ingrese el código UUID del QR"
                        value={codigoBusqueda}
                        onChange={(e) => setCodigoBusqueda(e.target.value)}
                        style={{ marginBottom: '15px' }}
                      />
                      <button
                        type="submit"
                        disabled={cargandoQR}
                        className="sec-btn-burgundy-full"
                      >
                        {cargandoQR ? 'Validando...' : 'Validar código'}
                      </button>
                    </form>

                    {errorQR && <div className="sec-ficha-modal sec-alert-error" role="alert">{errorQR}</div>}

                    {retiroInspector && (
                      <div className="sec-ficha-modal" style={{ textAlign: 'left' }}>
                        {retiroConfirmado ? (
                          <>
                            <h3 style={{ color: '#155724' }}>Retiro registrado correctamente</h3>
                            <p>La solicitud fue confirmada y el código QR quedó inutilizado.</p>
                            <button type="button" className="sec-btn-burgundy-full" onClick={nuevoRetiroInspectoria}>Validar otro retiro</button>
                          </>
                        ) : (
                          <>
                            <h3 style={{ color: '#800020', marginTop: 0 }}>Verificación del retiro</h3>
                            <p><strong>Estudiante:</strong> {retiroInspector.alumno.nombre || '-'}</p>
                            <p><strong>RUT:</strong> {retiroInspector.alumno.rut || '-'}</p>
                            <p><strong>Curso:</strong> {retiroInspector.alumno.curso || '-'}</p>
                            <p><strong>Persona autorizada:</strong> {retiroInspector.personaAutorizada?.nombre || '-'}</p>
                            <p><strong>RUT persona autorizada:</strong> {retiroInspector.personaAutorizada?.rut || '-'}</p>
                            <p><strong>Motivo:</strong> {retiroInspector.retiro.motivo || '-'}</p>
                            <div className="sec-form-group">
                              <label>Observación de retiro</label>
                              <textarea
                                className="sec-input-full"
                                rows="3"
                                value={observacionConfirmacionRetiro}
                                onChange={(e) => setObservacionConfirmacionRetiro(e.target.value)}
                                placeholder="Ingrese alguna observación adicional"
                              />
                            </div>
                            <button
                              type="button"
                              className="sec-btn-burgundy-full"
                              onClick={confirmarRetiroInspectoria}
                              disabled={confirmandoRetiro}
                            >
                              {confirmandoRetiro ? 'Confirmando...' : 'Confirmar Retiro'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === 'matricula' && (
              <div className="sec-qr-container">
                <div className="sec-card-header-burgundy">
                  <div className="sec-card-topbar">
                    <div>
                      <h3>Proceso de Matrícula</h3>
                      <p>Registre una nueva matrícula o actualice la ficha del estudiante.</p>
                    </div>
                    <span className="sec-badge-tag">Matrícula</span>
                  </div>
                  <div className="sec-card-body">
                    <form onSubmit={handleGuardarMatricula}>
                      <div className="sec-form-group">
                        <label>Tipo de alumno</label>
                        <select className="sec-input-full" name="es_nuevo" value={formMatricula.es_nuevo} onChange={handleMatriculaChange}>
                          <option value="false">Estudiante existente / Antiguo</option>
                          <option value="true">Estudiante Nuevo</option>
                        </select>
                      </div>

                      {!formMatricula.es_nuevo ? (
                        <div className="sec-form-group">
                          <label>Buscar estudiante</label>
                          <input
                            type="text"
                            className="sec-input-full"
                            placeholder="Escriba nombre o RUT del alumno..."
                            value={busquedaAlumnoMatricula}
                            onChange={(e) => {
                              setBusquedaAlumnoMatricula(e.target.value);
                              setMostrarDropdownAlumnos(true);
                            }}
                            onFocus={() => setMostrarDropdownAlumnos(true)}
                          />
                          {mostrarDropdownAlumnos && (
                            <div className="sec-dropdown-list">
                              {listaEstudiantes
                                .filter(a => {
                                  const text = `${a.nombres || ''} ${a.apellido_paterno || ''} ${a.rut || ''}`.toLowerCase();
                                  return text.includes(busquedaAlumnoMatricula.toLowerCase());
                                })
                                .slice(0, 5)
                                .map(a => (
                                  <div key={a.id} className="sec-dropdown-item" onClick={() => seleccioarAlumnoBuscador(a)}>
                                    {a.nombres} {a.apellido_paterno} - RUT: {a.rut}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="sec-filter-row">
                          <div className="sec-form-group">
                            <label>Nombres</label>
                            <input className="sec-input-full" type="text" name="nuevo_nombres" value={formMatricula.nuevo_nombres} onChange={handleMatriculaChange} />
                          </div>
                          <div className="sec-form-group">
                            <label>Apellido Paterno</label>
                            <input className="sec-input-full" type="text" name="nuevo_apellido_paterno" value={formMatricula.nuevo_apellido_paterno} onChange={handleMatriculaChange} />
                          </div>
                          <div className="sec-form-group">
                            <label>Apellido Materno</label>
                            <input className="sec-input-full" type="text" name="nuevo_apellido_materno" value={formMatricula.nuevo_apellido_materno} onChange={handleMatriculaChange} />
                          </div>
                          <div className="sec-form-group">
                            <label>RUT</label>
                            <input className="sec-input-full" type="text" name="nuevo_rut" value={formMatricula.nuevo_rut} onChange={handleMatriculaChange} placeholder="12345678-9" />
                          </div>
                        </div>
                      )}

                      <div className="sec-form-group">
                        <label>Seleccionar Curso</label>
                        <select className="sec-input-full" name="curso_id" value={formMatricula.curso_id} onChange={handleMatriculaChange}>
                          <option value="">Seleccione curso...</option>
                          {listaCursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                      </div>

                      {mensajeMatricula.texto && (
                        <div className={`sec-ficha-modal ${mensajeMatricula.tipo === 'error' ? 'sec-alert-error' : ''}`} style={{ backgroundColor: mensajeMatricula.tipo === 'exito' ? '#d4edda' : undefined, color: mensajeMatricula.tipo === 'exito' ? '#155724' : undefined }}>
                          {mensajeMatricula.texto}
                        </div>
                      )}

                      <button type="submit" disabled={guardandoMatricula} className="sec-btn-burgundy-full" style={{ marginTop: '20px' }}>
                        {guardandoMatricula ? 'Guardando matrícula...' : 'Registrar Matrícula'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {tab === 'estudiantes' && (
              <div className="sec-qr-container">
                <div className="sec-card-header-burgundy">
                  <div className="sec-card-topbar">
                    <div>
                      <h3>Listado General de Estudiantes</h3>
                      <p>Busque y gestione la información de los estudiantes y sus apoderados.</p>
                    </div>
                    <span className="sec-badge-tag">Estudiantes</span>
                  </div>
                  <div className="sec-card-body">
                    <div className="sec-filter-row">
                      <div className="sec-form-group">
                        <label>Buscar alumno o apoderado</label>
                        <input className="sec-input-full" type="search" placeholder="Nombre o RUT" value={busquedaEstudiante} onChange={(e) => setBusquedaEstudiante(e.target.value)} />
                      </div>
                      <div className="sec-form-group">
                        <label>Filtrar por Curso</label>
                        <select className="sec-input-full" value={cursoFiltroEstudiante} onChange={(e) => setCursoFiltroEstudiante(e.target.value)}>
                          <option value="">Todos los cursos</option>
                          {listaCursos.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                        </select>
                      </div>
                    </div>

                    {cargandoEstudiantes ? <p>Cargando estudiantes...</p> : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="sec-table">
                          <thead><tr><th>Estudiante</th><th>RUT</th><th>Curso</th><th>Apoderado</th><th>Acciones</th></tr></thead>
                          <tbody>
                            {estudiantesFiltrados.map(item => (
                              <tr key={item.id}>
                                <td>{item.nombre || `${item.nombres || ''} ${item.apellido_paterno || ''}`.trim()}</td>
                                <td>{item.rut || item.rut_alumno || '-'}</td>
                                <td>{item.curso || item.nombre_curso || '-'}</td>
                                <td>{item.apoderado || item.nombre_apoderado || '-'}</td>
                                <td>
                                  <button type="button" className="sec-btn-outline" onClick={() => toggleFicha(item)}>
                                    {estudianteSeleccionado?.id === item.id ? 'Ocultar ficha' : 'Ver ficha'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {estudiantesFiltrados.length === 0 && (
                              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>No se encontraron estudiantes.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {estudianteSeleccionado && (
                      <div className="sec-ficha-modal" style={{ marginTop: '20px' }}>
                        <h4>Ficha de Estudiante: {estudianteSeleccionado.nombre || estudianteSeleccionado.nombres}</h4>
                        <p><strong>RUT:</strong> {estudianteSeleccionado.rut}</p>
                        <p><strong>Curso:</strong> {estudianteSeleccionado.curso || estudianteSeleccionado.nombre_curso}</p>
                        <p><strong>Sistema de Salud:</strong> {estudianteSeleccionado.sistema_salud || 'No especificado'}</p>
                        <p><strong>Centro de Salud:</strong> {estudianteSeleccionado.nombre_centro_salud || 'No especificado'}</p>
                        <p><strong>Observaciones:</strong> {estudianteSeleccionado.observaciones_relevantes || 'Sin observaciones'}</p>
                        <button type="button" className="sec-btn-burgundy-full" onClick={() => setEstudianteSeleccionado(null)} style={{ marginTop: '10px' }}>Cerrar ficha</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === 'justificativos' && (
              <div className="sec-qr-container">
                <div className="sec-card-header-burgundy">
                  <div className="sec-card-topbar">
                    <div>
                      <h3>Revisión de Justificativos Médicos / Inasistencias</h3>
                      <p>Apruebe o rechace los justificativos enviados por los apoderados.</p>
                    </div>
                    <span className="sec-badge-tag">Justificativos</span>
                  </div>
                  <div className="sec-card-body">
                    {cargandoJustificativos ? <p>Cargando justificativos...</p> : errorJustificativos ? <p style={{ color: 'red' }}>{errorJustificativos}</p> : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="sec-table">
                          <thead><tr><th>Estudiante</th><th>Fechas</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead>
                          <tbody>
                            {listaJustificativos.map(item => (
                              <tr key={item.id}>
                                <td>{item.alumno_nombre || item.nombre_alumno || '-'}</td>
                                <td>{item.fecha_inicio} al {item.fecha_fin || item.fecha_inicio}</td>
                                <td>{item.motivo}</td>
                                <td><strong>{item.estado || 'PENDIENTE'}</strong></td>
                                <td>
                                  {(!item.estado || item.estado === 'PENDIENTE') ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button type="button" className="sec-btn-outline" onClick={() => cambiarEstadoJustificativo(item, 'APROBADO')} disabled={actualizandoJustificativo === item.id}>Aprobar</button>
                                      <button type="button" className="sec-btn-outline" style={{ borderColor: '#800020', color: '#800020' }} onClick={() => cambiarEstadoJustificativo(item, 'RECHAZADO')} disabled={actualizandoJustificativo === item.id}>Rechazar</button>
                                    </div>
                                  ) : (
                                    <span>Gestionado</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {listaJustificativos.length === 0 && (
                              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>No hay justificativos pendientes.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default SecretariaDashboard;