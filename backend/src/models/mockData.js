export const usuarios = [
  {
    id: 1,
    rut: "11.111.111-1",
    nombre: "Gustavo Inostroza (Director)",
    email: "gustavoinostroza@ordendesanjorge.cl",
    password: "123", 
    rol: "ADMIN"
  },
  {
    id: 2,
    rut: "22.222.222-2",
    nombre: "Carlos (Profesor)",
    email: "carlos@ordendesanjorge.cl",
    password: "123",
    rol: "PROFESOR"
  },
  {
    id: 3,
    rut: "33.333.333-3",
    nombre: "Marta (Inspectora)",
    email: "inspector@ordendesanjorge.cl",
    password: "123",
    rol: "INSPECTOR"
  },
  {
    id: 4,
    rut: "44.444.444-4",
    nombre: "Gonzalo (Jefe UTP)",
    email: "utp@ordendesanjorge.cl",
    password: "123",
    rol: "UTP"
  },
  {
    id: 5,
    rut: "55.555.555-5",
    nombre: "Ana María (Profesora)",
    email: "anamaria@ordendesanjorge.cl",
    password: "123",
    rol: "PROFESOR"
  }
];

export const cursos = [
  { id: 101, nombre: "3° Básico A", profesorJefeId: 2 },
  { id: 102, nombre: "4° Básico A", profesorJefeId: 5 },
  { id: 103, nombre: "1° Medio A", profesorJefeId: null }
];

export const asignacionesClases = [
  { 
    id: 1, 
    profesorId: 2, 
    cursoId: 101, 
    asignatura: "Matemáticas",
    dias: ["Lunes", "Miércoles"],
    horario: "08:00 - 09:30"
  },
  { 
    id: 2, 
    profesorId: 2, 
    cursoId: 102, 
    asignatura: "Matemáticas",
    dias: ["Martes", "Jueves"],
    horario: "09:45 - 11:15"
  },
  { 
    id: 3, 
    profesorId: 2, 
    cursoId: 103, 
    asignatura: "Física",
    dias: ["Viernes"],
    horario: "11:30 - 13:00"
  },
  { 
    id: 4, 
    profesorId: 5, 
    cursoId: 102, 
    asignatura: "Lenguaje",
    dias: ["Lunes", "Viernes"],
    horario: "08:00 - 09:30"
  }
];

export const alumnos = [
  // 3° Básico A (Jefatura de Carlos)
  { id: 1, cursoId: 1, nombre: 'Juan Pérez', promedio: 3.8, asistencia: 82, anotaciones: 2 },
  { id: 2, cursoId: 1, nombre: 'María González', promedio: 6.2, asistencia: 95, anotaciones: 0 },
  { id: 3, cursoId: 1, nombre: 'Diego López', promedio: 3.9, asistencia: 90, anotaciones: 4 },
  { id: 4, cursoId: 1, nombre: 'Camila Rojas', promedio: 5.5, asistencia: 78, anotaciones: 1 },

  // 4° Básico A
  { id: 5, cursoId: 2, nombre: 'Lucas Silva', promedio: 5.8, asistencia: 92, anotaciones: 0 },
  { id: 6, cursoId: 2, nombre: 'Sofia Castro', promedio: 3.6, asistencia: 80, anotaciones: 3 },

  // 1° Medio A
  { id: 7, cursoId: 3, nombre: 'Mateo Morales', promedio: 4.5, asistencia: 88, anotaciones: 1 },
];