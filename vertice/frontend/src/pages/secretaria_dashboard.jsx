import React, { useState, useEffect, useRef } from 'react';
import logoColegio from "../img/logo_institucional.png";
import "./secretaria_dashboard.css";
import { fetchConAuth } from "../services/apiService.js";


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
    } else if (tab === 'justificativos') {
      obtenerJustificativosBD();
    } else if (tab === 'matricula') {
      obtenerEstudiantesBD();
      obtenerCursosBD();
    } else if (tab === 'qr') {
      obtenerCursosBD();
    }
  }, [tab]);


  const obtenerEstudiantesBD = async () => {
    try {
      setCargandoEstudiantes(true);
      const res = await fetchConAuth('/secretaria/estudiantes');
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
      const res = await fetchConAuth('/secretaria/cursos');
      setListaCursos(extraerLista(res, ['cursos', 'data', 'resultado']));
    } catch (err) {
      console.error('Error al obtener cursos:', err);
      setListaCursos([]);
    }
  };

  const obtenerJustificativosBD = async () => {
    try {
      setCargandoJustificativos(true);
      setErrorJustificativos('');
      const res = await fetchConAuth('/secretaria/justificativos');
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
      const res = await fetchConAuth(`/secretaria/cursos/${encodeURIComponent(selectedCursoId)}/alumnos`);
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
      const res = await fetchConAuth('/secretaria/atrasos', {
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
          setMensajeCamara('Código detectado. Consultando el retiro...');
          await detenerCamaraQR();
          await handleConsultarQR(null, codigo);
        },
        () => {}
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

      const data = await fetchConAuth(`/secretaria/validar-qr/${encodeURIComponent(codigo)}`);

      if (!data || data.error) {
        throw new Error(data?.error || 'No se encontró información para el código especificado.');
      }
      setPaseEncontrado(data);
    } catch (err) {
      console.error('Error consultando QR:', err);
      setErrorQR(err.message || 'No se encontró un registro con ese ID.');
    } finally {
      setCargandoQR(false);
    }
  };

  useEffect(() => {
    if (tab !== 'qr') void detenerCamaraQR();
    return () => { void detenerCamaraQR(); };
  }, [tab]);


  const seleccioarAlumnoBuscador = (alumno) => {
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


      const res = await fetchConAuth('/secretaria/matriculas', {
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
      rutAlumno.includes(terminoLimpio) ||
      rutApoderado.includes(terminoLimpio) ||
      nombreAlumno.includes(terminoLimpio) ||
      nombreApoderado.includes(terminoLimpio)
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
                      <h3>Consulta Histórica de Pase / Registro</h3>
                      <p>Revise o corrobore el estado de un retiro registrado previamente ingresando el ID del pase.</p>
                    </div>
                    <span className="sec-badge-tag">Historial / Auditoría</span>
                  </div>


                  <div className="sec-card-body">
                    <form onSubmit={handleConsultarQR} style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="sec-input-full"
                        placeholder="Ingrese o pegue el ID del pase (ej: 0adbce04-...)"
                        value={codigoBusqueda}
                        onChange={(e) => setCodigoBusqueda(e.target.value)}
                        style={{ flex: 1 }}
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={cargandoQR}
                        className="sec-btn-outline"
                        style={{ backgroundColor: '#800020', color: '#fff', border: 'none', padding: '0 22px', fontWeight: 'bold' }}
                      >
                        {cargandoQR ? 'Consultando...' : 'Consultar'}
                      </button>
                    </form>


                    {errorQR && <p style={{ color: '#d9534f', fontWeight: 'bold', marginTop: '12px' }}>{errorQR}</p>}
                    {exitoQR && (
                      <div className="sec-ficha-modal" style={{ backgroundColor: '#eef9f6', borderColor: '#c3e6cb', color: '#155724' }}>
                        <strong>¡Éxito!</strong> {exitoQR}
                      </div>
                    )}


                    {paseEncontrado && (
                      <div className="sec-ficha-modal" style={{ marginTop: '16px', borderLeft: '4px solid #800020', background: '#fff' }}>
                        <div className="sec-ficha-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '10px 15px', borderBottom: '1px solid #dee2e6' }}>
                          <h4 style={{ margin: 0, color: '#800020' }}>Detalle del Pase de Retiro</h4>
                          <span style={{ fontSize: '12px', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', color: '#991b1b', fontWeight: 'bold' }}>
                            ID: {paseEncontrado.id}
                          </span>
                        </div>


                        <div className="sec-ficha-grid" style={{ marginTop: '15px', padding: '0 15px' }}>
                          <div>
                            <p><strong>Estudiante:</strong> {paseEncontrado.alumno_nombre}</p>
                            <p><strong>RUT Estudiante:</strong> {paseEncontrado.alumno_rut}</p>
                            <p><strong>Curso:</strong> {paseEncontrado.curso}</p>
                            <p><strong>Fecha Programada:</strong> {paseEncontrado.fecha_retiro}</p>
                          </div>
                          <div>
                            <p>
                              <strong>Retirado por:</strong>{' '}
                              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                {paseEncontrado.retira_persona}
                              </span>
                            </p>
                            <p><strong>RUT que Retira:</strong> {paseEncontrado.retira_rut}</p>
                            <p><strong>Autorizado por:</strong> {paseEncontrado.autorizado_por || 'Inspectoría General'}</p>
                            <p><strong>Motivo:</strong> {paseEncontrado.motivo}</p>
                          </div>
                        </div>


                        {paseEncontrado.observacion && (
                          <div style={{ padding: '0 15px' }}>
                            <p style={{ background: '#fef2f2', padding: '10px', borderRadius: '4px', border: '1px solid #fecaca', marginTop: '10px', color: '#7f1d1d' }}>
                              <strong>Observación:</strong> {paseEncontrado.observacion}
                            </p>
                          </div>
                        )}


                        <div style={{ padding: '15px' }}>
                          <button
                            type="button"
                            className="sec-btn-outline"
                            style={{
                              backgroundColor: '#800020',
                              color: '#fff',
                              borderColor: '#800020',
                              marginTop: '15px',
                              cursor: 'pointer',
                              padding: '8px 16px',
                              borderRadius: '4px',
                              fontWeight: 'bold'
                            }}
                            onClick={() => {
                              setExitoQR(
                                `Consulta finalizada: Se corroboró la información de retiro del alumno/a ${paseEncontrado.alumno_nombre} realizada por ${paseEncontrado.retira_persona}.`
                              );
                              setPaseEncontrado(null);
                              setCodigoBusqueda('');
                            }}
                          >
                            Entendido / Cerrar Consulta
                          </button>
                        </div>
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

                    <div className="sec-scanner-box" style={{ minHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#111', borderRadius: '10px', marginBottom: '12px', padding: '8px' }}>
                      <div
                        id="qr-reader"
                        ref={scannerContainerRef}
                        style={{ width: '100%', maxWidth: '480px', minHeight: '220px', color: '#fff' }}
                      />
                      {!camaraActiva && (
                        <span style={{ color: '#fff', padding: '12px', textAlign: 'center' }}>
                          {mensajeCamara || 'La cámara está apagada.'}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="sec-btn-outline"
                      onClick={camaraActiva ? detenerCamaraQR : activarCamaraQR}
                      disabled={cargandoQR}
                      style={{ backgroundColor: '#800020', color: '#fff', border: 'none', padding: '10px 24px', fontWeight: 'bold', marginBottom: '16px' }}
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
                  </div>
                </div>

                <div className="sec-card-header-burgundy">
                  <div className="sec-card-topbar">
                    <div>
                      <h3>Registrar atraso</h3>
                      <p>Seleccione el curso y luego el alumno que llegó atrasado.</p>
                    </div>
                    <span className="sec-badge-tag">Secretaría</span>
                  </div>


                  <form onSubmit={handleSubmitAtraso} className="sec-card-body">
                    <div className="sec-form-group">
                      <label>Curso</label>
                      <select
                        className="sec-input-full"
                        value={cursoAtrasoId}
                        onChange={handleCursoAtrasoChange}
                        required
                      >
                        <option value="">Seleccione un curso</option>
                        {listaCursos.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nombre || c.nombre_curso}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sec-form-group">
                      <label>Alumno</label>
                      <select
                        className="sec-input-full"
                        value={alumnoAtrasoId}
                        onChange={(e) => setAlumnoAtrasoId(e.target.value)}
                        disabled={!cursoAtrasoId || cargandoAlumnosAtraso}
                        required
                      >
                        <option value="">
                          {!cursoAtrasoId
                            ? 'Primero seleccione un curso'
                            : cargandoAlumnosAtraso
                              ? 'Cargando alumnos del curso...'
                              : 'Seleccione alumno'}
                        </option>
                        {estudiantesAtrasoFiltrados.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.apellido_paterno || ''} {a.apellido_materno || ''}, {a.nombres || a.nombre || ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="sec-form-group">
                        <label>Fecha</label>
                        <input
                          type="date"
                          className="sec-input-full"
                          value={fechaAtraso}
                          onChange={(e) => setFechaAtraso(e.target.value)}
                          required
                        />
                      </div>
                      <div className="sec-form-group">
                        <label>Hora de llegada</label>
                        <input
                          type="time"
                          className="sec-input-full"
                          value={horaLlegadaAtraso}
                          onChange={(e) => setHoraLlegadaAtraso(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="sec-form-group">
                      <label>Motivo</label>
                      <input
                        type="text"
                        className="sec-input-full"
                        placeholder="Ej.: Problemas de locomoción"
                        value={motivoAtraso}
                        onChange={(e) => setMotivoAtraso(e.target.value)}
                      />
                    </div>

                    <div className="sec-form-group" style={{ marginBottom: '24px' }}>
                      <label>Observación</label>
                      <textarea
                        className="sec-input-full"
                        rows="3"
                        placeholder="Ingrese una observación si corresponde."
                        style={{ resize: 'vertical' }}
                        value={observacionAtraso}
                        onChange={(e) => setObservacionAtraso(e.target.value)}
                      />
                    </div>


                    <button
                      type="submit"
                      className="sec-btn-burgundy-full"
                      disabled={guardandoAtraso || !alumnoAtrasoId}
                    >
                      {guardandoAtraso ? 'Guardando...' : 'Registrar atraso'}
                    </button>
                  </form>
                </div>


              </div>
            )}

            {tab === 'matricula' && (
              <div className="sec-card">
                <h3 className="sec-title">Proceso de Matrícula 2027</h3>
                <div className="sec-divider"></div>



                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setPasoMatricula(1)}
                    style={{
                      padding: '8px 16px',
                      background: pasoMatricula === 1 ? '#800020' : '#e0e0e0',
                      color: pasoMatricula === 1 ? '#fff' : '#333',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    1. Académico y Formación
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasoMatricula(2)}
                    style={{
                      padding: '8px 16px',
                      background: pasoMatricula === 2 ? '#800020' : '#e0e0e0',
                      color: pasoMatricula === 2 ? '#fff' : '#333',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    2. Ficha Médica y Salud
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasoMatricula(3)}
                    style={{
                      padding: '8px 16px',
                      background: pasoMatricula === 3 ? '#800020' : '#e0e0e0',
                      color: pasoMatricula === 3 ? '#fff' : '#333',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    3. Contexto Socioeconómico
                  </button>
                </div>


                {mensajeMatricula.texto && (
                  <div
                    style={{
                      padding: '12px',
                      marginBottom: '15px',
                      borderRadius: '4px',
                      backgroundColor: mensajeMatricula.tipo === 'exito' ? '#d4edda' : '#f8d7da',
                      color: mensajeMatricula.tipo === 'exito' ? '#155724' : '#721c24',
                      fontWeight: 'bold'
                    }}
                  >
                    {mensajeMatricula.texto}
                  </div>
                )}


                <form onSubmit={handleGuardarMatricula}>
                  {pasoMatricula === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                      <div style={{ display: 'flex', gap: '20px', background: '#f8f9fa', padding: '12px 16px', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                        <label style={{ fontWeight: 'bold', cursor: 'pointer', color: !formMatricula.es_nuevo ? '#800020' : '#495057' }}>
                          <input
                            type="radio"
                            name="es_nuevo"
                            value="false"
                            checked={!formMatricula.es_nuevo}
                            onChange={handleMatriculaChange}
                            style={{ marginRight: '8px' }}
                          />
                          Alumno Antiguo / Regular (Carga datos de BD)
                        </label>
                        <label style={{ fontWeight: 'bold', cursor: 'pointer', color: formMatricula.es_nuevo ? '#800020' : '#495057' }}>
                          <input
                            type="radio"
                            name="es_nuevo"
                            value="true"
                            checked={formMatricula.es_nuevo}
                            onChange={handleMatriculaChange}
                            style={{ marginRight: '8px' }}
                          />
                          Alumno Nuevo (Ingreso Proceso 2027)
                        </label>
                      </div>

                      {!formMatricula.es_nuevo ? (
                        <div style={{ position: 'relative', marginBottom: '15px' }}>
                          <label><strong>Buscar / Seleccionar Estudiante *:</strong></label>
                          <input
                            type="text"
                            placeholder="Escribe para buscar por nombre, apellido o RUT (ej: A, Juan, Pérez...)"
                            value={busquedaAlumnoMatricula}
                            onChange={(e) => {
                              setBusquedaAlumnoMatricula(e.target.value);
                              setMostrarDropdownAlumnos(true);
                            }}
                            onFocus={() => setMostrarDropdownAlumnos(true)}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />


                          {mostrarDropdownAlumnos && busquedaAlumnoMatricula.trim() !== '' && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                maxHeight: '220px',
                                overflowY: 'auto',
                                backgroundColor: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: '0 0 6px 6px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                zIndex: 1000
                              }}
                            >
                              {listaEstudiantes.filter(al => {
                                const termino = busquedaAlumnoMatricula.toLowerCase();
                                const nombreCompleto = `${al.nombres || al.nombre || ''} ${al.apellido_paterno || ''} ${al.apellido_materno || ''}`.toLowerCase();
                                const rut = (al.rut || al.rut_alumno || '').toLowerCase();
                                return nombreCompleto.includes(termino) || rut.includes(termino);
                              }).length > 0 ? (
                                listaEstudiantes
                                  .filter(al => {
                                    const termino = busquedaAlumnoMatricula.toLowerCase();
                                    const nombreCompleto = `${al.nombres || al.nombre || ''} ${al.apellido_paterno || ''} ${al.apellido_materno || ''}`.toLowerCase();
                                    const rut = (al.rut || al.rut_alumno || '').toLowerCase();
                                    return nombreCompleto.includes(termino) || rut.includes(termino);
                                  })
                                  .map((al) => (
                                    <div
                                      key={al.id}
                                      style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #eee',
                                        backgroundColor: '#fff',
                                        transition: 'background-color 0.2s'
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        seleccioarAlumnoBuscador(al);
                                      }}
                                      onClick={() => seleccioarAlumnoBuscador(al)}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                    >
                                      <strong style={{ color: '#333' }}>
                                        {al.nombre || `${al.nombres || ''} ${al.apellido_paterno || ''} ${al.apellido_materno || ''}`}
                                      </strong>
                                      <span style={{ color: '#6c757d', fontSize: '0.85em', marginLeft: '8px' }}>
                                        ({al.rut || al.rut_alumno || ''})
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <div style={{ padding: '10px 12px', color: '#6c757d', fontStyle: 'italic' }}>
                                  No se encontraron alumnos con esa búsqueda.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#fffef5', padding: '15px', borderRadius: '4px', border: '1px solid #ffeeba', marginBottom: '15px' }}>
                          <div>
                            <label><strong>Nombres del Estudiante *:</strong></label>
                            <input
                              type="text"
                              name="nuevo_nombres"
                              placeholder="Ej: Mateo Andrés"
                              value={formMatricula.nuevo_nombres}
                              onChange={handleMatriculaChange}
                              required={formMatricula.es_nuevo}
                              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                          </div>
                          <div>
                            <label><strong>Apellido Paterno *:</strong></label>
                            <input
                              type="text"
                              name="nuevo_apellido_paterno"
                              placeholder="Ej: Silva"
                              value={formMatricula.nuevo_apellido_paterno}
                              onChange={handleMatriculaChange}
                              required={formMatricula.es_nuevo}
                              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                          </div>
                          <div>
                            <label><strong>Apellido Materno:</strong></label>
                            <input
                              type="text"
                              name="nuevo_apellido_materno"
                              placeholder="Ej: Morales"
                              value={formMatricula.nuevo_apellido_materno}
                              onChange={handleMatriculaChange}
                              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                          </div>
                          <div>
                            <label><strong>RUT del Estudiante *:</strong></label>
                            <input
                              type="text"
                              name="nuevo_rut"
                              placeholder="Ej: 22123456-7"
                              value={formMatricula.nuevo_rut}
                              onChange={handleMatriculaChange}
                              required={formMatricula.es_nuevo}
                              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                          </div>
                        </div>
                      )}


                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                          <label><strong>Curso a Matricular *:</strong></label>
                          <select
                            name="curso_id"
                            value={formMatricula.curso_id}
                            onChange={handleMatriculaChange}
                            required
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                          >
                            <option value="">-- Seleccionar Curso --</option>
                            {listaCursos.length > 0 ? (
                              listaCursos.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))
                            ) : (
                              <>
                                <option value="11000000-0000-0000-0000-000000000000">1° Medio A</option>
                                <option value="31000000-0000-0000-0000-000000000000">2° Medio A</option>
                                <option value="41000000-0000-0000-0000-000000000000">3° Medio A</option>
                              </>
                            )}
                          </select>
                        </div>


                        <div>
                          <label><strong>Año Lectivo:</strong></label>
                          <input
                            type="number"
                            name="anio"
                            value={formMatricula.anio}
                            onChange={handleMatriculaChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                        </div>


                        <div>
                          <label><strong>Procedencia Escolar:</strong></label>
                          <input
                            type="text"
                            name="procedencia_escolar"
                            placeholder="Ej: CEOSJ, Pedro Manuel Arcaya..."
                            value={formMatricula.procedencia_escolar}
                            onChange={handleMatriculaChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                        </div>


                        <div>
                          <label><strong>Credo Religioso:</strong></label>
                          <select
                            name="credo_religioso"
                            value={formMatricula.credo_religioso}
                            onChange={handleMatriculaChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                          >
                            <option value="CATÓLICA">CATÓLICA</option>
                            <option value="EVANGÉLICA">EVANGÉLICA</option>
                            <option value="NINGUNA">NINGUNA</option>
                            <option value="OTRA">OTRA</option>
                          </select>
                        </div>


                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                          <label style={{ cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              name="ha_repetido"
                              checked={formMatricula.ha_repetido}
                              onChange={handleMatriculaChange}
                            /> ¿Ha repetido de curso previamente?
                          </label>
                          <label style={{ cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              name="opta_religion"
                              checked={formMatricula.opta_religion}
                              onChange={handleMatriculaChange}
                            /> Opta por la asignatura de Religión
                          </label>
                        </div>
                      </div>


                    </div>
                  )}


                  {pasoMatricula === 2 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label><strong>Sistema / Previsión de Salud:</strong></label>
                        <select
                          name="sistema_salud"
                          value={formMatricula.sistema_salud}
                          onChange={handleMatriculaChange}
                          style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="FONASA">FONASA</option>
                          <option value="ISAPRE">ISAPRE</option>
                          <option value="PARTICULAR">PARTICULAR</option>
                        </select>
                      </div>


                      <div>
                        <label><strong>Nombre del Centro de Salud / CESFAM:</strong></label>
                        <input
                          type="text"
                          name="nombre_centro_salud"
                          placeholder="Ej: CESFAM Carol Urzúa, Raúl Brañes..."
                          value={formMatricula.nombre_centro_salud}
                          onChange={handleMatriculaChange}
                          style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </div>


                      <div style={{ gridColumn: 'span 2' }}>
                        <label><strong>Observaciones Médicas / Diagnósticos Relevantes:</strong></label>
                        <input
                          type="text"
                          name="observaciones_relevantes"
                          placeholder="Ej: TDAH, USA LENTES OPTICOS, Está con psicólogo..."
                          value={formMatricula.observaciones_relevantes}
                          onChange={handleMatriculaChange}
                          style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </div>


                      <div style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <label style={{ cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            name="se_atiende_centro_salud"
                            checked={formMatricula.se_atiende_centro_salud}
                            onChange={handleMatriculaChange}
                          /> Se atiende en Centro de Salud
                        </label>
                        <label style={{ cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            name="autorizado_salir_solo"
                            checked={formMatricula.autorizado_salir_solo}
                            onChange={handleMatriculaChange}
                          /> Autorizado a salir solo de la institución
                        </label>
                      </div>
                    </div>
                  )}


                  {pasoMatricula === 3 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div>
                        <label><strong>Tipo de Vivienda:</strong></label>
                        <select
                          name="vivienda"
                          value={formMatricula.vivienda}
                          onChange={handleMatriculaChange}
                          style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="CASA PROPIA">CASA PROPIA</option>
                          <option value="ARRIENDO">ARRIENDO</option>
                          <option value="ALLEGADOS">ALLEGADOS</option>
                        </select>
                      </div>


                      <div>
                        <label><strong>Tramo Registro Social de Hogares (RSH):</strong></label>
                        <select
                          name="porcentaje_registro_social"
                          value={formMatricula.porcentaje_registro_social}
                          onChange={handleMatriculaChange}
                          style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="0 AL 40%">0 AL 40%</option>
                          <option value="41% AL 50%">41% AL 50%</option>
                          <option value="51% AL 60%">51% AL 60%</option>
                          <option value="61% AL 70%">61% AL 70%</option>
                          <option value="MAYOR A 70%">MAYOR A 70%</option>
                        </select>
                      </div>


                      <div>
                        <label><strong>¿Con quién vive?:</strong></label>
                        <select
                          name="con_quien_vive"
                          value={formMatricula.con_quien_vive}
                          onChange={handleMatriculaChange}
                          style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="AMBOS PADRES">AMBOS PADRES</option>
                          <option value="SOLO MADRE">SOLO MADRE</option>
                          <option value="SOLO PADRE">SOLO PADRE</option>
                          <option value="SOLO MADRE Y ABUELOS">SOLO MADRE Y ABUELOS</option>
                          <option value="TUTORES">TUTORES</option>
                        </select>
                      </div>


                      <div>
                        <label><strong>Ingreso Mensual Familiar (\$):</strong></label>
                        <input
                          type="number"
                          name="ingreso_mensual_hogar"
                          value={formMatricula.ingreso_mensual_hogar}
                          onChange={handleMatriculaChange}
                          style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </div>


                      <div>
                        <label><strong>Personas en el hogar:</strong></label>
                        <input
                          type="number"
                          name="numero_personas_hogar"
                          value={formMatricula.numero_personas_hogar}
                          onChange={handleMatriculaChange}
                          style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </div>


                      <div>
                        <label><strong>Personas que trabajan:</strong></label>
                        <input
                          type="number"
                          name="personas_trabajando_hogar"
                          value={formMatricula.personas_trabajando_hogar}
                          onChange={handleMatriculaChange}
                          style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                      </div>


                      <div style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '10px' }}>
                        <label style={{ cursor: 'pointer' }}><input type="checkbox" name="tiene_agua" checked={formMatricula.tiene_agua} onChange={handleMatriculaChange} /> Agua Potable</label>
                        <label style={{ cursor: 'pointer' }}><input type="checkbox" name="tiene_electricidad" checked={formMatricula.tiene_electricidad} onChange={handleMatriculaChange} /> Luz Eléctrica</label>
                        <label style={{ cursor: 'pointer' }}><input type="checkbox" name="tiene_alcantarillado" checked={formMatricula.tiene_alcantarillado} onChange={handleMatriculaChange} /> Alcantarillado</label>
                        <label style={{ cursor: 'pointer' }}><input type="checkbox" name="pertenece_programa_social" checked={formMatricula.pertenece_programa_social} onChange={handleMatriculaChange} /> Programa Social</label>
                        <label style={{ cursor: 'pointer' }}><input type="checkbox" name="pertenece_pueblo_indigena" checked={formMatricula.pertenece_pueblo_indigena} onChange={handleMatriculaChange} /> Pueblo Indígena</label>
                      </div>
                    </div>
                  )}


                  <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                    {pasoMatricula > 1 && (
                      <button
                        type="button"
                        onClick={() => setPasoMatricula(p => p - 1)}
                        className="sec-btn-outline"
                      >
                        ← Anterior
                      </button>
                    )}


                    {pasoMatricula < 3 ? (
                      <button
                        type="button"
                        onClick={() => setPasoMatricula(p => p + 1)}
                        className="sec-btn-outline"
                        style={{ backgroundColor: '#800020', color: '#fff', marginLeft: 'auto' }}
                      >
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={guardandoMatricula}
                        className="sec-btn-outline"
                        style={{ backgroundColor: '#28a745', color: '#fff', borderColor: '#28a745', marginLeft: 'auto', fontWeight: 'bold' }}
                      >
                        {guardandoMatricula ? 'Guardando...' : '✓ Registrar Matrícula en BD'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
            {tab === 'estudiantes' && (
              <div className="sec-card">
                <h3 className="sec-title">Información de Estudiantes y Apoderados</h3>
                <div className="sec-divider"></div>


                <div className="sec-search-container">
                  <input
                    type="text"
                    className="sec-search-input"
                    placeholder="Buscar por RUT, Alumno o Apoderado..."
                    value={busquedaEstudiante}
                    onChange={(e) => setBusquedaEstudiante(e.target.value)}
                    autoFocus
                  />
                </div>


                {cargandoEstudiantes ? (
                  <p style={{ color: '#666', padding: '10px' }}>Cargando registros desde la base de datos...</p>
                ) : (
                  <table className="sec-table">
                    <thead>
                      <tr>
                        <th>RUT</th>
                        <th>Estudiante</th>
                        <th>Curso</th>
                        <th>Apoderado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantesFiltrados.length > 0 ? (
                        estudiantesFiltrados.map((item, index) => {
                          const rutMostrar = item.rut || item.rut_alumno || '-';
                          const nombreAlumnoMostrar = item.nombre || `${item.nombres || ''} ${item.apellido_paterno || ''} ${item.apellido_materno || ''}`.trim();
                          const cursoMostrar = item.curso || item.nombre_curso || 'Sin Curso';
                          const apoderadoMostrar = item.apoderado || item.nombre_apoderado || item.nombre_completo || 'Sin Apoderado';
                          const esSeleccionado = estudianteSeleccionado?.id === item.id || (estudianteSeleccionado?.rut === item.rut && item.rut);


                          return (
                            <React.Fragment key={item.id || item.rut || index}>
                              <tr>
                                <td>{rutMostrar}</td>
                                <td>{nombreAlumnoMostrar}</td>
                                <td>{cursoMostrar}</td>
                                <td>{apoderadoMostrar}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="sec-btn-outline"
                                    onClick={() => toggleFicha(item)}
                                  >
                                    {esSeleccionado ? 'Cerrar Ficha' : 'Ver Ficha'}
                                  </button>
                                </td>
                              </tr>


                              {esSeleccionado && (
                                <tr className="sec-ficha-row">
                                  <td colSpan="5" style={{ padding: '12px', backgroundColor: '#fcf8f8' }}>
                                    <div className="sec-ficha-modal" style={{ margin: 0, width: '100%' }}>
                                      <div className="sec-ficha-header">
                                        <h4>Ficha de {nombreAlumnoMostrar}</h4>
                                        <button
                                          type="button"
                                          className="sec-btn-close"
                                          onClick={() => setEstudianteSeleccionado(null)}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                      <div className="sec-ficha-grid">
                                        <div>
                                          <p><strong>RUT Alumno:</strong> {rutMostrar}</p>
                                          <p><strong>Curso:</strong> {cursoMostrar}</p>
                                          <p><strong>Dirección:</strong> {item.direccion || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p><strong>Apoderado Titular:</strong> {apoderadoMostrar}</p>
                                          <p><strong>RUT Apoderado:</strong> {item.rutApoderado || item.rut_apoderado || 'N/A'}</p>
                                          <p><strong>Teléfono:</strong> {item.telefono || item.telefono_apoderado || 'N/A'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                            {busquedaEstudiante.trim()
                              ? `No se encontraron resultados para "${busquedaEstudiante}".`
                              : 'No hay estudiantes registrados en la base de datos.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}



{tab === 'justificativos' && (
  <div className="sec-card">
    <h3 className="sec-title">Revisar Justificativos</h3>
    <div className="sec-divider"></div>

    {cargandoJustificativos ? (
      <p style={{ color: '#666', padding: '10px' }}>
        Cargando justificativos desde la base de datos...
      </p>
    ) : errorJustificativos ? (
      <p style={{ color: '#d9534f', padding: '10px' }}>
        {errorJustificativos}
      </p>
    ) : listaJustificativos.length === 0 ? (
      <p style={{ color: '#666', padding: '10px' }}>
        No hay justificativos registrados.
      </p>
    ) : (
      <div style={{ overflowX: 'auto' }}>
        <table className="sec-table">
          <thead>
            <tr>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Estudiante</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Documento</th>
            </tr>
          </thead>
          <tbody>
            {listaJustificativos.map((item) => {
              const rutaBD =
                item.archivoPdf ??
                item.archivo_pdf ??
                item.archivo ??
                item.url_archivo ??
                item.documento_url ??
                item.archivo_url;

              let urlFinal = '';

              if (typeof rutaBD === 'string' && rutaBD.trim()) {
                const ruta = rutaBD.trim().replace(/\\/g, '/');

                if (/^https?:\/\//i.test(ruta)) {
                  urlFinal = ruta;
                } else if (ruta.startsWith('data:application/pdf')) {
                  urlFinal = ruta;
                } else {
                  const rutaRelativa = ruta.replace(/^\/+/, '');
                  const nombreArchivo = rutaRelativa.split('/').pop();

                  if (rutaRelativa.startsWith('uploads/')) {
                    urlFinal = `http://localhost:3000/${rutaRelativa
                      .split('/')
                      .map(encodeURIComponent)
                      .join('/')}`;
                  } else if (nombreArchivo) {
                    urlFinal = `http://localhost:3000/uploads/justificativos/${encodeURIComponent(nombreArchivo)}`;
                  }
                }
              }

              const fechaInicio =
                item.fechaInicio ?? item.fecha_inicio ?? '-';
              const fechaFin =
                item.fechaFin ?? item.fecha_fin ?? '-';
              const nombreEstudiante =
                item.estudiante ??
                item.nombre_estudiante ??
                item.alumno ??
                'Estudiante';

              const estado = String(
                item.estado || 'PENDIENTE'
              ).toUpperCase();

              return (
                <tr key={item.id}>
                  <td>{fechaInicio}</td>
                  <td>{fechaFin}</td>
                  <td>
                    <strong>{nombreEstudiante}</strong>
                  </td>
                  <td>{item.motivo || '-'}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        backgroundColor:
                          estado === 'APROBADO'
                            ? '#d4edda'
                            : estado === 'RECHAZADO'
                              ? '#f8d7da'
                              : '#fff3cd',
                        color:
                          estado === 'APROBADO'
                            ? '#155724'
                            : estado === 'RECHAZADO'
                              ? '#721c24'
                              : '#856404',
                      }}
                    >
                      {estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {urlFinal ? (
                      <a
                        href={urlFinal}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (
                            !/^https?:\/\//i.test(urlFinal) &&
                            !urlFinal.startsWith('data:')
                          ) {
                            e.preventDefault();
                            alert(
                              'No se puede determinar una dirección válida para el documento.'
                            );
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '7px 12px',
                          backgroundColor: '#800020',
                          color: '#fff',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        📄 Ver PDF
                      </a>
                    ) : (
                      <span
                        style={{
                          color: '#999',
                          fontSize: '0.85rem',
                        }}
                      >
                        Sin archivo
                      </span>
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


          </main>
        </div>
      </div>
    </div>
  );
}

export default SecretariaDashboard;


