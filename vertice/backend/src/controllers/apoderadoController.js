import { getAlumnosPorApoderadoModel, getDetalleAlumnoModel } from '../models/apoderadoModel.js';

export const getAlumnosByApoderado = async (req, res) => {
  try {
    const { id } = req.params;
    const alumnos = await getAlumnosPorApoderadoModel(id);
    res.json(alumnos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDetalleAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getDetalleAlumnoModel(id);

    const totalAsistencias = data.asistencia.length;
    const presentes = data.asistencia.filter(a => a.estado === 'presente').length;
    const pctAsistencia = totalAsistencias > 0 ? ((presentes / totalAsistencias) * 100).toFixed(1) : 100;

    const promedios = data.asignaturas.map(a => parseFloat(a.promedio));
    const promedioGeneral = promedios.length > 0 ? promedios.reduce((a, b) => a + b, 0) / promedios.length : 7.0;

    let riesgoRepitencia = null;
    const riesgoNotas = promedioGeneral < 4.0;
    const riesgoAsistencia = pctAsistencia < 85;

    if (riesgoNotas && riesgoAsistencia) {
      riesgoRepitencia = "El alumno presenta riesgo alto de repitencia por rendimiento académico insuficiente y baja asistencia.";
    } else if (riesgoNotas) {
      riesgoRepitencia = "El alumno presenta riesgo de repitencia por promedio de notas insuficiente.";
    } else if (riesgoAsistencia) {
      riesgoRepitencia = "El alumno presenta riesgo de repitencia por asistencia inferior al 85%.";
    }

    res.json({
      ...data,
      asistenciaPorcentaje: pctAsistencia,
      riesgoRepitencia
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};