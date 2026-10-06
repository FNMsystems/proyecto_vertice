import express from 'express';

import {
  getResumenDirector,
  getAlumnosDirector,
  getDetalleAlumnoDirector,
  getDocentesDirector,
  getDetalleDocenteDirector,
  getCursosDirector,
  getDetalleCursoDirector,
  getAsignaturasDirector,
  getAsignacionesDirector,
  crearDocenteDirector,
  actualizarDocenteDirector,
  desvincularDocenteDirector,
  reactivarDocenteDirector,
  crearAsignacionDirector,
  actualizarAsignacionDirector,
  eliminarAsignacionDirector,
  getAsistenciaDirector,
  getEstadisticasAsistenciaDirector,
  getRendimientoDirector,
  getJustificativosDirector,
  getHorariosDirector,
  getAnotacionesDirector,
  desvincularAlumnoDirector,
  actualizarJustificativoDirector
} from '../controllers/directorController.js';

import {
  verificarToken,
  esDirector
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);
router.use(esDirector);

router.get('/resumen', getResumenDirector);

router.get('/alumnos', getAlumnosDirector);
router.get('/alumnos/:id', getDetalleAlumnoDirector);
router.put('/alumnos/:id/desvincular', desvincularAlumnoDirector);

router.get('/docentes', getDocentesDirector);
router.get('/docentes/:id', getDetalleDocenteDirector);
router.post('/docentes', crearDocenteDirector);
router.put('/docentes/:id', actualizarDocenteDirector);
router.put('/docentes/:id/desvincular', desvincularDocenteDirector);
router.put('/docentes/:id/reactivar', reactivarDocenteDirector);

router.get('/cursos', getCursosDirector);
router.get('/cursos/:id', getDetalleCursoDirector);

router.get('/asignaturas', getAsignaturasDirector);

router.get('/asignaciones', getAsignacionesDirector);
router.post('/asignaciones', crearAsignacionDirector);
router.put('/asignaciones/:id', actualizarAsignacionDirector);
router.delete('/asignaciones/:id', eliminarAsignacionDirector);

router.get('/asistencia', getAsistenciaDirector);
router.get('/asistencia/estadisticas', getEstadisticasAsistenciaDirector);

router.get('/rendimiento', getRendimientoDirector);

router.get('/justificativos', getJustificativosDirector);
router.put('/justificativos/:id', actualizarJustificativoDirector);

router.get('/horarios', getHorariosDirector);

router.get('/anotaciones', getAnotacionesDirector);

export default router;