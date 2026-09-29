import {
  getApoderadoPorRutModel,
  getAlumnosPorApoderadoModel,
  getDetalleAlumnoModel,
  getPersonasAutorizadasRetiroModel,
  crearJustificativoModel
} from '../models/apoderadoModel.js';

export const getApoderadoByRut = async (
  req,
  res
) => {
  try {
    const { rut } = req.params;

    const apoderado =
      await getApoderadoPorRutModel(rut);

    if (!apoderado) {
      return res.status(404).json({
        error:
          'No se encontró un apoderado con ese RUT.'
      });
    }

    res.json(apoderado);

  } catch (error) {
    console.error(
      'Error buscando apoderado por RUT:',
      error
    );

    res.status(500).json({
      error:
        'Error interno del servidor.'
    });
  }
};

export const getAlumnosByApoderado = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const alumnos =
      await getAlumnosPorApoderadoModel(id);

    res.json(alumnos);

  } catch (error) {
    console.error(
      'Error obteniendo alumnos del apoderado:',
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
};

export const getMisAlumnos = async (
  req,
  res
) => {
  try {
    const rut = req.usuario?.rut;

    if (!rut) {
      return res.status(401).json({
        error:
          'La sesión no contiene el RUT del apoderado.'
      });
    }

    const apoderado =
      await getApoderadoPorRutModel(rut);

    if (!apoderado) {
      return res.status(404).json({
        error:
          'No se encontró el apoderado asociado a la sesión.'
      });
    }

    const alumnos =
      await getAlumnosPorApoderadoModel(
        apoderado.id
      );

    res.json(alumnos);

  } catch (error) {
    console.error(
      'Error obteniendo alumnos del apoderado autenticado:',
      error
    );

    res.status(500).json({
      error:
        'No se pudieron obtener los alumnos del apoderado.'
    });
  }
};

export const getDetalleAlumno = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const data =
      await getDetalleAlumnoModel(id);

    const totalAsistencias =
      data.asistencia.length;

    const presentes =
      data.asistencia.filter(
        a =>
          String(a.estado)
            .toUpperCase() === 'PRESENTE'
      ).length;

    const atrasados =
      data.asistencia.filter(
        a =>
          String(a.estado)
            .toUpperCase() === 'ATRASADO'
      ).length;

    const justificados =
      data.asistencia.filter(
        a =>
          String(a.estado)
            .toUpperCase() === 'JUSTIFICADO'
      ).length;

    const ausentes =
      data.asistencia.filter(
        a =>
          String(a.estado)
            .toUpperCase() === 'AUSENTE'
      ).length;

    const diasAsistidos =
      presentes + atrasados;

    const pctAsistencia =
      totalAsistencias > 0
        ? (
            (diasAsistidos /
              totalAsistencias) *
            100
          ).toFixed(1)
        : '100.0';

    const promedios =
      data.asignaturas
        .map(a => Number(a.promedio))
        .filter(
          n => !Number.isNaN(n)
        );

    const promedioGeneral =
      promedios.length > 0
        ? (
            promedios.reduce(
              (a, b) => a + b,
              0
            ) /
            promedios.length
          ).toFixed(1)
        : null;

    let riesgoRepitencia = null;

    const riesgoNotas =
      promedioGeneral !== null &&
      Number(promedioGeneral) < 4.0;

    const riesgoAsistencia =
      Number(pctAsistencia) < 85;

    if (
      riesgoNotas &&
      riesgoAsistencia
    ) {
      riesgoRepitencia =
        'El alumno presenta riesgo por rendimiento académico insuficiente y baja asistencia.';
    } else if (riesgoNotas) {
      riesgoRepitencia =
        'El alumno presenta riesgo por promedio de notas insuficiente.';
    } else if (riesgoAsistencia) {
      riesgoRepitencia =
        'El alumno presenta riesgo por asistencia inferior al 85%.';
    }

    res.json({
      ...data,
      asistenciaPorcentaje:
        pctAsistencia,
      resumenAsistencia: {
        total: totalAsistencias,
        presentes,
        ausentes,
        atrasados,
        justificados
      },
      promedioGeneral,
      riesgoRepitencia
    });

  } catch (error) {
    console.error(
      'Error obteniendo detalle del alumno:',
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
};

export const getPersonasAutorizadasRetiro = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const rut = req.usuario?.rut;

    if (!rut) {
      return res.status(401).json({
        error:
          'La sesión no contiene el RUT del apoderado.'
      });
    }

    const apoderado =
      await getApoderadoPorRutModel(rut);

    if (!apoderado) {
      return res.status(404).json({
        error:
          'No se encontró el apoderado.'
      });
    }

    const alumnos =
      await getAlumnosPorApoderadoModel(
        apoderado.id
      );

    const pertenece = alumnos.some(
      alumno =>
        String(alumno.id) === String(id)
    );

    if (!pertenece) {
      return res.status(403).json({
        error:
          'El alumno no pertenece a este apoderado.'
      });
    }

    const personas =
      await getPersonasAutorizadasRetiroModel(
        id,
        apoderado.id
      );

    res.json(personas);
  } catch (error) {
    console.error(
      'Error obteniendo personas autorizadas:',
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
};

export const subirJustificativo = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const {
      fechaInicio,
      fechaFin,
      motivo
    } = req.body;

    const rut = req.usuario?.rut;

    if (!rut) {
      return res.status(401).json({
        error:
          'La sesión no contiene el RUT del apoderado.'
      });
    }

    if (!fechaInicio) {
      return res.status(400).json({
        error:
          'La fecha de inicio es obligatoria.'
      });
    }

    if (!motivo || !motivo.trim()) {
      return res.status(400).json({
        error:
          'El motivo es obligatorio.'
      });
    }

    const apoderado =
      await getApoderadoPorRutModel(rut);

    if (!apoderado) {
      return res.status(404).json({
        error:
          'No se encontró el apoderado.'
      });
    }

    const alumnos =
      await getAlumnosPorApoderadoModel(
        apoderado.id
      );

    const pertenece = alumnos.some(
      alumno =>
        String(alumno.id) === String(id)
    );

    if (!pertenece) {
      return res.status(403).json({
        error:
          'El alumno no pertenece a este apoderado.'
      });
    }

    const archivoPdf = req.file
      ? req.file.path.replace(/\\/g, '/')
      : null;

    const justificativo =
      await crearJustificativoModel(
        id,
        fechaInicio,
        fechaFin,
        motivo.trim(),
        archivoPdf
      );

    res.status(201).json({
      mensaje:
        'Justificativo enviado correctamente.',
      justificativo
    });
  } catch (error) {
    console.error(
      'Error subiendo justificativo:',
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
};