import {
  obtenerResumenDirectorModel,
  obtenerAlumnosDirectorModel,
  obtenerDetalleAlumnoDirectorModel,
  obtenerDocentesDirectorModel,
  obtenerDetalleDocenteDirectorModel,
  obtenerCursosDirectorModel,
  obtenerDetalleCursoDirectorModel,
  obtenerAsignaturasDirectorModel,
  obtenerAsignacionesDocenteDirectorModel,
  crearDocenteDirectorModel,
  actualizarDocenteDirectorModel,
  desvincularDocenteDirectorModel,
  reactivarDocenteDirectorModel,
  crearAsignacionDocenteDirectorModel,
  actualizarAsignacionDocenteDirectorModel,
  eliminarAsignacionDocenteDirectorModel,
  obtenerAsistenciaDirectorModel,
  obtenerEstadisticasAsistenciaDirectorModel,
  obtenerRendimientoDirectorModel,
  obtenerJustificativosDirectorModel,
  obtenerHorariosDirectorModel,
  obtenerAnotacionesDirectorModel,
  desvincularAlumnoDirectorModel,
  actualizarEstadoJustificativoDirectorModel,
  obtenerRetirosPorAnioDirectorModel,
  obtenerAtrasosPorDiaDirectorModel,
  obtenerRiesgoAcademicoDirectorModel,
  obtenerMatriculasAnioDirectorModel
} from '../models/directorModel.js';


const obtenerAnio = (req) => {
  const anio = Number(req.query.anio || req.body?.anio || 2026);

  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    return 2026;
  }

  return anio;
};

export const getResumenDirector = async (req, res) => {
  try {
    const data = await obtenerResumenDirectorModel(obtenerAnio(req));
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo resumen Director:', error);
    res.status(500).json({
      error: 'No se pudo obtener el resumen de Dirección.'
    });
  }
};

export const getAlumnosDirector = async (req, res) => {
  try {
    const data = await obtenerAlumnosDirectorModel(obtenerAnio(req));
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo alumnos Director:', error);
    res.status(500).json({
      error: 'No se pudieron obtener los alumnos.'
    });
  }
};

