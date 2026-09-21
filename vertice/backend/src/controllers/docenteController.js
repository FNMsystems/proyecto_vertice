import {
  buscarDocentePorEmail,
  obtenerDashboardDocente
} from '../models/docenteModel.js';


export const obtenerMiDashboard = async (req, res) => {
  try {

    const docenteId = req.usuario?.docente_id;

    if (!docenteId) {
      return res.status(403).json({
        error: 'El usuario autenticado no está asociado a un docente.'
      });
    }

    const filas = await obtenerDashboardDocente(
      docenteId,
      2026
    );

    if (!filas || filas.length === 0) {
      return res.json({
        docente: null,
        cursos: []
      });
    }

    const primeraFila = filas[0];

    const docente = {
      id: primeraFila.docente_id,
      rut: primeraFila.docente_rut,
      nombres: primeraFila.docente_nombres,
      apellido_paterno: primeraFila.docente_apellido_paterno,
      apellido_materno: primeraFila.docente_apellido_materno,
      correo: primeraFila.docente_correo,
      especialidad: primeraFila.especialidad
    };

    const cursosMap = new Map();

    for (const fila of filas) {

      if (!cursosMap.has(fila.curso_id)) {

        cursosMap.set(fila.curso_id, {
          id: fila.curso_id,
          nombre: fila.curso_nombre,
          codigo_nivel: fila.codigo_nivel,
          jornada: fila.jornada,
          anio: fila.curso_anio,
          esProfesorJefe: false,
          asignaturas: []
        });
      }

      const curso = cursosMap.get(fila.curso_id);

      if (fila.es_profesor_jefe) {
        curso.esProfesorJefe = true;
      }

      const yaExiste = curso.asignaturas.some(
        asignatura => asignatura.id === fila.asignatura_id
      );

      if (!yaExiste) {

        curso.asignaturas.push({
          id: fila.asignatura_id,
          nombre: fila.asignatura_nombre,
          codigo: fila.asignatura_codigo,

          // Esta asignatura pertenece directamente
          // al docente que está conectado.
          puedeEditar: true
        });
      }
    }

    return res.json({
      docente,
      cursos: Array.from(cursosMap.values())
    });

  } catch (error) {

    console.error(
      'Error obteniendo dashboard del docente:',
      error
    );

    return res.status(500).json({
      error: 'No se pudo obtener la información del docente.'
    });
  }
};