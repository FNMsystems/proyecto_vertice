import { 
  getAlumnosMatriculadosModel, 
  getAlumnoDetalleModel, 
  registrarExpulsionModel 
} from '../models/alumnoModel.js';

export const getAlumnos = async (req, res) => {
  try {
    const alumnos = await getAlumnosMatriculadosModel();
    res.json(alumnos);
  } catch (error) {
    console.error('Error al obtener lista de alumnos:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar alumnos' });
  }
};

export const getAlumnoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const alumno = await getAlumnoDetalleModel(id);
    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    res.json(alumno);
  } catch (error) {
    console.error('Error al obtener detalle del alumno:', error);
    res.status(500).json({ error: 'Error al consultar el registro del alumno' });
  }
};

export const expulsarAlumno = async (req, res) => {
  const { id } = req.params;
  const { motivoDetalle, documentoUrl } = req.body;
  const registradoPorUsuarioId = req.usuario.id; 

  if (!motivoDetalle) {
    return res.status(400).json({ error: 'Debe proporcionar un motivo detallado para el registro de expulsión.' });
  }

  try {
    const resultado = await registrarExpulsionModel(
      id, 
      motivoDetalle, 
      registradoPorUsuarioId, 
      documentoUrl
    );

    if (!resultado) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json({
      mensaje: 'Alumno expulsado y registro histórico creado con éxito',
      ...resultado
    });
  } catch (error) {
    console.error('Error al procesar la expulsión:', error);
    res.status(500).json({ error: 'Error al registrar la expulsión en el sistema' });
  }
};