export const mockData = {
  usuarios: [
    { 
      id: 1, 
      nombre: "Carlos Tapia", 
      email: "carlos.tapia@ordendesanjorge.cl", 
      rut: "11.111.111-1", 
      rol: "director" 
    },
    { 
      id: 2, 
      nombre: "Marta Gómez", 
      email: "marta.gomez@ordendesanjorge.cl", 
      rut: "22.222.222-2", 
      rol: "profesor",
      cursoJefatura: "8° Básico A"
    },
    { 
      id: 3, 
      nombre: "Roberto Silva", 
      email: "roberto.silva@ordendesanjorge.cl", 
      rut: "33.333.333-3", 
      rol: "profesor",
      cursoJefatura: "2° Medio A"
    },
    { 
      id: 4, 
      nombre: "Juan Pérez", 
      email: "juan.perez@ordendesanjorge.cl", 
      rut: "44.444.444-4", 
      rol: "inspectoria" 
    },
    { 
      id: 5, 
      nombre: "Lorena Morales", 
      email: "lorena.morales@gmail.com", 
      rut: "12.345.678-9", 
      rol: "apoderado" 
    },
    { 
      id: 6, 
      nombre: "Esteban Rojas", 
      email: "esteban.rojas@gmail.com", 
      rut: "15.987.654-3", 
      rol: "apoderado" 
    },
    { 
      id: 7, 
      nombre: "Patricia Varela", 
      email: "patricia.varela@ordendesanjorge.cl", 
      rut: "55.555.555-5", 
      rol: "utp" 
    },
    { 
      id: 8, 
      nombre: "Andrea Castro", 
      email: "andrea.castro@ordendesanjorge.cl", 
      rut: "66.666.666-6", 
      rol: "secretaria" 
    }
  ],

  alumnos: [
    {
      id: 101,
      apoderadoId: 5,
      nombre: "Lucas",
      apellido: "Pérez Morales",
      rut: "23.456.789-1",
      curso: "8° Básico A",
      asistenciaPorcentaje: 92,
      riesgoRepitencia: null,
      asignaturas: [
        { nombre: "Matemáticas", notas: [6.5, 5.8, 6.0], promedio: "6.1" },
        { nombre: "Lenguaje", notas: [5.0, 6.0, 5.5], promedio: "5.5" },
        { nombre: "Historia", notas: [7.0, 6.8, 6.5], promedio: "6.8" }
      ],
      anotaciones: [
        { fecha: "2026-04-12", asignatura: "Matemáticas", tipo: "Positiva", detalle: "Excelente participación en clase." }
      ],
      asistencia: [
        { fecha: "2026-09-07", estado: "presente" },
        { fecha: "2026-09-06", estado: "presente" },
        { fecha: "2026-09-05", estado: "ausente" }
      ],
      comunicaciones: [
        { titulo: "Reunión de Apoderados", contenido: "Estimados apoderados, este jueves tenemos reunión.", fecha: "2026-09-01", tipo: "General", remitente: "Dirección" }
      ],
      pie: null
    },
    {
      id: 102,
      apoderadoId: 5,
      nombre: "Sofía",
      apellido: "Pérez Morales",
      rut: "24.123.456-K",
      curso: "5° Básico B",
      asistenciaPorcentaje: 81,
      riesgoRepitencia: "El alumno presenta riesgo de repitencia por asistencia inferior al 85%.",
      asignaturas: [
        { nombre: "Matemáticas", notas: [3.5, 4.0, 3.8], promedio: "3.8" },
        { nombre: "Lenguaje", notas: [4.5, 5.0, 4.2], promedio: "4.6" }
      ],
      anotaciones: [
        { fecha: "2026-05-10", asignatura: "Lenguaje", tipo: "Negativa", detalle: "Conversa en clases constantemente." }
      ],
      asistencia: [
        { fecha: "2026-09-07", estado: "ausente" },
        { fecha: "2026-09-06", estado: "ausente" }
      ],
      comunicaciones: [],
      pie: { psicologa: true, psicopedagoga: false, observaciones: "Sesiones de apoyo emocional semanales." }
    },
    {
      id: 103,
      apoderadoId: 6,
      nombre: "Mateo",
      apellido: "Rojas Soto",
      rut: "22.987.654-3",
      curso: "2° Medio A",
      asistenciaPorcentaje: 98,
      riesgoRepitencia: null,
      asignaturas: [
        { nombre: "Física", notas: [6.0, 6.5, 6.2], promedio: "6.2" },
        { nombre: "Química", notas: [5.5, 5.8, 6.0], promedio: "5.8" }
      ],
      anotaciones: [],
      asistencia: [
        { fecha: "2026-09-07", estado: "presente" }
      ],
      comunicaciones: [
        { titulo: "Salida Pedagógica", contenido: "Visita al museo este viernes.", fecha: "2026-09-03", tipo: "Curso", remitente: "Prof. Marta Gómez" }
      ],
      pie: { psicologa: false, psicopedagoga: true, observaciones: "Refuerzo en técnicas de estudio." }
    }
  ],

  retirosQR: [
    {
      id: "QR-101",
      codigoQR: "QR-23.456.789-1",
      alumno_nombre: "Lucas",
      alumno_apellido: "Pérez Morales",
      curso: "8° Básico A",
      apoderado_nombre: "Lorena",
      apoderado_apellido: "Morales",
      apoderado_rut: "12.345.678-9",
      telefono: "+56912345678",
      estado: "pendiente",
      fechaSolicitud: "2026-09-07 10:30"
    }
  ],

  estadisticasColegio: {
    totalMatricula: 450,
    promedioGeneralAsistencia: "91.5%",
    alumnosRiesgoRepitencia: 12,
    casosPIE: 34
  }
};

export default mockData;