export const getDetalleAlumnoDirector = async (req, res) => {
  try {
    const data = await obtenerDetalleAlumnoDirectorModel(
      req.params.id,
      obtenerAnio(req)
    );

    if (!data) {
      return res.status(404).json({
        error: 'Alumno no encontrado.'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo detalle alumno:', error);
    res.status(500).json({
      error: 'No se pudo obtener el detalle del alumno.'
    });
  }
};

export const getDocentesDirector = async (req, res) => {
  try {
    const data = await obtenerDocentesDirectorModel(obtenerAnio(req));
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo docentes Director:', error);
    res.status(500).json({
      error: 'No se pudieron obtener los docentes.'
    });
  }
};

export const getDetalleDocenteDirector = async (req, res) => {
  try {
    const data = await obtenerDetalleDocenteDirectorModel(
      req.params.id,
      obtenerAnio(req)
    );

    if (!data) {
      return res.status(404).json({
        error: 'Docente no encontrado.'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo detalle docente:', error);
    res.status(500).json({
      error: 'No se pudo obtener el detalle del docente.'
    });
  }
};

export const getCursosDirector = async (req, res) => {
  try {
    const data = await obtenerCursosDirectorModel(obtenerAnio(req));
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo cursos Director:', error);
    res.status(500).json({
      error: 'No se pudieron obtener los cursos.'
    });
  }
};

export const getDetalleCursoDirector = async (req, res) => {
  try {
    const data = await obtenerDetalleCursoDirectorModel(
      req.params.id,
      obtenerAnio(req)
    );

    if (!data) {
      return res.status(404).json({
        error: 'Curso no encontrado.'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo detalle curso:', error);
    res.status(500).json({
      error: 'No se pudo obtener el detalle del curso.'
    });
  }
};

export const getAsignaturasDirector = async (req, res) => {
  try {
    const data = await obtenerAsignaturasDirectorModel();
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo asignaturas:', error);
    res.status(500).json({
      error: 'No se pudieron obtener las asignaturas.'
    });
  }
};

export const getAsignacionesDirector = async (req, res) => {
  try {
    const data = await obtenerAsignacionesDocenteDirectorModel(
      obtenerAnio(req)
    );

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo asignaciones:', error);
    res.status(500).json({
      error: 'No se pudieron obtener las asignaciones.'
    });
  }
};

export const crearDocenteDirector = async (req, res) => {
  try {
    const {
      rut,
      nombres,
      apellido_paterno,
      apellido_materno,
      correo,
      telefono,
      especialidad
    } = req.body;

    if (!rut || !nombres) {
      return res.status(400).json({
        error: 'RUT y nombres son obligatorios.'
      });
    }

    const docente = await crearDocenteDirectorModel({
      rut,
      nombres,
      apellido_paterno,
      apellido_materno,
      correo,
      telefono,
      especialidad
    });

    res.status(201).json(docente);
  } catch (error) {
    console.error('Error creando docente:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Ya existe un docente con ese RUT.'
      });
    }

    res.status(500).json({
      error: 'No se pudo crear el docente.'
    });
  }
};

export const actualizarDocenteDirector = async (req, res) => {
  try {
    const docente = await actualizarDocenteDirectorModel(
      req.params.id,
      req.body
    );

    if (!docente) {
      return res.status(404).json({
        error: 'Docente no encontrado.'
      });
    }

    res.json(docente);
  } catch (error) {
    console.error('Error actualizando docente:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Ya existe otro docente con ese RUT.'
      });
    }

    res.status(500).json({
      error: 'No se pudo actualizar el docente.'
    });
  }
};

export const desvincularDocenteDirector = async (req, res) => {
  try {
    const {
      motivo,
      observacion,
      fechaDesvinculacion
    } = req.body;

    if (!motivo) {
      return res.status(400).json({
        error: 'El motivo de desvinculación es obligatorio.'
      });
    }

    const data = await desvincularDocenteDirectorModel(
      req.params.id,
      motivo,
      observacion,
      fechaDesvinculacion
    );

    res.json(data);
  } catch (error) {
    console.error('Error desvinculando docente:', error);
    res.status(500).json({
      error: 'No se pudo desvincular el docente.'
    });
  }
};

export const reactivarDocenteDirector = async (req, res) => {
  try {
    const data = await reactivarDocenteDirectorModel(req.params.id);

    if (!data) {
      return res.status(404).json({
        error: 'Docente no encontrado.'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error reactivando docente:', error);
    res.status(500).json({
      error: 'No se pudo reactivar el docente.'
    });
  }
};

export const crearAsignacionDirector = async (req, res) => {
  try {
    const {
      docente_id,
      curso_id,
      asignatura_id,
      anio,
      es_profesor_jefe
    } = req.body;

    if (!docente_id || !curso_id || !asignatura_id) {
      return res.status(400).json({
        error: 'Docente, curso y asignatura son obligatorios.'
      });
    }

    const data = await crearAsignacionDocenteDirectorModel({
      docente_id,
      curso_id,
      asignatura_id,
      anio,
      es_profesor_jefe
    });

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creando asignación:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Esta asignación docente-curso-asignatura ya existe.'
      });
    }

    res.status(500).json({
      error: 'No se pudo crear la asignación.'
    });
  }
};

export const actualizarAsignacionDirector = async (req, res) => {
  try {
    const data = await actualizarAsignacionDocenteDirectorModel(
      req.params.id,
      req.body
    );

    if (!data) {
      return res.status(404).json({
        error: 'Asignación no encontrada.'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error actualizando asignación:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Esta asignación ya existe.'
      });
    }

    res.status(500).json({
      error: 'No se pudo actualizar la asignación.'
    });
  }
};

export const eliminarAsignacionDirector = async (req, res) => {
  try {
    const data = await eliminarAsignacionDocenteDirectorModel(
      req.params.id
    );

    if (!data) {
      return res.status(404).json({
        error: 'Asignación no encontrada.'
      });
    }

    res.json({
      mensaje: 'Asignación eliminada correctamente.',
      asignacion: data
    });
  } catch (error) {
    console.error('Error eliminando asignación:', error);
    res.status(500).json({
      error: 'No se pudo eliminar la asignación.'
    });
  }
};

export const getAsistenciaDirector = async (req, res) => {
  try {
    const data = await obtenerAsistenciaDirectorModel(
      obtenerAnio(req),
      req.query.cursoId || null,
      req.query.fechaInicio || null,
      req.query.fechaFin || null
    );

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo asistencia:', error);
    res.status(500).json({
      error: 'No se pudo obtener la asistencia.'
    });
  }
};

export const getEstadisticasAsistenciaDirector = async (req, res) => {
  try {
    const data = await obtenerEstadisticasAsistenciaDirectorModel(
      obtenerAnio(req)
    );

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo estadísticas asistencia:', error);
    res.status(500).json({
      error: 'No se pudieron obtener las estadísticas de asistencia.'
    });
  }
};

export const getRendimientoDirector = async (req, res) => {
  try {
    const data = await obtenerRendimientoDirectorModel(
      obtenerAnio(req),
      req.query.cursoId || null
    );

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo rendimiento:', error);
    res.status(500).json({
      error: 'No se pudo obtener el rendimiento académico.'
    });
  }
};

export const getJustificativosDirector = async (req, res) => {
  try {
    const data = await obtenerJustificativosDirectorModel(
      obtenerAnio(req),
      req.query.estado || null
    );

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo justificativos:', error);
    res.status(500).json({
      error: 'No se pudieron obtener los justificativos.'
    });
  }
};

export const getHorariosDirector = async (req, res) => {
  try {
    const data = await obtenerHorariosDirectorModel(
      obtenerAnio(req),
      req.query.cursoId || null
    );

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    res.status(500).json({
      error: 'No se pudieron obtener los horarios.'
    });
  }
};

export const getAnotacionesDirector = async (req, res) => {
  try {
    const data = await obtenerAnotacionesDirectorModel(
      obtenerAnio(req)
    );

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo anotaciones:', error);
    res.status(500).json({
      error: 'No se pudieron obtener las anotaciones.'
    });
  }
};

export const desvincularAlumnoDirector = async (req, res) => {
  try {
    const {
      cursoId,
      motivo,
      observacion,
      fechaRetiro
    } = req.body;

    if (!motivo) {
      return res.status(400).json({
        error: 'El motivo de retiro es obligatorio.'
      });
    }

    const data = await desvincularAlumnoDirectorModel(
      req.params.id,
      cursoId,
      motivo,
      observacion,
      fechaRetiro
    );

    res.json(data);
  } catch (error) {
    console.error('Error retirando alumno:', error);
    res.status(500).json({
      error: 'No se pudo registrar el retiro del alumno.'
    });
  }
};

export const actualizarJustificativoDirector = async (req, res) => {
  try {
    const {
      estado,
      observacion
    } = req.body;

    if (!estado) {
      return res.status(400).json({
        error: 'El estado es obligatorio.'
      });
    }

    const data = await actualizarEstadoJustificativoDirectorModel(
      req.params.id,
      estado,
      observacion
    );

    if (!data) {
      return res.status(404).json({
        error: 'Justificativo no encontrado.'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error actualizando justificativo:', error);
    res.status(500).json({
      error: 'No se pudo actualizar el justificativo.'
    });
  }
};


export const getRetirosPorAnioDirector = async (req, res) => {
  try {
    const data = await obtenerRetirosPorAnioDirectorModel(obtenerAnio(req));
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo retiros por año:', error);
    res.status(500).json({
      error: 'No se pudieron obtener los retiros por año.'
    });
  }
};

export const getAtrasosPorDiaDirector = async (req, res) => {
  try {
    const data = await obtenerAtrasosPorDiaDirectorModel(obtenerAnio(req));
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo atrasos por día:', error);
    res.status(500).json({
      error: 'No se pudieron obtener los atrasos por día.'
    });
  }
};

export const getRiesgoAcademicoDirector = async (req, res) => {
  try {
    const data = await obtenerRiesgoAcademicoDirectorModel(obtenerAnio(req));
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo alertas académicas:', error);
    res.status(500).json({
      error: 'No se pudieron obtener las alertas académicas.'
    });
  }
};

export const getMatriculasAnioDirector = async (req, res) => {
  try {
    const anio = Number(req.query.anio || 2027);

    if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
      return res.status(400).json({
        error: 'El año solicitado no es válido.'
      });
    }

    const data = await obtenerMatriculasAnioDirectorModel(anio);
    res.json(data);
  } catch (error) {
    console.error('Error obteniendo matrículas del año:', error);
    res.status(500).json({
      error: 'No se pudieron obtener las matrículas del año solicitado.'
    });
  }
};