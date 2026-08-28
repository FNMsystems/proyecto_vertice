import { getPersonalActivoModel, desvincularPersonalModel } from '../models/userModel.js';

export const getPersonal = async (req, res) => {
  try {
    const lista = await getPersonalActivoModel();
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la lista de personal' });
  }
};

export const desvincularPersonal = async (req, res) => {
  const { id } = req.params;
  const { motivo, fechaDesvinculacion } = req.body;

  try {
    const desvinculado = await desvincularPersonalModel(id, motivo, fechaDesvinculacion);
    if (!desvinculado) {
      return res.status(404).json({ error: 'Funcionario no encontrado' });
    }
    res.json({ mensaje: 'Funcionario desvinculado exitosamente', funcionario: desvinculado });
  } catch (error) {
    res.status(500).json({ error: 'Error al desvincular el funcionario' });
  }
};