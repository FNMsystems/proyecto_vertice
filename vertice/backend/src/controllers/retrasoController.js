import {
  obtenerCursosInspectorModel,
  obtenerAlumnosCursoModel,
  registrarRetrasoModel
} from '../models/retrasoModel.js';

export const obtenerCursosInspector = async (
  req,
  res
) => {
  try {
    const cursos =
      await obtenerCursosInspectorModel();

    return res.json({
      cursos
    });
  } catch (error) {
    console.error(
      'Error obteniendo cursos de Inspectoría:',
      error
    );

    return res.status(500).json({
      error:
        'No se pudieron cargar los cursos.'
    });
  }
};

export const obtenerAlumnosCurso = async (
  req,
  res
) => {
  try {
    const { cursoId } = req.params;

    if (!cursoId) {
      return res.status(400).json({
        error:
          'El curso es obligatorio.'
      });
    }

    const alumnos =
      await obtenerAlumnosCursoModel(
        cursoId
      );

    return res.json({
      alumnos
    });
  } catch (error) {
    console.error(
      'Error obteniendo alumnos del curso:',
      error
    );

    return res.status(500).json({
      error:
        'No se pudieron cargar los alumnos.'
    });
  }
};

export const registrarRetraso = async (
  req,
  res
) => {
  try {
    const {
      alumnoId,
      cursoId,
      fecha,
      horaLlegada,
      motivo,
      observacion
    } = req.body;

    if (
      !alumnoId ||
      !cursoId ||
      !fecha ||
      !horaLlegada
    ) {
      return res.status(400).json({
        error:
          'El curso, alumno, fecha y hora de llegada son obligatorios.'
      });
    }

    if (!req.usuario?.id) {
      return res.status(401).json({
        error:
          'La sesión del inspector no es válida.'
      });
    }

    const resultado =
      await registrarRetrasoModel({
        alumnoId,
        cursoId,
        fecha,
        horaLlegada,
        motivo,
        observacion,
        registradoPor:
          req.usuario.id
      });

    return res.status(201).json({
      mensaje:
        'Atraso registrado correctamente.',
      ...resultado
    });
  } catch (error) {
    console.error(
      'Error registrando atraso:',
      error
    );

    return res.status(409).json({
      error:
        error.message ||
        'No se pudo registrar el atraso.'
    });
  }
};