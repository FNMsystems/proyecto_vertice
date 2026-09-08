import { 
  getAlumnosPorCursoModel, 
  registrarAtrasoModel, 
  validarRetiroQRModel, 
  confirmarRetiroModel 
} from '../models/inspectoriaModel.js';

export const getAlumnosCurso = async (req, res) => {
  try {
    const alumnos = await getAlumnosPorCursoModel();
    res.json(alumnos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const registrarAtraso = async (req, res) => {
  try {
    const { alumno_id, observacion } = req.body;
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString('es-CL', { hour12: false });
    
    const nuevoAtraso = await registrarAtrasoModel(alumno_id, fecha, hora, observacion);
    res.status(201).json({ mensaje: 'Atraso registrado correctamente', atraso: nuevoAtraso });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const validarQR = async (req, res) => {
  try {
    const { codigoQR } = req.body;
    const datosRetiro = await validarRetiroQRModel(codigoQR);

    if (!datosRetiro) {
      return res.status(404).json({ mensaje: 'Código QR inválido o expirado para el día de hoy.' });
    }

    res.json(datosRetiro);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const confirmarRetiro = async (req, res) => {
  try {
    const { retiroId } = req.body;
    const retiroConfirmado = await confirmarRetiroModel(retiroId);
    res.json({ mensaje: 'Retiro confirmado exitosamente', retiro: retiroConfirmado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};